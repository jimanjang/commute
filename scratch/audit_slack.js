const { WebClient } = require('@slack/web-api');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'C:/Users/당근서비스/.antigravity/secom-admin/commute/.env.local' });

async function main() {
  const pool = mysql.createPool({
    host: '172.17.3.206',
    user: 'secom',
    password: 'secom123',
    database: 'secom'
  });

  const slack = new WebClient(process.env.SLACK_TOKEN);

  try {
    const [channels] = await pool.query("SELECT team_name, channel_id FROM t_secom_slack_channel WHERE is_active = 1");
    
    console.log(`--- Accidental Message Audit (Last 15 minutes) ---`);
    const fifteenMinsAgo = Math.floor(Date.now() / 1000) - 900;

    for (const ch of channels) {
      try {
        const history = await slack.conversations.history({
          channel: ch.channel_id,
          oldest: fifteenMinsAgo.toString(),
          limit: 10
        });

        const myMessages = history.messages.filter(m => m.bot_id || m.app_id);

        if (myMessages.length > 0) {
          console.log(`\n📍 [${ch.team_name}] 팀 채널 (${ch.channel_id})`);
          myMessages.forEach(m => {
            const time = new Date(parseFloat(m.ts) * 1000).toLocaleString('ko-KR');
            console.log(`  - [${time}] 내용: ${m.text.substring(0, 150)}...`);
          });
        }
      } catch (e) {
        // Skip errors
      }
    }
  } catch (err) {
    console.error('Audit failed:', err.message);
  } finally {
    process.exit();
  }
}

main();
