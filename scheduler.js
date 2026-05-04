const http = require('http');
const mysql = require('mysql2/promise');

/**
 * Commute Tracker Scheduler
 * 
 * This script pings the /api/admin/bot/triggers/check endpoint every 30 seconds
 * to automate triggered notifications.
 * 
 * Usage: node scheduler.js
 */

const PORT = process.env.PORT || 3005;
const CHECK_URL = `http://localhost:${PORT}/api/admin/bot/triggers/check`;

// DB connection for execution history logging
const pool = mysql.createPool({
  host: '172.17.3.206', user: 'secom', password: 'secom123', database: 'secom',
  waitForConnections: true, connectionLimit: 3
});

console.log('\x1b[36m%s\x1b[0m', '------------------------------------------');
console.log('\x1b[36m%s\x1b[0m', '  🚀 Commute Tracker Scheduler Starting');
console.log('\x1b[36m%s\x1b[0m', `  Target: ${CHECK_URL}`);
console.log('\x1b[36m%s\x1b[0m', '  Interval: 30 seconds');
console.log('\x1b[36m%s\x1b[0m', '------------------------------------------');

async function logToDb(executedCount, executedList, errorMessage) {
  try {
    await pool.query(
      'INSERT INTO t_secom_scheduler_log (executed_count, executed_list, error_message) VALUES (?, ?, ?)',
      [executedCount, executedList ? JSON.stringify(executedList) : null, errorMessage || null]
    );
  } catch (e) {
    // DB 로그 실패는 조용히 무시 (스케줄러 자체를 멈추지 않음)
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
          // 실행된 경우만 DB 기록 (매 30초마다 기록하면 너무 많아짐)
          await logToDb(execCount, execList, null);
        } else {
          // Heartbeat log every 10 minutes to avoid cluttering but show it's alive
          if (kst.getMinutes() % 10 === 0 && kst.getSeconds() < 35) {
            console.log(`[\x1b[90m${timeStr}\x1b[0m] 💓 Heartbeat: Scheduler is monitoring...`);
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
    console.log('   (Make sure `npm run dev` is running on port 3005)');
    await logToDb(0, null, errMsg);
  });
}

// Initial Run
checkTriggers();

// Schedule every 30 seconds
setInterval(checkTriggers, 30 * 1000);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\x1b[33m[Scheduler] Shutting down...\x1b[0m');
  await pool.end();
  process.exit(0);
});
