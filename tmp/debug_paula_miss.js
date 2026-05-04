const mysql = require('mysql2/promise');
const pool = mysql.createPool({ host: '172.17.3.206', user: 'secom', password: 'secom123', database: 'secom' });

async function main() {
  const today = '20260429';
  const todayStr = '2026-04-29';
  const paulaSabun = 'KS2512001';

  console.log('=== [1] 파울라(Paula) 오늘 출근 기록 ===');
  const [work] = await pool.query(
    "SELECT Name, Sabun, WSTime FROM t_secom_workhistory WHERE WorkDate = ? AND Sabun = ?",
    [today, paulaSabun]
  );
  if (work.length === 0) {
    console.log('  ❌ 오늘 출근 기록 없음');
  } else {
    for (const w of work) {
      console.log(`  ${w.Name} (${w.Sabun}) -> WSTime: ${w.WSTime}`);
    }
  }

  console.log('\n=== [2] 파울라 오늘 트리거 로그 ===');
  const [logs] = await pool.query(
    `SELECT * FROM t_secom_trigger_log 
     WHERE sabun = ? AND DATE(CONVERT_TZ(created_at, '+00:00', '+09:00')) = ?
     ORDER BY created_at ASC`,
    [paulaSabun, todayStr]
  );
  if (logs.length === 0) {
    console.log('  ❌ 오늘 트리거 로그 없음');
  } else {
    for (const l of logs) {
      const kst = new Date(new Date(l.created_at).getTime() + 9*60*60*1000).toISOString().replace('T',' ').slice(0,19);
      console.log(`  [${kst} KST] ${l.notify_type} | ${l.status} | ${l.error_message || ''}`);
    }
  }

  await pool.end();
}
main().catch(console.error);
