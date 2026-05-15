const { WebClient } = require('@slack/web-api');
require('dotenv').config({ path: 'C:/Users/당근서비스/.antigravity/secom-admin/commute/.env.local' });

async function main() {
  const slack = new WebClient(process.env.SLACK_TOKEN);

  try {
    console.log("--- Scanning ALL accessible channels for accidental bot messages ---");
    const now = Math.floor(Date.now() / 1000);
    const oldest = (now - 1200).toString(); // Last 20 minutes

    // 1. Get all channels the bot is in
    const result = await slack.conversations.list({
      types: 'public_channel,private_channel,im',
      limit: 100
    });

    for (const channel of result.channels) {
      try {
        const history = await slack.conversations.history({
          channel: channel.id,
          oldest: oldest,
          limit: 10
        });

        const myMessages = history.messages.filter(m => m.bot_id || m.app_id || m.username === 'SecomBot');
        if (myMessages.length > 0) {
          const channelName = channel.name || channel.user || channel.id;
          console.log(`\n📍 Channel: #${channelName} (${channel.id})`);
          myMessages.forEach(m => {
            const time = new Date(parseFloat(m.ts) * 1000).toLocaleString('ko-KR');
            console.log(`  - [${time}] Text: ${m.text.substring(0, 150)}...`);
          });
        }
      } catch (e) {
        // Might fail for some private channels, skip
      }
    }
  } catch (err) {
    console.error('Audit failed:', err.message);
  } finally {
    process.exit();
  }
}

main();
