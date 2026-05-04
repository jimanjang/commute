const pool = require('../src/lib/mysql').default;
const { getTodayStr } = require('../src/lib/time');

async function runTest() {
  const todayStr = getTodayStr();
  const dbDate = todayStr.replace(/-/g, '');
  console.log(`[TEST] Starting Realtime Notification Test for ${todayStr} (${dbDate})`);

  try {
    // 0. Setup: Find or create a test trigger
    const [triggers] = await pool.query("SELECT id FROM t_secom_trigger WHERE time_type = 'REALTIME_CHECKIN' LIMIT 1");
    if (triggers.length === 0) {
      console.log("❌ REALTIME_CHECKIN trigger not found. Please create one in UI first.");
      return;
    }
    const triggerId = triggers[0].id;
    console.log(`[TEST] Using Trigger ID: ${triggerId}`);

    // Cleanup previous test logs for today to avoid interference
    await pool.query("DELETE FROM t_secom_trigger_log WHERE trigger_id = ? AND DATE(created_at) = CURDATE()", [triggerId]);
    
    // 1. Prepare Test Data in t_secom_workhistory
    // User A: Normal Check-in (Success Expected)
    // User B: Missing WSTime (Waiting Expected)
    // User C: Waiting -> Success (Recovery Expected)
    
    const testUsers = [
      { name: 'TestUser_Success', sabun: 'T001', wsTime: '08:55:12' },
      { name: 'TestUser_Waiting', sabun: 'T002', wsTime: '' },
      { name: 'TestUser_Recovery', sabun: 'T003', wsTime: '09:05:00' }
    ];

    // Ensure users exist in t_secom_person
    for(const u of testUsers) {
      await pool.query("INSERT INTO t_secom_person (Sabun, Name, Email) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE Name=VALUES(Name)", [u.sabun, u.name, `laika+${u.sabun}@daangnservice.com`]);
    }

    // Insert workhistory
    await pool.query("DELETE FROM t_secom_workhistory WHERE WorkDate = ? AND Name LIKE 'TestUser_%'", [dbDate]);
    for(const u of testUsers) {
       await pool.query("INSERT INTO t_secom_workhistory (WorkDate, Name, WSTime) VALUES (?, ?, ?)", [dbDate, u.name, u.wsTime]);
    }

    // Pre-set User C as 'waiting' in log
    await pool.query(
      "INSERT INTO t_secom_trigger_log (trigger_id, trigger_name, sabun, name, email, notify_type, status, created_at) VALUES (?, 'TEST', ?, ?, ?, 'checkin', 'waiting', NOW())",
      [triggerId, 'T003', 'TestUser_Recovery', 'laika+T003@daangnservice.com']
    );

    console.log("[TEST] Data setup complete. Mocking API call...");

    // 2. Call the trigger run logic (Internal simulation)
    // Since we can't easily call the API route handler with a real Request object here, 
    // we'll just check the database after the scheduler/admin would have triggered it.
    // To be most accurate, let's use a real HTTP call if the server is running, or just run the logic.
    
    const response = await fetch(`http://localhost:3000/api/admin/bot/triggers/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: triggerId })
    });
    
    const result = await response.json();
    console.log("[TEST] API Result:", result);

    // 3. Verify Database State
    const [logs] = await pool.query("SELECT sabun, name, status, notify_type FROM t_secom_trigger_log WHERE trigger_id = ? AND DATE(created_at) = CURDATE()", [triggerId]);
    
    console.log("\n=== Final Log State Verification ===");
    for(const log of logs) {
      console.log(`- ${log.name} (${log.sabun}): Status=${log.status}, Type=${log.notify_type}`);
    }

    // Expectations Check
    const successUser = logs.find(l => l.sabun === 'T001' && l.status === 'success');
    const waitingUser = logs.find(l => l.sabun === 'T002' && l.status === 'waiting');
    const recoveryUser = logs.find(l => l.sabun === 'T003' && l.status === 'success');

    console.log("\n=== Test Results Summary ===");
    console.log(successUser ? "✅ Case 1 (Success): PASSED" : "❌ Case 1 (Success): FAILED");
    console.log(waitingUser ? "✅ Case 2 (Waiting): PASSED" : "❌ Case 2 (Waiting): FAILED");
    console.log(recoveryUser ? "✅ Case 3 (Recovery): PASSED" : "❌ Case 3 (Recovery): FAILED");

  } catch (err) {
    console.error("❌ Test failed with error:", err);
  } finally {
    process.exit();
  }
}

runTest();
