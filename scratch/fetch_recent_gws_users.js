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

    console.log("Fetching GWS users to find recent modifications...");
    const res = await admin.users.list({
      customer: "my_customer",
      projection: "full",
      maxResults: 500,
    });

    const users = res.data.users || [];
    console.log(`Total GWS users retrieved: ${users.length}\n`);

    // Let's filter users whose email or primaryEmail contains 'kssc' or has been updated recently
    // Wait, let's print user emails that contain 'kssc' in GWS first
    const ksscUsers = users.filter(u => u.primaryEmail && u.primaryEmail.toLowerCase().includes('kssc'));
    console.log(`--- ${ksscUsers.length} Users with 'kssc' in GWS primaryEmail ---`);
    for (const u of ksscUsers) {
      console.log(`Email: ${u.primaryEmail}`);
      const orgs = u.organizations || [];
      console.log(`  Name: ${u.name?.fullName}`);
      console.log(`  Orgs:`, orgs.map(o => ({ department: o.department, costCenter: o.costCenter, title: o.title })));
    }

    console.log("\n--- Checking for recent GWS user object details (like creationTime or others) ---");
    // Let's sort users by some timestamp or just see their structure
    if (users.length > 0) {
      console.log("Sample user object keys:", Object.keys(users[0]));
      // Some directory APIs have u.creationTime or u.lastLoginTime
      const sortedUsers = users.map(u => ({
        email: u.primaryEmail,
        fullName: u.name?.fullName,
        creationTime: u.creationTime,
        lastLoginTime: u.lastLoginTime,
      }));
      console.log("Sample detailed records:");
      console.log(sortedUsers.slice(0, 10));
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit();
  }
}

main();
