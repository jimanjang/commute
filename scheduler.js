const http = require('http');
const mysql = require('mysql2/promise');

/**
 * Commute Tracker Scheduler & Real-Time Sync Daemon
 * 
 * 1. Pings the /api/admin/bot/triggers/check endpoint every 30 seconds
 *    to automate triggered notifications.
 * 2. Mirrors today's tags from t_secom_alarm to t_secom_workhistory every 5 seconds
 *    to enable 100% real-time check-in/check-out.
 * 
 * Usage: node scheduler.js
 */

const PORT = process.env.PORT || 3005;
const CHECK_URL = `http://localhost:${PORT}/api/admin/bot/triggers/check`;

// Shared DB connection pool
const pool = mysql.createPool({
  host: '172.17.3.206', user: 'secom', password: 'secom123', database: 'secom',
  waitForConnections: true, connectionLimit: 3
});

console.log('\x1b[36m%s\x1b[0m', '----------------------------------------------------------');
console.log('\x1b[36m%s\x1b[0m', '  🚀 Commute Tracker Scheduler & Sync Daemon Starting');
console.log('\x1b[36m%s\x1b[0m', `  Target Trigger API: ${CHECK_URL}`);
console.log('\x1b[36m%s\x1b[0m', '  Trigger Check Interval: 30 seconds');
console.log('\x1b[36m%s\x1b[0m', '  Real-Time Commute Sync Interval: 5 seconds');
console.log('\x1b[36m%s\x1b[0m', '----------------------------------------------------------');

// ==========================================
// Part 1: Automated Notifications Trigger (30s)
// ==========================================

async function logToDb(executedCount, executedList, errorMessage) {
  try {
    await pool.query(
      'INSERT INTO t_secom_scheduler_log (executed_count, executed_list, error_message) VALUES (?, ?, ?)',
      [executedCount, executedList ? JSON.stringify(executedList) : null, errorMessage || null]
    );
  } catch (e) {
    console.error('\x1b[31m[Scheduler DB Log Error]\x1b[0m', e.message);
  }
}

function checkTriggers() {
  const kstString = new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" });
  const kst = new Date(kstString);
  const timeStr = kst.getFullYear() + '-' + 
                 String(kst.getMonth() + 1).padStart(2, '0') + '-' + 
                 String(kst.getDate()).padStart(2, '0') + ' ' + 
                 String(kst.getHours()).padStart(2, '0') + ':' + 
                 String(kst.getMinutes()).padStart(2, '0') + ':' + 
                 String(kst.getSeconds()).padStart(2, '0');

  http.get(CHECK_URL, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', async () => {
      if (res.statusCode !== 200) {
        const errMsg = `HTTP ${res.statusCode}: ${data.substring(0, 200)}`;
        console.error(`[\x1b[31m${timeStr}\x1b[0m] ❌ Error ${errMsg}`);
        await logToDb(0, null, errMsg);
        return;
      }

      try {
        const json = JSON.parse(data);
        const execCount = json.executed_count || 0;
        const execList = json.executed_list || [];

        if (execCount > 0) {
          console.log(`[\x1b[32m${timeStr}\x1b[0m] ✅ Triggered ${execCount} item(s):`, 
            execList.map(t => `${t.function}(#${t.id})`).join(', '));
          await logToDb(execCount, execList, null);
        } else {
          // Heartbeat log every 10 minutes to show it's alive
          if (kst.getMinutes() % 10 === 0 && kst.getSeconds() < 35) {
            console.log(`[\x1b[90m${timeStr}\x1b[0m] 💓 Heartbeat: Trigger scheduler is running...`);
          }
        }
      } catch (e) {
        const errMsg = `JSON Parse Error: ${data.substring(0, 100)}`;
        console.error(`[\x1b[31m${timeStr}\x1b[0m] ${errMsg}`);
        await logToDb(0, null, errMsg);
      }
    });
  }).on('error', async (err) => {
    const errMsg = `Network Error: ${err.message}`;
    console.error(`[\x1b[31m${timeStr}\x1b[0m] ❌ ${errMsg}`);
    console.log('   (Make sure Next.js server is running on port 3005)');
    await logToDb(0, null, errMsg);
  });
}

// ==========================================
// Part 2: Real-Time Commute Sync (5s)
// ==========================================

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
  let connection;
  try {
    connection = await pool.getConnection();
    const todayStr = getKstDateStr();
    const nowTimeStr = getNowTimestamp();
    const todayStrDash = `${todayStr.substring(0, 4)}-${todayStr.substring(4, 6)}-${todayStr.substring(6, 8)}`;
    
    // 1. Query today's alarms (sorted chronologically) - Include Email to fetch schedule
    const [alarms] = await connection.query(
      `SELECT a.CardNo, a.ATime, p.Name, p.Sabun, p.CardFullData, p.JuminNo, 
              p.Company, p.Department, p.Team, p.Part, p.Grade, p.DetailGrade, p.Email
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
      
      const alarmTime = alarm.ATime;
      const alarmHour = parseInt(alarmTime.substring(8, 10));
      const existing = workMap.get(sabun);
      
      if (!existing) {
        // [출근 등록] - 첫 태깅은 시간에 무관하게 무조건 출근
        console.log(`[\x1b[32m${nowTimeStr}\x1b[0m] 🆕 [출근 감지] ${alarm.Name}(${sabun})님 출근 기록 생성: ${alarmTime}`);
        
        const truncate = (val) => val ? String(val).substring(0, 3) : '';

        await connection.query(
          `INSERT INTO t_secom_workhistory (
            WorkDate, CardNo, CardFullData, JuminNo, Name, Sabun,
            Company, Department, Team, Part, Grade, DetailGrade,
            bWS, bWC, WSTime, WCTime, bLate, bAbsent, InsertTime
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, NULL, 0, 0, ?)`,
          [
            todayStr, alarm.CardNo, alarm.CardFullData, alarm.JuminNo, alarm.Name, alarm.Sabun,
            truncate(alarm.Company), truncate(alarm.Department), truncate(alarm.Team), truncate(alarm.Part), truncate(alarm.Grade), truncate(alarm.DetailGrade),
            alarmTime, nowTimeStr
          ]
        );
        
        workMap.set(sabun, { Sabun: sabun, WSTime: alarmTime, WCTime: null });
        
      } else {
        // [퇴근 갱신] - 각 인원의 오늘 정규 근무 스케줄(sheet_type = 4) 종료 시각에 맞춰 엄격하게 퇴근 인정 시각(스레숄드)을 계산합니다.
        let thresholdHour = 19; // 기본값: 오후 7시 (19시 퇴근 기준)
        
        if (alarm.Email) {
          try {
            const [schedules] = await connection.query(
              `SELECT start_time, end_time FROM t_secom_schedule WHERE email = ? AND date = ? AND sheet_type = 4`,
              [alarm.Email.trim(), todayStrDash]
            );
            if (schedules && schedules.length > 0 && schedules[0].end_time) {
              const endTimeStr = schedules[0].end_time; // 예: "19:00"
              const hourPart = parseInt(endTimeStr.split(':')[0]);
              if (!isNaN(hourPart)) {
                thresholdHour = hourPart; // 스케줄 종료 시각 정각부터만 퇴근 인정 (이전 시각은 무조건 단순 외출 처리)
              }
            }
          } catch (schErr) {
            // 스케줄 조회 실패 시 기본값 19시 적용
          }
        }
        
        const currentWs = existing.WSTime;
        const currentWc = existing.WCTime;
        
        if (alarmTime > currentWs && (!currentWc || alarmTime > currentWc)) {
          if (alarmHour < thresholdHour) {
            // 낮 시간대의 단순 외출/복귀인 경우 퇴근 기록 갱신을 건너뜀 (업무 중 상태 보존)
            continue;
          }
          
          console.log(`[\x1b[33m${nowTimeStr}\x1b[0m] 🔄 [퇴근 감지] ${alarm.Name}(${sabun})님 퇴근 기록 갱신: ${alarmTime}`);
          
          await connection.query(
            `UPDATE t_secom_workhistory
             SET WCTime = ?, bWC = 1, UpdateTime = ?
             WHERE WorkDate = ? AND Sabun = ?`,
            [alarmTime, nowTimeStr, todayStr, alarm.Sabun]
          );
          
          existing.WCTime = alarmTime;
        }
      }
    }
  } catch (err) {
    console.error(`[\x1b[31mError\x1b[0m] Mirroring error:`, err.message);
  } finally {
    if (connection) connection.release();
  }
}

// ==========================================
// Initialization & Execution Loops
// ==========================================

// 1. Initial executions
checkTriggers();
runMirroring();

// 2. Start intervals
setInterval(checkTriggers, 30 * 1000);  // Trigger checks every 30 seconds
setInterval(runMirroring, 5 * 1000);    // Real-Time commute sync every 5 seconds

// 3. Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\x1b[33m[Scheduler & Sync Daemon] Shutting down...\x1b[0m');
  await pool.end();
  process.exit(0);
});
