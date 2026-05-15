const { WebClient } = require('@slack/web-api');
require('dotenv').config({ path: 'C:/Users/당근서비스/.antigravity/secom-admin/commute/.env.local' });

async function main() {
  const slack = new WebClient(process.env.SLACK_TOKEN);

  try {
    console.log("--- Scanning Public Channels & Specific DMs ---");
    const oldest = (Math.floor(Date.now() / 1000) - 1800).toString();

    // 1. Try public channels only (often allowed even without full list scope)
    const result = await slack.conversations.list({ types: 'public_channel' });
    for (const channel of result.channels) {
      try {
        const history = await slack.conversations.history({ channel: channel.id, oldest, limit: 10 });
        const msgs = history.messages.filter(m => m.bot_id || m.app_id);
        if (msgs.length > 0) {
          console.log(`\n📍 #${channel.name} (${channel.id})`);
          msgs.forEach(m => console.log(`  - [${new Date(parseFloat(m.ts)*1000).toLocaleString()}] ${m.text.substring(0, 100)}`));
        }
      } catch(e) {}
    }

    // 2. Try to find the user ID for laika@daangnservice.com and check DM
    const userRes = await slack.users.lookupByEmail({ email: 'laika@daangnservice.com' });
    if (userRes.user) {
      console.log(`\n--- Checking DM for ${userRes.user.name} (${userRes.user.id}) ---`);
      try {
        // Need to open or find the IM channel
        const imRes = await slack.conversations.open({ users: userRes.user.id });
        if (imRes.channel) {
          const history = await slack.conversations.history({ channel: imRes.channel.id, oldest, limit: 10 });
          const msgs = history.messages.filter(m => m.bot_id || m.app_id);
          if (msgs.length > 0) {
            console.log(`📍 DM with Laika`);
            msgs.forEach(m => console.log(`  - [${new Date(parseFloat(m.ts)*1000).toLocaleString()}] ${m.text.substring(0, 100)}`));
          }
        }
      } catch(e) { console.log("DM check failed:", e.message); }
    }
  } catch (err) {
    console.error('Audit failed:', err.message);
  } finally {
    process.exit();
  }
}

main();
