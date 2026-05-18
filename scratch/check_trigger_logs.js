const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    host: "172.17.3.206",
    port: 3306,
    user: "secom",
    password: "secom123",
    database: "secom",
  });

  try {
    const [rows] = await pool.query(
      `SELECT id, trigger_id, trigger_name, sabun, name, email, notify_type, status, created_at,
              DATE(CONVERT_TZ(created_at, '+00:00', '+09:00')) as kst_date
       FROM t_secom_trigger_log 
       WHERE DATE(CONVERT_TZ(created_at, '+00:00', '+09:00')) = '2026-05-18'
       ORDER BY id DESC LIMIT 20`
    );
    console.log("Trigger logs for today:", rows);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}
run();
