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
    const auth = getGwsAuth(
      ["https://www.googleapis.com/auth/admin.directory.user.readonly"],
      adminEmail
    );
    const admin = google.admin({ version: "directory_v1", auth });

    console.log("Fetching GWS users list...");
    const res = await admin.users.list({
      customer: "my_customer",
      projection: "full",
      maxResults: 50,
    });
    const users = res.data.users || [];
    console.log(`Found ${users.length} users in GWS`);
    for (const u of users) {
      console.log(`Email: ${u.primaryEmail}`);
      console.log(`Name: ${u.name?.fullName}`);
      console.log(`Orgs:`, JSON.stringify(u.organizations));
      console.log("------------------------");
    }
  } catch (err) {
    console.error("GWS Query Error:", err);
  }
}

main();
