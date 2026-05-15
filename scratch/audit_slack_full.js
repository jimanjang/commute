const { WebClient } = require('@slack/web-api');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'C:/Users/당근서비스/.antigravity/secom-admin/commute/.env.local' });

async function main() {
  const pool = mysql.createPool({ host: '172.17.3.206', user: 'secom', password: 'secom123', database: 'secom' });
  const slack = new WebClient(process.env.SLACK_TOKEN);

  try {
    const [channels] = await pool.query("SELECT team_name, channel_id FROM t_secom_slack_channel WHERE is_active = 1");
    
    console.log(`--- Comprehensive Slack Audit (Last 30 minutes) ---`);
    const thirtyMinsAgo = Math.floor(Date.now() / 1000) - 1800;

    for (const ch of channels) {
      try {
        const history = await slack.conversations.history({
          channel: ch.channel_id,
          oldest: thirtyMinsAgo.toString(),
          limit: 20
        });

        if (history.messages.length > 0) {
          console.log(`\n📍 [${ch.team_name}] 채널 (${ch.channel_id})`);
          history.messages.forEach(m => {
            const time = new Date(parseFloat(m.ts) * 1000).toLocaleString('ko-KR');
            const isBot = m.bot_id || m.app_id ? "[BOT]" : "[USER]";
            console.log(`  - [${time}] ${isBot}: ${m.text.substring(0, 100)}`);
          });
        }
      } catch (e) { }
    }

    // Also check for any DMs (using list of recent conversations if possible)
    console.log("\n--- Checking for Recent Bot Conversations (DMs etc.) ---");
    const convos = await slack.conversations.list({ types: 'public_channel,private_channel,im' });
    // This might be too many, let's just look at the most recent activity
  } catch (err) {
    console.error('Audit failed:', err.message);
  } finally {
    process.exit();
  }
}

main();
