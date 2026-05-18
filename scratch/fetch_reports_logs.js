const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
const { google } = require('googleapis');

function normalizePrivateKey(key) {
  if (!key) return undefined;
  return key.replace(/\\n/g, "\n");
}

function getGwsAuth(scopes, subject) {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY),
    scopes,
    subject,
  });
}

async function main() {
  try {
    const adminEmail = process.env.GOOGLE_ADMIN_EMAIL;
    
    // We request scopes for Reports API
    const auth = getGwsAuth(
      [
        "https://www.googleapis.com/auth/admin.reports.audit.readonly",
        "https://www.googleapis.com/auth/admin.directory.user.readonly"
      ],
      adminEmail
    );

    console.log("Initializing Admin Reports API...");
    const admin = google.admin({ version: "reports_v1", auth });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startTime = today.toISOString();

    console.log(`Querying GWS Admin Audit Logs since ${startTime}...`);
    
    const res = await admin.activities.list({
      userKey: "all",
      applicationName: "admin",
      startTime: startTime,
      maxResults: 100
    });

    const items = res.data.items || [];
    console.log(`Found ${items.length} admin audit log items today.\n`);

    for (const item of items) {
      const actor = item.actor?.email;
      const time = item.id?.time;
      const events = item.events || [];
      
      for (const e of events) {
        console.log(`[${time}] Actor: ${actor} | Event: ${e.name} (${e.type})`);
        const params = e.parameters || [];
        // Print relevant parameters like USER_EMAIL, NEW_VALUE, etc.
        const paramStr = params.map(p => `${p.name}: ${p.value || p.multiValue || ''}`).join(', ');
        console.log(`  Details: ${paramStr}`);
      }
    }

  } catch (err) {
    console.warn("Could not query Reports API (likely due to missing scope permission or API not enabled):", err.message);
  } finally {
    process.exit();
  }
}

main();
