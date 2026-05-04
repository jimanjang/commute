const mysql = require('mysql2/promise');
const pool = mysql.createPool({ host: '172.17.3.206', user: 'secom', password: 'secom123', database: 'secom' });

async function main() {
  const today = '20260430';
  const todayStr = '2026-04-30';
  const names = ['엘리', '오션', '리브', '아미르', '라일리', '라이카'];

  console.log('=== [1] 오늘(2026-04-30) 관련자 출근 기록 ===');
  const [work] = await pool.query(
    "SELECT Name, Sabun, WSTime FROM t_secom_workhistory WHERE WorkDate = ? AND Name IN (?)",
    [today, names]
  );
  if (work.length === 0) {
    console.log('  ❌ 오늘 출근 기록 없음');
  } else {
    for (const w of work) {
      console.log(`  ${w.Name} (${w.Sabun}) -> WSTime: ${w.WSTime}`);
    }
  }

  console.log('\n=== [2] 오늘 트리거 로그 (상세) ===');
  const [logs] = await pool.query(
    `SELECT * FROM t_secom_trigger_log 
     WHERE DATE(CONVERT_TZ(created_at, '+00:00', '+09:00')) = ?
     AND (name IN (?) OR sabun IN (SELECT sabun FROM t_secom_person WHERE Name IN (?)))
     ORDER BY created_at ASC`,
    [todayStr, names, names]
  );
  if (logs.length === 0) {
    console.log('  ❌ 오늘 트리거 로그 없음');
  } else {
    for (const l of logs) {
      const kst = new Date(new Date(l.created_at).getTime() + 9*60*60*1000).toISOString().replace('T',' ').slice(0,19);
      console.log(`  [${kst} KST] ${l.name} | ${l.notify_type} | ${l.status} | ${l.error_message || ''}`);
    }
  }

  console.log('\n=== [3] Trigger #4 Target 목록 ===');
  const [targets] = await pool.query(
    "SELECT tt.sabun, p.Name FROM t_secom_trigger_target tt LEFT JOIN t_secom_person p ON p.Sabun = tt.sabun WHERE tt.trigger_id = 4"
  );
  for (const t of targets) {
    console.log(`  ${t.sabun} | ${t.Name}`);
  }

  await pool.end();
}
main().catch(console.error);
