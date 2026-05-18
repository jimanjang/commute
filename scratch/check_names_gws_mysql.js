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
    
    const targetNames = ['siiiz', 'bibi', 'victor', 'amber', 'vivi'];
    
    console.log("=== Target Names GWS Details ===");
    const matchedGws = gwsUsers.filter(u => {
      const email = u.primaryEmail?.toLowerCase() || '';
      const name = u.name?.fullName?.toLowerCase() || '';
      return targetNames.some(t => email.includes(t) || name.includes(t));
    });
    for (const u of matchedGws) {
      console.log(`GWS: ${u.name?.fullName} | Email: ${u.primaryEmail}`);
    }

    console.log("\n=== Target Names MySQL Details ===");
    const [mysqlRows] = await pool.query("SELECT Name, Sabun, Email, UpdateTime FROM t_secom_person");
    const matchedMysql = mysqlRows.filter(r => {
      const email = r.Email?.toLowerCase() || '';
      const name = r.Name?.toLowerCase() || '';
      return targetNames.some(t => email.includes(t) || name.includes(t));
    });
    for (const r of matchedMysql) {
      console.log(`MySQL: ${r.Name} | Email: ${r.Email} | UpdateTime: ${r.UpdateTime}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
    process.exit();
  }
}

main();
