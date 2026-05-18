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
function getCleanName(name) {
  if (!name) return "";
  let clean = name.split('(')[0].trim().toLowerCase();
  clean = clean.split(' ')[0].trim();
  return clean;
}

async function main() {
  const pool = mysql.createPool({
    host: '172.17.3.206', user: 'secom', password: 'secom123', database: 'secom',
    port: 3306
  });

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
      maxResults: 500,
    });
    const users = res.data.users || [];
    console.log(`Found ${users.length} users in GWS`);

    const gwsMap = new Map();
    for (const u of users) {
      const email = u.primaryEmail?.toLowerCase().trim();
      if (!email) continue;

      const orgs = u.organizations;
      if (!orgs || orgs.length === 0) continue;

      const workOrg = orgs.find(o => o.customType === "work") || orgs[0];
      const team = workOrg?.department || null;
      const sabun = workOrg?.costCenter || null;

      const info = { email, team, sabun };
      gwsMap.set(email, info);
      
      const firstName = email.split('@')[0].split('.')[0].toLowerCase();
      if (firstName) gwsMap.set(firstName, info);
      if (sabun) gwsMap.set(sabun, info);
    }

    console.log("Fetching MySQL users from t_secom_person...");
    const [personRows] = await pool.query("SELECT Name, Email, Sabun, Team FROM t_secom_person");
    
    let updatedCount = 0;
    for (const p of personRows) {
      const mysqlEmail = p.Email?.toLowerCase().trim() || "";
      const mysqlId = mysqlEmail.split('@')[0];
      const cleanName = getCleanName(p.Name);

      const gwsInfo = gwsMap.get(mysqlEmail) || gwsMap.get(cleanName) || gwsMap.get(mysqlId);
      if (gwsInfo && gwsInfo.team) {
        if (p.Team !== gwsInfo.team) {
          await pool.query(
            "UPDATE t_secom_person SET Team = ? WHERE Name = ?",
            [gwsInfo.team, p.Name]
          );
          updatedCount++;
        }
      }
    }

    console.log(`Successfully updated ${updatedCount} teams directly in MySQL t_secom_person!`);

  } catch (err) {
    console.error("Direct Sync Error:", err);
  } finally {
    await pool.end();
  }
}

main();
