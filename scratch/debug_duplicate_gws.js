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

    const res = await admin.users.list({
      customer: "my_customer",
      projection: "full",
      maxResults: 500,
    });
    const users = res.data.users || [];
    
    const targets = ['steve', 'kaya', 'will', 'rhea', 'austin'];
    console.log("GWS CostCenter & Department details for duplicate names:");
    for (const u of users) {
      const email = u.primaryEmail?.toLowerCase();
      const name = u.name?.fullName?.toLowerCase();
      const matches = targets.some(t => email.includes(t) || name.includes(t));
      if (matches) {
        console.log(`Email: ${u.primaryEmail}`);
        console.log(`Name: ${u.name?.fullName}`);
        console.log(`Orgs:`, JSON.stringify(u.organizations));
        console.log("------------------------");
      }
    }
  } catch (err) {
    console.error(err);
  }
}

main();
