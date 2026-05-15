const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({ host: '172.17.3.206', user: 'secom', password: 'secom123', database: 'secom' });
  try {
    console.log("--- Latest System Logs ---");
    // Try to see if there's a log table or trigger run history
    const [logs] = await pool.query("SELECT * FROM t_secom_trigger ORDER BY last_run DESC LIMIT 5");
    logs.forEach(l => {
      console.log(`Trigger ID: ${l.id}, Function: ${l.function_name}, Last Run: ${l.last_run}`);
    });
  } catch (err) {
    console.error('Query failed:', err.message);
  } finally {
    process.exit();
  }
}

main();
