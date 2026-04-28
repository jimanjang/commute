const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: '172.17.3.206', user: 'secom', password: 'secom123', database: 'secom'
});

async function main() {
  const [targets] = await pool.query("SELECT sabun FROM t_secom_trigger_target WHERE trigger_id = 4");
  const sabunList = targets.map(t => t.sabun);

  const [paula] = await pool.query("SELECT Sabun FROM t_secom_person WHERE Name LIKE '%Paula%'");
  const pSabun = paula[0] ? paula[0].Sabun : 'N/A';

  const lines = [];
  lines.push("TARGETS: " + sabunList.join(", "));
  lines.push("PAULA_SABUN: " + pSabun);
  lines.push("IN_TARGETS: " + sabunList.includes(pSabun));

  const [logs] = await pool.query(
    "SELECT name, sabun, notify_type, status, created_at FROM t_secom_trigger_log WHERE trigger_id = 4 AND DATE(created_at) = '2026-04-28' ORDER BY created_at ASC"
  );
  lines.push("LOG_COUNT: " + logs.length);
  for (const l of logs) {
    lines.push("LOG: " + [l.name, l.sabun, l.notify_type, l.status, l.created_at.toISOString()].join(" | "));
  }

  require('fs').writeFileSync('tmp/paula_debug.txt', lines.join('\n'), 'utf8');
  console.log('Done. Written to tmp/paula_debug.txt');
  await pool.end();
}
main();
