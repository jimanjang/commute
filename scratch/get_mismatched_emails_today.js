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
  return clean.split(' ')[0].trim();
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
    // 1. Fetch GWS users
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

    // 2. Fetch MySQL users
    const [mysqlUsers] = await pool.query("SELECT Name, Sabun, Email, WorkGroup FROM t_secom_person");
    
    console.log("=== Matching GWS and MySQL to find mismatched emails ===");
    
    const mismatches = [];

    for (const mu of mysqlUsers) {
      const name = mu.Name?.trim();
      const mysqlEmail = mu.Email?.toLowerCase().trim();
      const cleanName = getCleanName(name);

      if (!cleanName) continue;

      const officialEmail = gwsByFirstName.get(cleanName);

      if (officialEmail && mysqlEmail !== officialEmail) {
        // Let's analyze the mismatch type
        let type = "";
        if (mysqlEmail === "" || !mysqlEmail) {
          type = "이메일 누락(공란)";
        } else if (officialEmail.includes("kssc") && !mysqlEmail.includes("kssc")) {
          type = ".kssc 누락";
        } else if (officialEmail.split('@')[0].includes(".") && !mysqlEmail.split('@')[0].includes(".")) {
          type = ".lastname 누락";
        } else {
          type = "이메일 불일치";
        }

        mismatches.push({
          Name: name,
          Sabun: mu.Sabun || 'N/A',
          WorkGroup: mu.WorkGroup || 'N/A',
          MySQLEmail: mysqlEmail || '(비어있음)',
          GWSEmail: officialEmail,
          Type: type
        });
      }
    }

    console.log("\nMismatched list:");
    console.log(JSON.stringify(mismatches, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
    process.exit();
  }
}

main();
