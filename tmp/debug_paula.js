const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: '172.17.3.206', user: 'secom', password: 'secom123', database: 'secom'
});

async function main() {
  // 1. Find Paula
  const [persons] = await pool.query("SELECT Name, Sabun, Email FROM t_secom_person WHERE Name LIKE '%Paula%' OR Name LIKE '%파울라%'");
  console.log("=== Paula in t_secom_person ===");
  console.log(JSON.stringify(persons, null, 2));

  // 2. Check today's work history for Paula
  const [work] = await pool.query("SELECT Name, WSTime FROM t_secom_workhistory WHERE WorkDate = '20260428' AND (Name LIKE '%Paula%' OR Name LIKE '%파울라%')");
  console.log("\n=== Paula's checkin today ===");
  console.log(JSON.stringify(work, null, 2));

  // 3. Trigger targets
  const [targets] = await pool.query("SELECT sabun FROM t_secom_trigger_target WHERE trigger_id = 4");
  const sabuns = targets.map(t => t.sabun);
  console.log("\n=== Trigger #4 targets ===");
  console.log(sabuns);

  // 4. Is Paula's sabun in target list?
  if (persons.length > 0) {
    const paulaSabun = persons[0].Sabun;
    console.log("\n=== Paula's Sabun:", paulaSabun, "| In targets:", sabuns.includes(paulaSabun), "===");
  }

  // 5. Today's trigger logs
  const [logs] = await pool.query("SELECT id, name, sabun, email, notify_type, status, error_message, created_at FROM t_secom_trigger_log WHERE trigger_id = 4 AND DATE(created_at) = '2026-04-28' ORDER BY created_at ASC");
  console.log("\n=== Today's logs for trigger #4 ===");
  for (const l of logs) {
    console.log(`  ${l.created_at.toISOString()} | ${l.name} | ${l.notify_type} | ${l.status} | ${l.error_message || 'OK'}`);
  }

  // 6. All today's checkins
  const [allWork] = await pool.query("SELECT Name, WSTime FROM t_secom_workhistory WHERE WorkDate = '20260428' ORDER BY WSTime ASC");
  console.log("\n=== All checkins today ===");
  for (const w of allWork) {
    const t = w.WSTime;
    const timeStr = t && t.length >= 12 ? `${t.slice(8,10)}:${t.slice(10,12)}` : t;
    console.log(`  ${w.Name} -> ${timeStr}`);
  }

  await pool.end();
}
main();
