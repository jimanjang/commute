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
      "SELECT trigger_id, trigger_name, sabun, name, email, notify_type, status, error_message, created_at FROM t_secom_trigger_log WHERE DATE(created_at) = '2026-05-18' AND trigger_id = 7 ORDER BY created_at ASC LIMIT 100"
    );
    console.log("Total trigger 7 logs today:", logs.length);
    const manualRetries = logs.filter(l => l.trigger_name === 'manual_retry');
    const autoAlerts = logs.filter(l => l.trigger_name !== 'manual_retry');
    console.log("Manual Retries today count:", manualRetries.length);
    console.log("Automatic Alerts today count:", autoAlerts.length);
    if (autoAlerts.length > 0) {
      console.log("Sample automatic alerts:", autoAlerts.slice(0, 10));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
    process.exit();
  }
}

main();
