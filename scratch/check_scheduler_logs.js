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
    const [logs] = await pool.query(
      "SELECT * FROM t_secom_scheduler_log WHERE DATE(executed_at) = '2026-05-18' ORDER BY executed_at DESC LIMIT 50"
    );
    console.log("Scheduler Logs for today:", logs.length);
    console.log(logs);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
    process.exit();
  }
}

main();
