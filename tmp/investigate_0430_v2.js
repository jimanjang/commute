const mysql = require('mysql2/promise');
const pool = mysql.createPool({ host: '172.17.3.206', user: 'secom', password: 'secom123', database: 'secom' });

async function main() {
  const today = '20260430';
  const todayStr = '2026-04-30';

  console.log('=== [1] 오늘(2026-04-30) 전체 출근 기록 요약 ===');
  const [allWork] = await pool.query(
    "SELECT Name, Sabun, WSTime FROM t_secom_workhistory WHERE WorkDate = ? ORDER BY WSTime ASC",
    [today]
  );
  console.log(`  총 ${allWork.length}건의 기록 발견`);
  for (const w of allWork) {
    if (['Ellie', '엘리', 'Ocean', '오션', 'Liv', '리브', 'Amir', '아미르', 'Riley', '라일리', 'Laika', '라이카'].some(n => w.Name.includes(n))) {
      console.log(`  📍 ${w.Name} (${w.Sabun}) -> WSTime: ${w.WSTime}`);
    }
  }

  console.log('\n=== [2] 오늘 트리거 로그 (Collation 수정) ===');
  const [logs] = await pool.query(
    `SELECT * FROM t_secom_trigger_log 
     WHERE DATE(CONVERT_TZ(created_at, '+00:00', '+09:00')) = ?
     ORDER BY created_at ASC`,
    [todayStr]
  );
  
  const targets = ['Ellie', '엘리', 'Ocean', '오션', 'Liv', '리브', 'Amir', '아미르', 'Riley', '라일리', 'Laika', '라이카'];
  for (const l of logs) {
    if (targets.some(n => l.name.includes(n))) {
      const kst = new Date(new Date(l.created_at).getTime() + 9*60*60*1000).toISOString().replace('T',' ').slice(0,19);
      console.log(`  [${kst} KST] ${l.name} | ${l.notify_type} | ${l.status} | ${l.error_message || ''}`);
    }
  }

  console.log('\n=== [3] Trigger #4 Target 상세 ===');
  const [targetRows] = await pool.query(
    "SELECT tt.sabun, p.Name, p.Email FROM t_secom_trigger_target tt LEFT JOIN t_secom_person p ON CONVERT(p.Sabun USING utf8mb4) = CONVERT(tt.sabun USING utf8mb4) WHERE tt.trigger_id = 4"
  );
  for (const t of targetRows) {
    console.log(`  ${t.sabun} | ${t.Name} | ${t.Email}`);
  }

  await pool.end();
}
main().catch(console.error);
