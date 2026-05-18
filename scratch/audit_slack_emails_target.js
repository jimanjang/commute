const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
const mysql = require('mysql2/promise');
const { WebClient } = require('@slack/web-api');

async function main() {
  const token = process.env.SLACK_TOKEN;
  if (!token) {
    console.error("SLACK_TOKEN is missing in .env.local!");
    process.exit(1);
  }

  const client = new WebClient(token);

  const pool = mysql.createPool({
    host: '172.17.3.206',
    user: 'secom',
    password: 'secom123',
    database: 'secom',
    port: 3306
  });

  try {
    // Fetch all monitored users
    console.log("Fetching monitored users in WorkGroups '002', '006', '007' from MySQL...");
    const [users] = await pool.query(
      "SELECT Name, Sabun, Email, WorkGroup FROM t_secom_person WHERE WorkGroup IN ('002', '006', '007')"
    );

    console.log(`Auditing Slack lookups for ${users.length} users...`);
    const activeFailures = [];
    const activeSuccesses = [];

    // To prevent hitting rate limits (Tier 3: 50+ lookups/min can be throttled), we can batch or do a slight delay
    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      const email = u.Email?.toLowerCase().trim();

      if (!email) {
        console.log(`[EMPTY] ${u.Name} (${u.Sabun}) has no email registered!`);
        activeFailures.push({ name: u.Name, sabun: u.Sabun, email: '(empty)', reason: '이메일 공란' });
        continue;
      }

      try {
        // Query Slack WebClient
        const res = await client.users.lookupByEmail({ email });
        if (res.user?.id) {
          activeSuccesses.push({ name: u.Name, email, userId: res.user.id });
          console.log(`[SUCCESS] ${i + 1}/${users.length}: ${u.Name} resolved to ${res.user.id}`);
        } else {
          activeFailures.push({ name: u.Name, sabun: u.Sabun, email, reason: 'Slack User ID missing' });
          console.warn(`[WARNING] ${u.Name} returned empty user structure`);
        }
      } catch (err) {
        console.error(`[FAILURE] ${i + 1}/${users.length}: ${u.Name} (${email}) failed: ${err.message}`);
        activeFailures.push({ name: u.Name, sabun: u.Sabun, email, reason: err.message });
      }

      // 100ms throttle to prevent Slack rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log("\n=== SLACK AUDIT RESULTS ===");
    console.log(`Resolved successfully: ${activeSuccesses.length}`);
    console.log(`Failed resolution: ${activeFailures.length}`);

    if (activeFailures.length > 0) {
      console.log("\n--- Failures List ---");
      console.log(JSON.stringify(activeFailures, null, 2));
    } else {
      console.log("\n🎉 Every single monitored user is successfully resolved in Slack!");
    }

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
    process.exit();
  }
}

main();
