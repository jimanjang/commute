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

// Extract clean English name from MySQL name
// e.g. "Bello(벨로)" -> "bello", "Hanna (한나)" -> "hanna", "Steve" -> "steve"
function getCleanName(name) {
  if (!name) return "";
  let clean = name.split('(')[0].trim().toLowerCase();
  clean = clean.split(' ')[0].trim(); // Take first word
  return clean;
}

// Extract clean first name from GWS email
// e.g. "bello.kssc@..." -> "bello", "hanna.woo@..." -> "hanna"
function getFirstNameFromEmail(email) {
  if (!email) return "";
  const part = email.split('@')[0].toLowerCase();
  const sub = part.split('.')[0];
  return sub;
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
    
    // Create Map: firstName -> GWS Email
    const gwsByFirstName = new Map();
    for (const u of gwsUsers) {
      const email = u.primaryEmail?.toLowerCase().trim();
      if (email) {
        const first = getFirstNameFromEmail(email);
        if (first) {
          // If duplicate, keep first or map both if needed, but let's see
          gwsByFirstName.set(first, email);
        }
      }
    }

    // 2. Fetch MySQL users
    const [mysqlUsers] = await pool.query("SELECT Name, Sabun, Email FROM t_secom_person");
    
    console.log("\nComparing MySQL users vs GWS actual emails by normalized first name...");
    
    const mismatches = [];

    for (const mu of mysqlUsers) {
      const name = mu.Name?.trim();
      const mysqlEmail = mu.Email?.toLowerCase().trim();
      const cleanName = getCleanName(name);

      if (!cleanName) continue;

      const officialEmail = gwsByFirstName.get(cleanName);

      if (officialEmail && mysqlEmail !== officialEmail) {
        mismatches.push({
          name,
          mysqlEmail: mysqlEmail || "(empty)",
          gwsEmail: officialEmail,
        });
      }
    }

    console.log(`\nFound ${mismatches.length} mismatches where MySQL email is different from GWS email:`);
    console.log(mismatches);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
    process.exit();
  }
}

main();
