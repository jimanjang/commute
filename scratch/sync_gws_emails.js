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

function getCleanName(name) {
  if (!name) return "";
  let clean = name.split('(')[0].trim().toLowerCase();
  clean = clean.split(' ')[0].trim();
  return clean;
}

function getFirstNameFromEmail(email) {
  if (!email) return "";
  const part = email.split('@')[0].toLowerCase();
  return part.split('.')[0];
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
    
    const gwsByFirstName = new Map();
    for (const u of gwsUsers) {
      const email = u.primaryEmail?.toLowerCase().trim();
      if (email) {
        const first = getFirstNameFromEmail(email);
        if (first) {
          gwsByFirstName.set(first, email);
        }
      }
    }

    const [mysqlUsers] = await pool.query("SELECT Name, Sabun, Email FROM t_secom_person");
    
    console.log("Starting GWS -> MySQL email synchronization...");
    let updateCount = 0;

    for (const mu of mysqlUsers) {
      const name = mu.Name?.trim();
      const mysqlEmail = mu.Email?.toLowerCase().trim();
      const cleanName = getCleanName(name);

      if (!cleanName) continue;

      const officialEmail = gwsByFirstName.get(cleanName);

      if (officialEmail && mysqlEmail !== officialEmail) {
        console.log(`Updating ${name} (${mu.Sabun || 'N/A'}): ${mysqlEmail || '(empty)'} -> ${officialEmail}`);
        
        // Update both Email and UpdateTime to mark it updated today
        const timeStr = new Date().toISOString().slice(0, 19).replace(/[-T:]/g, "");
        await pool.query(
          "UPDATE t_secom_person SET Email = ?, UpdateTime = ? WHERE Name = ?",
          [officialEmail, timeStr, name]
        );
        updateCount++;
      }
    }

    console.log(`\nSuccessfully synchronized ${updateCount} emails in local MySQL database!`);

  } catch (err) {
    console.error("Sync Error:", err);
  } finally {
    await pool.end();
    process.exit();
  }
}

main();
