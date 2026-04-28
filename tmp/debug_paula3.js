const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: '172.17.3.206', user: 'secom', password: 'secom123', database: 'secom'
});

async function main() {
  const [targets] = await pool.query("SELECT sabun FROM t_secom_trigger_target WHERE trigger_id = 4");
  const sabuns = targets.map(t => t.sabun);

  const [paula] = await pool.query("SELECT Sabun FROM t_secom_person WHERE Name LIKE '%Paula%'");
  const paulaSabun = paula[0]?.Sabun;

  console.log("Trigger targets:", sabuns);
  console.log("Paula Sabun:", paulaSabun);
  console.log("Paula in targets:", sabuns.includes(paulaSabun));

  // Check today's logs - was Paula sent?
  const [logs] = await pool.query(
    "SELECT name, notify_type, status, created_at FROM t_secom_trigger_log WHERE trigger_id = 4 AND DATE(created_at) = '2026-04-28' ORDER BY created_at ASC"
  );
  console.log("\nToday's logs:");
  for (const l of logs) {
    console.log("  ", l.name, "|", l.notify_type, "|", l.status, "| KST:", new Date(l.created_at.getTime()).toLocaleString('ko-KR', {timeZone:'Asia/Seoul'}));
  }

  await pool.end();
}
main();
