const mysql = require('mysql2/promise');
const pool = mysql.createPool({ host: '172.17.3.206', user: 'secom', password: 'secom123', database: 'secom' });

async function main() {
  console.log('=== [1] 최근 스케줄러 실행 이력 (t_secom_scheduler_log) ===');
  try {
    const [logs] = await pool.query(
      "SELECT * FROM t_secom_scheduler_log ORDER BY executed_at DESC LIMIT 10"
    );
    if (logs.length === 0) {
      console.log('  ❌ 실행 이력 없음 (테이블이 비어있거나 오늘 처음 생성됨)');
    } else {
      for (const l of logs) {
        const kst = new Date(new Date(l.executed_at).getTime() + 9*60*60*1000).toISOString().replace('T',' ').slice(0,19);
        console.log(`  [${kst} KST] count: ${l.executed_count} | list: ${l.executed_list} | err: ${l.error_message || 'none'}`);
      }
    }
  } catch (e) {
    console.log('  ❌ 조회 실패:', e.message);
  }

  console.log('\n=== [2] 트리거 상태 (t_secom_trigger) ===');
  const [triggers] = await pool.query(
    "SELECT id, function_name, last_run, is_active FROM t_secom_trigger WHERE id = 4"
  );
  for (const t of triggers) {
    const kst = t.last_run ? new Date(new Date(t.last_run).getTime() + 9*60*60*1000).toISOString().replace('T',' ').slice(0,19) : 'never';
    console.log(`  ID: ${t.id} | ${t.function_name} | Active: ${t.is_active} | Last Run: ${kst} KST`);
  }

  await pool.end();
}
main().catch(console.error);
