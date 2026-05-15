const { WebClient } = require('@slack/web-api');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'C:/Users/당근서비스/.antigravity/secom-admin/commute/.env.local' });

async function main() {
  const pool = mysql.createPool({ host: '172.17.3.206', user: 'secom', password: 'secom123', database: 'secom' });
  const slack = new WebClient(process.env.SLACK_TOKEN);

  try {
    console.log("--- Checking Target Channel C094LP1E1E3 ---");
    const oldest = (Math.floor(Date.now() / 1000) - 1800).toString();
    
    try {
      const history = await slack.conversations.history({ channel: 'C094LP1E1E3', oldest, limit: 10 });
      history.messages.forEach(m => {
        if (m.bot_id || m.app_id) {
          console.log(`[${new Date(parseFloat(m.ts)*1000).toLocaleString()}] BOT: ${m.text.substring(0, 100)}...`);
        }
      });
    } catch(e) { console.log("Channel audit failed:", e.message); }

    console.log("\n--- Identifying User KS2602010 ---");
    const [userRows] = await pool.query("SELECT Name, Email FROM t_secom_person WHERE Sabun = 'KS2602010'");
    if (userRows.length > 0) {
      console.log(`User: ${userRows[0].Name} (${userRows[0].Email})`);
      // Check DM if possible
      try {
        const uRes = await slack.users.lookupByEmail({ email: userRows[0].Email });
        const imRes = await slack.conversations.open({ users: uRes.user.id });
        const history = await slack.conversations.history({ channel: imRes.channel.id, oldest, limit: 10 });
        history.messages.forEach(m => {
          if (m.bot_id || m.app_id) {
            console.log(`[DM to ${userRows[0].Name}] ${m.text.substring(0, 100)}...`);
          }
        });
      } catch(e) { console.log("DM check failed (likely scope):", e.message); }
    } else {
      console.log("User not found in bridge table.");
    }

  } catch (err) {
    console.error('Audit failed:', err.message);
  } finally {
    process.exit();
  }
}

main();
