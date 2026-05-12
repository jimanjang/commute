const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    host: '172.17.3.206',
    user: 'secom',
    password: 'secom123',
    database: 'secom',
  });

  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const dbDate = todayStr.replace(/-/g, '');
    const sabun = 'KS2508001';
    const name = 'Emily%';

    console.log(`🔍 Checking database for today (${todayStr} / ${dbDate})`);

    // 1. Trigger Info
    const [triggers] = await pool.query("SELECT * FROM t_secom_trigger WHERE id = 7");
    console.log("\n📌 Trigger #7 Config:", triggers[0]);

    // 2. Person Info
    const [persons] = await pool.query("SELECT * FROM t_secom_person WHERE Sabun = ? OR Name LIKE ?", [sabun, name]);
    console.log("\n📌 Person Info:", persons);

    if(persons.length === 0) {
       console.log("ERROR: No person found!");
       return;
    }
    const targetName = persons[0].Name;

    // 3. Work History Today
    const [work] = await pool.query("SELECT * FROM t_secom_workhistory WHERE WorkDate = ? AND Name = ?", [dbDate, targetName]);
    console.log("\n📌 Work History Today:", work);

    // 4. Logs Today
    const [logs] = await pool.query(
       `SELECT * FROM t_secom_trigger_log 
        WHERE sabun = ? AND DATE(CONVERT_TZ(created_at, '+00:00', '+09:00')) = ?`, 
       [sabun, todayStr]
    );
    console.log("\n📌 Trigger Logs Today for Emily:", logs);
    
    // 5. Logs Overall for Trigger 7 today
    const [allLogsToday] = await pool.query(
      `SELECT id, sabun, name, notify_type, status, error_message FROM t_secom_trigger_log 
       WHERE trigger_id = 7 AND DATE(CONVERT_TZ(created_at, '+00:00', '+09:00')) = ?`, 
      [todayStr]
    );
    console.log(`\n📌 Total Logs for Trigger 7 Today: ${allLogsToday.length}`);

  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

run();
