const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: '172.17.3.206', user: 'secom', password: 'secom123', database: 'secom'
});

async function main() {
  const today = '20260429';
  const todayStr = '2026-04-29';

  console.log('=== [1] 오늘(2026-04-29) 출근 기록 (08:00~09:00) ===');
  const [work] = await pool.query(
    `SELECT Name, Sabun, WSTime FROM t_secom_workhistory 
     WHERE WorkDate = ? 
     ORDER BY WSTime ASC`,
    [today]
  );
  if (work.length === 0) {
    console.log('  ❌ 오늘 출근 기록 없음 (t_secom_workhistory)');
  }
  for (const w of work) {
    const t = w.WSTime;
    const timeStr = t && t.length >= 12 ? `${t.slice(8,10)}:${t.slice(10,12)}` : t;
    console.log(`  ${w.Name} (${w.Sabun || '-'}) -> WSTime: ${w.WSTime} (${timeStr})`);
  }

  console.log('\n=== [2] 오늘 트리거 실행 로그 (REALTIME 트리거) ===');
  const [logs] = await pool.query(
    `SELECT tl.id, t.time_type, tl.trigger_id, tl.name, tl.email, tl.notify_type, tl.status, tl.error_message, tl.created_at
     FROM t_secom_trigger_log tl
     JOIN t_secom_trigger t ON t.id = tl.trigger_id
     WHERE DATE(CONVERT_TZ(tl.created_at, '+00:00', '+09:00')) = ?
     ORDER BY tl.created_at ASC`,
    [todayStr]
  );
  if (logs.length === 0) {
    console.log('  ❌ 오늘 트리거 실행 로그 없음');
  }
  for (const l of logs) {
    const kst = new Date(new Date(l.created_at).getTime() + 9*60*60*1000);
    const kstStr = kst.toISOString().replace('T',' ').slice(0,19);
    console.log(`  [${kstStr} KST] trigger_id=${l.trigger_id}(${l.time_type}) ${l.name} | ${l.notify_type} | ${l.status} ${l.error_message ? '| ERR: '+l.error_message : ''}`);
  }

  console.log('\n=== [3] 모든 REALTIME_CHECKIN 트리거 상태 ===');
  const [triggers] = await pool.query(
    `SELECT id, function_name, time_type, is_active, last_run, days_of_week FROM t_secom_trigger WHERE time_type = 'REALTIME_CHECKIN'`
  );
  if (triggers.length === 0) {
    console.log('  ❌ REALTIME_CHECKIN 트리거 없음');
  }
  for (const t of triggers) {
    const lastRunKst = t.last_run ? new Date(new Date(t.last_run).getTime() + 9*60*60*1000).toISOString().replace('T',' ').slice(0,19) : 'never';
    console.log(`  id=${t.id} | ${t.function_name} | active=${t.is_active} | last_run=${lastRunKst} KST | days=${t.days_of_week}`);
  }

  console.log('\n=== [4] scheduler.js 스케줄 확인 (파일 없으면 스킵) ===');
  try {
    const fs = require('fs');
    const sched = fs.readFileSync('../scheduler.js', 'utf-8');
    // find REALTIME lines
    const lines = sched.split('\n').filter(l => l.includes('REALTIME') || l.includes('trigger') || l.includes('cron') || l.includes('schedule'));
    console.log(lines.slice(0, 20).join('\n'));
  } catch(e) {
    console.log('  스킵:', e.message);
  }

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
