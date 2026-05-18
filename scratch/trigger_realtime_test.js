const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: '172.17.3.206',
    user: 'secom',
    password: 'secom123',
    database: 'secom',
    port: 3306
  });

  try {
    console.log("Temporarily deleting Amber's trigger log for today to simulate pending check-in...");
    await pool.query(
      "DELETE FROM t_secom_trigger_log WHERE trigger_id = 7 AND sabun = 'KS2512003' AND DATE(created_at) = '2026-05-18'"
    );

    console.log("Triggering REALTIME_CHECKIN (Trigger ID: 7)...");
    const res = await fetch('http://localhost:3005/api/admin/bot/triggers/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 7 })
    });
    const json = await res.json();
    console.log("Trigger 7 execution response:");
    console.log(JSON.stringify(json, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
    process.exit();
  }
}

main();
