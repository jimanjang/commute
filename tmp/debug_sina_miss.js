const mysql = require('mysql2/promise');
const pool = mysql.createPool({ host: '172.17.3.206', user: 'secom', password: 'secom123', database: 'secom' });

async function main() {
  const today = '20260429';
  const todayStr = '2026-04-29';
  const sinaSabun = 'KS2511003';

  console.log('=== [1] 시나(Sina) 오늘 출근 기록 ===');
  const [work] = await pool.query(
    "SELECT Name, Sabun, WSTime FROM t_secom_workhistory WHERE WorkDate = ? AND Sabun = ?",
    [today, sinaSabun]
  );
  if (work.length === 0) {
    console.log('  ❌ 오늘 출근 기록 없음');
  } else {
    for (const w of work) {
      console.log(`  ${w.Name} (${w.Sabun}) -> WSTime: ${w.WSTime}`);
    }
  }

  console.log('\n=== [2] 시나 오늘 트리거 로그 ===');
  const [logs] = await pool.query(
    `SELECT * FROM t_secom_trigger_log 
     WHERE sabun = ? AND DATE(CONVERT_TZ(created_at, '+00:00', '+09:00')) = ?
     ORDER BY created_at ASC`,
    [sinaSabun, todayStr]
  );
  if (logs.length === 0) {
    console.log('  ❌ 오늘 트리거 로그 없음');
  } else {
    for (const l of logs) {
      const kst = new Date(new Date(l.created_at).getTime() + 9*60*60*1000).toISOString().replace('T',' ').slice(0,19);
      console.log(`  [${kst} KST] ${l.notify_type} | ${l.status} | ${l.error_message || ''}`);
    }
  }

  console.log('\n=== [3] 최근 스케줄러 로그 ===');
  const [schedLogs] = await pool.query(
    "SELECT * FROM t_secom_scheduler_log ORDER BY executed_at DESC LIMIT 5"
  );
  for (const sl of schedLogs) {
    const kst = new Date(new Date(sl.executed_at).getTime() + 9*60*60*1000).toISOString().replace('T',' ').slice(0,19);
    console.log(`  [${kst} KST] count: ${sl.executed_count} | err: ${sl.error_message || 'none'}`);
  }

  console.log('\n=== [4] 트리거 상태 ===');
  const [trigger] = await pool.query("SELECT * FROM t_secom_trigger WHERE id = 4");
  const lastRunKst = new Date(new Date(trigger[0].last_run).getTime() + 9*60*60*1000).toISOString().replace('T',' ').slice(0,19);
  console.log(`  Last Run: ${lastRunKst} KST`);

  await pool.end();
}
main().catch(console.error);
