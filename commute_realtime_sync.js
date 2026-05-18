const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '172.17.3.206', user: 'secom', password: 'secom123', database: 'secom',
  waitForConnections: true, connectionLimit: 3
});

console.log('\x1b[36m%s\x1b[0m', '----------------------------------------------------------');
console.log('\x1b[36m%s\x1b[0m', '  🚀 Commute Real-Time Auto-Mirroring Service Starting');
console.log('\x1b[36m%s\x1b[0m', '  Syncing: t_secom_alarm ➡️ t_secom_workhistory');
console.log('\x1b[36m%s\x1b[0m', '  Interval: 5 seconds');
console.log('\x1b[36m%s\x1b[0m', '----------------------------------------------------------');

function getKstDateStr() {
  const kst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const yyyy = kst.getFullYear();
  const mm = String(kst.getMonth() + 1).padStart(2, '0');
  const dd = String(kst.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

function getNowTimestamp() {
  const kst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const yyyy = kst.getFullYear();
  const mm = String(kst.getMonth() + 1).padStart(2, '0');
  const dd = String(kst.getDate()).padStart(2, '0');
  const hh = String(kst.getHours()).padStart(2, '0');
  const mi = String(kst.getMinutes()).padStart(2, '0');
  const ss = String(kst.getSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}${hh}${mi}${ss}`;
}

async function runMirroring() {
  const connection = await pool.getConnection();
  try {
    const todayStr = getKstDateStr();
    const nowTimeStr = getNowTimestamp();
    
    // 1. Query today's alarms (sorted chronologically)
    const [alarms] = await connection.query(
      `SELECT a.CardNo, a.ATime, p.Name, p.Sabun, p.CardFullData, p.JuminNo, 
              p.Company, p.Department, p.Team, p.Part, p.Grade, p.DetailGrade
       FROM t_secom_alarm a
       INNER JOIN t_secom_person p ON a.CardNo = p.CardNo
       WHERE a.ATime LIKE ?
       ORDER BY a.ATime ASC`,
      [`${todayStr}%`]
    );
    
    if (alarms.length === 0) {
      return;
    }
    
    // 2. Query today's existing workhistory
    const [workhistory] = await connection.query(
      `SELECT Sabun, WSTime, WCTime FROM t_secom_workhistory WHERE WorkDate = ?`,
      [todayStr]
    );
    
    const workMap = new Map();
    workhistory.forEach(w => {
      if (w.Sabun) workMap.set(w.Sabun.trim(), w);
    });
    
    // 3. Process alarms to mirror into workhistory
    for (const alarm of alarms) {
      const sabun = alarm.Sabun?.trim();
      if (!sabun) continue;
      
      const alarmTime = alarm.ATime; // YYYYMMDDHHMMSS
      const existing = workMap.get(sabun);
      
      if (!existing) {
        // [출근 등록] No record exists for today: insert a check-in record
        console.log(`[\x1b[32m${nowTimeStr}\x1b[0m] 🆕 [출근 감지] ${alarm.Name}(${sabun})님 출근 기록 생성: ${alarmTime}`);
        
        await connection.query(
          `INSERT INTO t_secom_workhistory (
            WorkDate, CardNo, CardFullData, JuminNo, Name, Sabun,
            Company, Department, Team, Part, Grade, DetailGrade,
            bWS, bWC, WSTime, WCTime, bLate, bAbsent, InsertTime
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, NULL, 0, 0, ?)`,
          [
            todayStr, alarm.CardNo, alarm.CardFullData, alarm.JuminNo, alarm.Name, alarm.Sabun,
            alarm.Company, alarm.Department, alarm.Team, alarm.Part, alarm.Grade, alarm.DetailGrade,
            alarmTime, nowTimeStr
          ]
        );
        
        // Cache the newly created record to handle subsequent alarms for the same person
        workMap.set(sabun, { Sabun: sabun, WSTime: alarmTime, WCTime: null });
        
      } else {
        // [퇴근 갱신] Record already exists: check if we should update WCTime (end time)
        const currentWs = existing.WSTime;
        const currentWc = existing.WCTime;
        
        // Only update if the alarm is after the check-in time and is newer than the current checkout time
        if (alarmTime > currentWs && (!currentWc || alarmTime > currentWc)) {
          console.log(`[\x1b[33m${nowTimeStr}\x1b[0m] 🔄 [퇴근 감지] ${alarm.Name}(${sabun})님 퇴근 기록 갱신: ${alarmTime}`);
          
          await connection.query(
            `UPDATE t_secom_workhistory
             SET WCTime = ?, bWC = 1, UpdateTime = ?
             WHERE WorkDate = ? AND Sabun = ?`,
            [alarmTime, nowTimeStr, todayStr, alarm.Sabun]
          );
          
          // Update the cached record
          existing.WCTime = alarmTime;
        }
      }
    }
  } catch (err) {
    console.error(`[\x1b[31mError\x1b[0m] Mirroring error:`, err.message);
  } finally {
    connection.release();
  }
}

// Run immediately
runMirroring();

// Run every 5 seconds
const intervalId = setInterval(runMirroring, 5 * 1000);

process.on('SIGINT', async () => {
  console.log('\n\x1b[33m[Real-Time Mirroring Service] Shutting down...\x1b[0m');
  clearInterval(intervalId);
  await pool.end();
  process.exit(0);
});
