const http = require('http');

/**
 * Commute Tracker Scheduler
 * 
 * This script pings the /api/admin/bot/triggers/check endpoint every minute
 * to automate triggered notifications.
 * 
 * Usage: node scheduler.js
 */

const PORT = process.env.PORT || 3000;
const CHECK_URL = `http://localhost:${PORT}/api/admin/bot/triggers/check`;

console.log('\x1b[36m%s\x1b[0m', '------------------------------------------');
console.log('\x1b[36m%s\x1b[0m', '  🚀 Commute Tracker Scheduler Starting');
console.log('\x1b[36m%s\x1b[0m', `  Target: ${CHECK_URL}`);
console.log('\x1b[36m%s\x1b[0m', '  Interval: 30 seconds');
console.log('\x1b[36m%s\x1b[0m', '------------------------------------------');

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
    res.on('end', () => {
      if (res.statusCode !== 200) {
        console.error(`[\x1b[31m${timeStr}\x1b[0m] Error ${res.statusCode}: ${data.substring(0, 100)}`);
        return;
      }

      try {
        const json = JSON.parse(data);
        if (json.executed_count > 0) {
          console.log(`[\x1b[32m${timeStr}\x1b[0m] ✅ Triggered ${json.executed_count} item(s):`, 
            json.executed_list.map(t => `${t.function}(#${t.id})`).join(', '));
        } else {
          // Heartbeat log every 10 minutes to avoid cluttering but show it's alive
          // Heartbeat log every 10 minutes to avoid cluttering but show it's alive
          if (kst.getMinutes() % 10 === 0) {
            console.log(`[\x1b[90m${timeStr}\x1b[0m] Heartbeat: Scheduler is monitoring...`);
          }
        }
      } catch (e) {
        console.error(`[\x1b[31m${timeStr}\x1b[0m] JSON Error:`, data.substring(0, 100));
      }
    });
  }).on('error', (err) => {
    console.error(`[\x1b[31m${timeStr}\x1b[0m] Network Error:`, err.message);
    console.log('   (Make sure `npm run dev` is running on port 3000)');
  });
}

// Initial Run
checkTriggers();

// Schedule every 60 seconds
setInterval(checkTriggers, 30 * 1000);
