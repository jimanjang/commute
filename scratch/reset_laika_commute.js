const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '172.17.3.206', user: 'secom', password: 'secom123', database: 'secom',
  waitForConnections: true, connectionLimit: 3
});

function getKstDateStr() {
  const kst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const yyyy = kst.getFullYear();
  const mm = String(kst.getMonth() + 1).padStart(2, '0');
  const dd = String(kst.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

async function main() {
  const connection = await pool.getConnection();
  try {
    const todayStr = getKstDateStr();
    const cardNo = '0109338254950';
    const sabun = 'KS2602010';
    
    console.log('\x1b[36m%s\x1b[0m', '----------------------------------------------------------');
    console.log('\x1b[36m%s\x1b[0m', `  🧼 Laika(라이카) 오늘(${todayStr}) 근태 로그 초기화 시작`);
    console.log('\x1b[36m%s\x1b[0m', '----------------------------------------------------------');
    
    // 1. Delete today's workhistory record
    const [delWork] = await connection.query(
      `DELETE FROM t_secom_workhistory WHERE WorkDate = ? AND Sabun = ?`,
      [todayStr, sabun]
    );
    console.log(`  - t_secom_workhistory 오늘 기록 삭제 완료 (${delWork.affectedRows}행 삭제됨)`);
    
    // 2. Delete today's alarm records
    const [delAlarm] = await connection.query(
      `DELETE FROM t_secom_alarm WHERE ATime LIKE ? AND CardNo = ?`,
      [`${todayStr}%`, cardNo]
    );
    console.log(`  - t_secom_alarm 오늘 지문 기록 삭제 완료 (${delAlarm.affectedRows}행 삭제됨)`);
    
    console.log('\n\x1b[32m%s\x1b[0m', '  ✅ 초기화 완료! 이제 즉시 테스트해 보실 수 있습니다!');
    console.log('\x1b[90m%s\x1b[0m', '  ----------------------------------------------------------');
    console.log('  👉 [테스트 진행 방법]');
    console.log('  1. 지문 단말기에 손가락을 대서 지문을 찍습니다.');
    console.log('  2. 세콤 PC(세콤링크)가 지문을 인식하면 10초 내로 MySQL의 t_secom_alarm에 들어옵니다.');
    console.log('  3. 백엔드 실시간 미러링 데몬(commute_realtime_sync.js) 콘솔 화면에');
    console.log(`     "🆕 [출근 감지] Laika(라이카)님 출근 기록 생성: ${todayStr}xxxxxx"가 뜨는지 확인합니다.`);
    console.log('  4. 데이터베이스나 사내 프로그램에서 오늘 근태 데이터가 실시간 복원되었는지 확인합니다.');
    console.log('\x1b[90m%s\x1b[0m', '  ----------------------------------------------------------');
    
  } catch (err) {
    console.error('❌ 에러 발생:', err.message);
  } finally {
    connection.release();
    await pool.end();
  }
}

main();
