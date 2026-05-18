const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
const mysql = require('mysql2/promise');
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
  const pool = mysql.createPool({
    host: '172.17.3.206',
    user: 'secom',
    password: 'secom123',
    database: 'secom',
    port: 3306
  });

  try {
    // 1. Fetch GWS users
    const adminEmail = process.env.GOOGLE_ADMIN_EMAIL;
    const auth = getGwsAuth(
      ["https://www.googleapis.com/auth/admin.directory.user.readonly"],
      adminEmail
    );
    const admin = google.admin({ version: "directory_v1", auth });

    console.log("Fetching GWS users...");
    const res = await admin.users.list({
      customer: "my_customer",
      projection: "full",
      maxResults: 500,
    });
    const gwsUsers = res.data.users || [];
    
    // Create maps from GWS by Name (normalized) and Sabun (costCenter)
    const gwsByName = new Map();
    const gwsBySabun = new Map();

    for (const u of gwsUsers) {
      const email = u.primaryEmail?.toLowerCase().trim();
      const fullName = u.name?.fullName?.trim();
      const orgs = u.organizations || [];
      const workOrg = orgs.find((o) => o.customType === "work") || orgs[0];
      const sabun = workOrg?.costCenter?.trim();

      if (email) {
        if (fullName) gwsByName.set(fullName, email);
        if (sabun) gwsBySabun.set(sabun, email);
      }
    }

    // 2. Fetch MySQL users
    const [mysqlUsers] = await pool.query("SELECT Name, Sabun, Email FROM t_secom_person");
    
    console.log("\nComparing MySQL users vs GWS actual emails...");
    
    const mismatches = [];

    for (const mu of mysqlUsers) {
      const name = mu.Name?.trim();
      const sabun = mu.Sabun?.trim();
      const mysqlEmail = mu.Email?.toLowerCase().trim();

      // Find the official GWS email by Sabun first, then Name
      let officialEmail = null;
      if (sabun) officialEmail = gwsBySabun.get(sabun);
      if (!officialEmail && name) {
        officialEmail = gwsByName.get(name);
        // Try clean name (remove parentheses like "Hanna (한나)" -> "Hanna")
        if (!officialEmail && name.includes("(")) {
          const cleanName = name.split("(")[0].trim();
          officialEmail = gwsByName.get(cleanName);
        }
      }

      if (officialEmail && mysqlEmail !== officialEmail) {
        mismatches.push({
          name,
          sabun,
          mysqlEmail: mysqlEmail || "(empty)",
          gwsEmail: officialEmail,
        });
      }
    }

    console.log(`\nFound ${mismatches.length} mismatches where MySQL email needs to be updated:`);
    console.log(mismatches);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
    process.exit();
  }
}

main();
