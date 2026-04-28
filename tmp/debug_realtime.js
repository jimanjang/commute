const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: '172.17.3.206', user: 'secom', password: 'secom123', database: 'secom'
});

async function main() {
  // 1. Today's trigger logs
  const [logs] = await pool.query(
    `SELECT id, name, email, notify_type, status, created_at 
     FROM t_secom_trigger_log 
     WHERE trigger_id = 4 AND DATE(created_at) = '2026-04-28'
     ORDER BY created_at ASC`
  );
  console.log("=== Today's Trigger Logs (trigger_id=4) ===");
  for (const l of logs) {
    const kst = new Date(new Date(l.created_at).getTime() + 9*60*60*1000);
    console.log(`  [${kst.toISOString().replace('T',' ').slice(0,19)} KST] ${l.name} | ${l.email} | ${l.status}`);
  }

  // 2. Today's checkin records for target members
  const [targets] = await pool.query('SELECT sabun FROM t_secom_trigger_target WHERE trigger_id = 4');
  const sabuns = targets.map(t => t.sabun);
  const [persons] = await pool.query('SELECT Name, Sabun, Email FROM t_secom_person WHERE Sabun IN (?)', [sabuns]);
  
  console.log("\n=== Target Members ===");
  for (const p of persons) {
    console.log(`  ${p.Name} (${p.Sabun}) - ${p.Email}`);
  }

  const names = persons.map(p => p.Name);
  const [work] = await pool.query(
    `SELECT Name, WSTime FROM t_secom_workhistory WHERE WorkDate = '20260428' AND Name IN (?)`,
    [names]
  );
  console.log("\n=== Their Check-ins Today ===");
  for (const w of work) {
    const t = w.WSTime;
    const timeStr = t && t.length >= 12 ? `${t.slice(8,10)}:${t.slice(10,12)}` : t;
    console.log(`  ${w.Name} -> WSTime: ${w.WSTime} (${timeStr})`);
  }

  // 3. Check the time_type and days_of_week
  const [trigger] = await pool.query('SELECT * FROM t_secom_trigger WHERE id = 4');
  console.log("\n=== Trigger Config ===");
  console.log(`  time_type: ${trigger[0].time_type}`);
  console.log(`  days_of_week: ${trigger[0].days_of_week}`);
  console.log(`  last_run: ${trigger[0].last_run}`);
  console.log(`  is_active: ${trigger[0].is_active}`);

  await pool.end();
}

main();
