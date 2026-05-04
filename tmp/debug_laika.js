const mysql = require('mysql2/promise');
const pool = mysql.createPool({ host: '172.17.3.206', user: 'secom', password: 'secom123', database: 'secom' });

async function main() {
  // Laika 정보
  const [persons] = await pool.query(
    "SELECT Name, Sabun, Email FROM t_secom_person WHERE Name LIKE ? OR Name LIKE ?",
    ['%Laika%', '%라이카%']
  );
  console.log('=== Laika 정보 ===');
  for (const p of persons) console.log(`  ${p.Name} | ${p.Sabun} | ${p.Email}`);

  // trigger #4 targets
  const [targets] = await pool.query(
    "SELECT tt.sabun, p.Name FROM t_secom_trigger_target tt LEFT JOIN t_secom_person p ON CONVERT(p.Sabun USING utf8mb4) = CONVERT(tt.sabun USING utf8mb4) WHERE tt.trigger_id = 4"
  );
  console.log('\n=== Trigger #4 Target 목록 ===');
  if (targets.length === 0) console.log('  (targets 없음 = 전원 대상)');
  for (const t of targets) console.log(`  ${t.sabun} | ${t.Name}`);

  // Laika가 targets에 있는지 확인
  if (persons.length > 0) {
    const laikaSabun = persons[0].Sabun;
    const inTarget = targets.some(t => t.sabun === laikaSabun);
    console.log(`\n=== Laika(${laikaSabun}) 타겟 포함 여부: ${inTarget ? '✅ 포함됨' : '❌ 포함 안 됨'} ===`);
  }

  // 최근 trigger_log
  const [logs] = await pool.query(
    "SELECT * FROM t_secom_trigger_log WHERE trigger_id = 4 ORDER BY created_at DESC LIMIT 10"
  );
  console.log('\n=== 최근 trigger_log (trigger_id=4, 최근 10건) ===');
  if (logs.length === 0) console.log('  (없음)');
  for (const l of logs) {
    const kst = new Date(new Date(l.created_at).getTime() + 9*60*60*1000).toISOString().replace('T',' ').slice(0,19);
    console.log(`  [${kst} KST] ${l.name} | ${l.notify_type} | ${l.status} | ${l.error_message || ''}`);
  }

  await pool.end();
}
main().catch(console.error);
