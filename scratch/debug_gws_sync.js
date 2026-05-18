const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Let's write standard JS that imports googleapis and replicates the getGwsUserMap logic to check GWS directly!
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
    console.log("Admin Email:", adminEmail);
    const auth = getGwsAuth(
      ["https://www.googleapis.com/auth/admin.directory.user.readonly"],
      adminEmail
    );
    const admin = google.admin({ version: "directory_v1", auth });

    const res = await admin.users.list({
      customer: "my_customer",
      projection: "full",
      maxResults: 10,
    });

    const users = res.data.users || [];
    console.log(`Successfully connected to GWS! Sample users found: ${users.length}`);
    for (const u of users) {
      console.log(`- Email: ${u.primaryEmail}`);
      const orgs = u.organizations || [];
      console.log(`  Orgs:`, orgs.map(o => ({ department: o.department, costCenter: o.costCenter, customType: o.customType })));
    }
  } catch (err) {
    console.error("Error connecting to GWS:", err);
  } finally {
    process.exit();
  }
}

main();
