const mysql = require('mysql2/promise');
const http = require('http');

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

async function triggerApi(triggerId) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ id: triggerId });
    const req = http.request({
      hostname: 'localhost',
      port: 3005,
      path: '/api/admin/bot/triggers/run',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: 'JSON Parse Error', raw: data });
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

async function main() {
  const connection = await pool.getConnection();
  try {
    const todayStr = getKstDateStr(); // 20260518
    console.log('\x1b[36m%s\x1b[0m', '----------------------------------------------------------');
    console.log('\x1b[36m%s\x1b[0m', `  🧪 내일 아침 리얼 가라 데이터 시나리오 테스트 시작 (날짜: ${todayStr})`);
    console.log('\x1b[36m%s\x1b[0m', '----------------------------------------------------------');

    // 1. Clean today's database logs
    const cardNos = ['0109338254950', '0105588245987', '0104418278780', '0107777777777'];
    const sabuns = ['KS2602010', 'KS2512012', 'KS2604003'];

    await connection.query(`DELETE FROM t_secom_workhistory WHERE WorkDate = ? AND Sabun IN (?, ?, ?)`, [todayStr, ...sabuns]);
    await connection.query(`DELETE FROM t_secom_alarm WHERE ATime LIKE ? AND CardNo IN (?, ?, ?, ?)`, [`${todayStr}%`, ...cardNos]);
    await connection.query(`DELETE FROM t_secom_trigger_log WHERE sabun IN (?, ?, ?) AND DATE(created_at) = ?`, [...sabuns, todayStr]);

    console.log('  🧹 테스트 대상자들의 오늘자 데이터 완전 초기화 완료');

    // 2. Insert mock alarm events (지문 찍힘)
    console.log('\n  👉 [1단계: 지문 찍힘 가라 데이터 주입]');
    
    const insertQuery = `
      INSERT INTO t_secom_alarm (
        ATime, CardNo, Name, InsertTime, 
        ID, EqCode, Master, Param, Ack, Transfer, AckMode, 
        State, Flag1, Flag2, Flag3, Flag4
      ) VALUES (?, ?, ?, ?, 1, 1000, 2, 0, 1, 0, 0, 'W', '4', '0', '0', '1')
    `;

    // (A) Laika: 09:30 정상 출근
    await connection.query(insertQuery, [`${todayStr}093000`, '0109338254950', 'Laika', todayStr]);
    console.log(`    - Laika(정상출근) 지문 주입 완료 (시각: 09:30:00)`);

    // (B) Alice: 09:45 지문 미등록 카드 태깅
    await connection.query(insertQuery, [`${todayStr}094500`, '0107777777777', 'Alice', todayStr]);
    console.log(`    - Alice(지문미등록) 지문 주입 완료 (시각: 09:45:00)`);

    // (C) Heather: 10:15 지각 출근
    await connection.query(insertQuery, [`${todayStr}101500`, '0105588245987', 'Heather', todayStr]);
    console.log(`    - Heather(지각출근) 지문 주입 완료 (시각: 10:15:00)`);
    console.log(`    * Maren(결근)은 지문 태깅 없음`);

    // 3. Wait for scheduler.js to process (7 seconds)
    console.log('\n  ⏳ [2단계: 가동 중인 스케줄러 데몬이 감지하길 대기 중 (7초)...]');
    await new Promise(r => setTimeout(r, 7000));

    // 4. Verify t_secom_workhistory updates
    const [historyRows] = await connection.query(
      `SELECT Sabun, Name, WSTime, bLate FROM t_secom_workhistory WHERE WorkDate = ? AND Sabun IN (?, ?, ?)`,
      [todayStr, ...sabuns]
    );

    console.log('\n  📊 [3단계: t_secom_workhistory 실시간 적재 검증]');
    console.log('    ------------------------------------------------------');
    if (historyRows.length === 0) {
      console.log('    ⚠️ 아직 데몬이 동기화하지 못했습니다. scheduler.js가 켜져 있는지 확인해 주세요!');
    } else {
      historyRows.forEach((h) => {
        console.log(`    👤 이름: ${h.Name} | 사번: ${h.Sabun} | 출근시각(WSTime): ${h.WSTime} | 지각여부: ${h.bLate}`);
      });
    }
    console.log('    ------------------------------------------------------');

    // 5. Trigger the Reminder Bot API (ID 11) manually to see the Slack output!
    console.log('\n  📢 [4단계: 10시 30분 미출근 리마인더 트리거 강제 격발]');
    console.log('    - /api/admin/bot/triggers/run (ID: 11) 호출 중...');
    
    const triggerResult = await triggerApi(11);
    
    console.log('\n  ✨ [5단계: 백엔드 최종 드라이 런 연산 결과]');
    console.log('\x1b[32m%s\x1b[0m', '    ------------------------------------------------------');
    console.log(`    - 발송 대상 팀 개수: ${triggerResult.targets || 0}개 팀`);
    console.log(`    - 성공적으로 발송된 채널 수: ${triggerResult.sent || 0}개`);
    console.log(`    - 프리뷰 결과:\n${triggerResult.preview || ''}`);
    console.log('\x1b[32m%s\x1b[0m', '    ------------------------------------------------------');

  } catch (err) {
    console.error('❌ 에러 발생:', err.message);
  } finally {
    connection.release();
    await pool.end();
  }
}

main();
