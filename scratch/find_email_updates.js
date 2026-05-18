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
    const gwsEmailSet = new Set(gwsUsers.map(u => u.primaryEmail?.toLowerCase().trim()));

    // 2. Fetch MySQL users
    const [mysqlUsers] = await pool.query("SELECT Name, Sabun, Email FROM t_secom_person");
    
    console.log("\nAnalyzing differences between MySQL and GWS emails...");

    // We want to find:
    // a) MySQL email exists but GWS has a different format (like with .lastname or .kssc)
    // b) MySQL email is empty but GWS has it
    // c) MySQL has an old email that is NOT in GWS anymore (or has been changed)
    
    const matchedByName = new Map(); // Name -> GWS Email
    for (const u of gwsUsers) {
      if (u.name?.fullName) {
        matchedByName.set(u.name.fullName.trim(), u.primaryEmail?.toLowerCase().trim());
      }
    }

    const differences = [];
    const ksscDiffs = [];
    const lastnameDiffs = [];

    for (const mysqlUser of mysqlUsers) {
      const name = mysqlUser.Name?.trim();
      const mysqlEmail = mysqlUser.Email?.toLowerCase().trim();
      const gwsEmail = matchedByName.get(name);

      if (mysqlEmail && gwsEmail && mysqlEmail !== gwsEmail) {
        const diff = {
          name,
          sabun: mysqlUser.Sabun,
          mysqlEmail,
          gwsEmail,
        };
        differences.push(diff);

        if (gwsEmail.includes('kssc') && !mysqlEmail.includes('kssc')) {
          ksscDiffs.push(diff);
        } else if (gwsEmail.split('@')[0].includes('.') && !mysqlEmail.split('@')[0].includes('.')) {
          lastnameDiffs.push(diff);
        }
      }
    }

    console.log(`\n--- Found ${differences.length} differences between GWS and MySQL ---`);
    console.log(differences);

    console.log(`\n--- Found ${ksscDiffs.length} users with missing '.kssc' in MySQL ---`);
    console.log(ksscDiffs);

    console.log(`\n--- Found ${lastnameDiffs.length} users with missing '.lastname' in MySQL ---`);
    console.log(lastnameDiffs);

    // Let's also check trigger failure logs for today to see if anyone failed to get slack notifications due to email or user not found
    const [failures] = await pool.query(
      `SELECT sabun, name, email, error_message, created_at FROM t_secom_trigger_log 
       WHERE DATE(created_at) = '2026-05-18' AND status = 'failure' ORDER BY created_at DESC`
    );
    console.log(`\n--- Found ${failures.length} trigger failures today ---`);
    console.log(failures);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
    process.exit();
  }
}

main();
