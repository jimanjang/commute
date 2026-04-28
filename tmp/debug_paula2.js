const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: '172.17.3.206', user: 'secom', password: 'secom123', database: 'secom'
});

async function main() {
  // 1. Paula info
  const [persons] = await pool.query("SELECT Name, Sabun, Email FROM t_secom_person WHERE Name LIKE '%Paula%'");
  const paula = persons[0];
  console.log("PAULA:", paula ? `${paula.Name} | ${paula.Sabun} | ${paula.Email}` : "NOT FOUND");

  // 2. Trigger targets
  const [targets] = await pool.query("SELECT sabun FROM t_secom_trigger_target WHERE trigger_id = 4");
  const sabuns = targets.map(t => t.sabun);
  console.log("TARGETS:", sabuns.join(', '));
  console.log("PAULA IN TARGETS:", paula ? sabuns.includes(paula.Sabun) : false);

  // 3. Today's logs for trigger 4
  const [logs] = await pool.query("SELECT name, notify_type, status, created_at FROM t_secom_trigger_log WHERE trigger_id = 4 AND DATE(created_at) = '2026-04-28' ORDER BY created_at ASC");
  console.log("TODAY LOGS COUNT:", logs.length);
  for (const l of logs) {
    console.log("  LOG:", l.name, "|", l.notify_type, "|", l.status, "|", l.created_at.toISOString());
  }

  // 4. Paula checkin
  const [work] = await pool.query("SELECT WSTime FROM t_secom_workhistory WHERE WorkDate = '20260428' AND Name LIKE '%Paula%'");
  console.log("PAULA CHECKIN:", work.length > 0 ? work[0].WSTime : "NONE");

  await pool.end();
}
main();
