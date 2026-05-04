const mysql = require('mysql2/promise');
const fetch = require('node-fetch'); // Next.js 환경이 아니면 필요할 수 있음

async function runTest() {
  // MySQL connection settings (assuming standard dev env)
  const connection = await mysql.createConnection({
    host: '172.17.3.206',
    user: 'secom',
    password: 'secom123',
    database: 'secom'
  });

  const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD (KST approximate)
  const dbDate = todayStr.replace(/-/g, '');
  
  console.log(`[TEST] Today: ${todayStr}, DB Date: ${dbDate}`);

  try {
    // 1. Setup Trigger
    const [triggers] = await connection.execute("SELECT id FROM t_secom_trigger WHERE time_type = 'REALTIME_CHECKIN' LIMIT 1");
    if (triggers.length === 0) {
       console.log("❌ No REALTIME_CHECKIN trigger found.");
       return;
    }
    const triggerId = triggers[0].id;

    // Cleanup
    await connection.execute("DELETE FROM t_secom_trigger_log WHERE trigger_id = ? AND DATE(created_at) = CURDATE()", [triggerId]);
    await connection.execute("DELETE FROM t_secom_workhistory WHERE WorkDate = ? AND Name LIKE 'TestUser_%'", [dbDate]);
    await connection.execute("DELETE FROM t_secom_person WHERE Sabun LIKE 'T00%'");

    // 2. Insert Test Data
    const users = [
      { name: 'TestUser_Success', sabun: 'T001', wsTime: '08:50:00', email: 'laika+t1@daangnservice.com' },
      { name: 'TestUser_Waiting', sabun: 'T002', wsTime: '', email: 'laika+t2@daangnservice.com' },
      { name: 'TestUser_Recovery', sabun: 'T003', wsTime: '09:10:00', email: 'laika+t3@daangnservice.com' }
    ];

    for (const u of users) {
      await connection.execute("INSERT INTO t_secom_person (Sabun, Name, Email, CardNo) VALUES (?, ?, ?, ?)", [u.sabun, u.name, u.email, u.sabun]);
      await connection.execute("INSERT INTO t_secom_workhistory (WorkDate, Name, WSTime, CardNo) VALUES (?, ?, ?, ?)", [dbDate, u.name, u.wsTime, u.sabun]);
    }

    // Pre-set Recovery user as 'waiting'
    await connection.execute(
      "INSERT INTO t_secom_trigger_log (trigger_id, trigger_name, sabun, name, email, notify_type, status, created_at) VALUES (?, 'REALTIME_CHECKIN', 'T003', 'TestUser_Recovery', 'laika+t3@daangnservice.com', 'checkin', 'waiting', NOW())",
      [triggerId]
    );

    console.log("[TEST] Setup complete. Triggering API via http.request...");

    const postData = JSON.stringify({ id: triggerId });
    const http = require('http');

    const apiResult = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/admin/bot/triggers/run',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => resolve(JSON.parse(body)));
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    console.log("[TEST] API Result:", apiResult);

    // 4. Verify Logs
    const [logs] = await connection.execute("SELECT sabun, name, status FROM t_secom_trigger_log WHERE trigger_id = ? AND DATE(created_at) = CURDATE()", [triggerId]);
    
    console.log("\n--- Log Results ---");
    logs.forEach(l => console.log(`- ${l.name} (${l.sabun}): ${l.status}`));

    const ok1 = logs.find(l => l.sabun === 'T001' && l.status === 'success');
    const ok2 = logs.find(l => l.sabun === 'T002' && l.status === 'waiting');
    const ok3 = logs.find(l => l.sabun === 'T003' && l.status === 'success');

    console.log("\n--- Verdict ---");
    console.log(ok1 ? "✅ Case 1 (Standard Success): PASSED" : "❌ Case 1: FAILED");
    console.log(ok2 ? "✅ Case 2 (Waiting for WSTime): PASSED" : "❌ Case 2: FAILED");
    console.log(ok3 ? "✅ Case 3 (Waiting -> Success): PASSED" : "❌ Case 3: FAILED");

  } catch (e) {
    console.error("Test Error:", e);
  } finally {
    await connection.end();
  }
}

runTest();
