const { BigQuery } = require('@google-cloud/bigquery');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');

async function main() {
  const tokens = JSON.parse(fs.readFileSync('C:/Users/당근서비스/.antigravity/secom-admin/commute/token.json', 'utf8'));
  const oauth2Client = new OAuth2Client('32555940559.apps.googleusercontent.com', 'ZmssLNjJy2998hD4CTg2ejr2');
  oauth2Client.setCredentials(tokens);
  const bq = new BigQuery({ projectId: 'karrotmarket', authClient: oauth2Client });
  const mysql = require('mysql2/promise');

  const pool = mysql.createPool({
    host: '172.17.3.206',
    user: 'secom',
    password: 'secom123',
    database: 'secom',
    port: 3306
  });

  try {
    // 1. Get today's schedules
    const [scheduleRows] = await pool.query("SELECT DISTINCT email FROM t_secom_schedule WHERE date = '2026-05-18'");
    console.log("Today's schedules emails count:", scheduleRows.length);

    // 2. Get name mapping
    const [personRows] = await pool.query("SELECT Name, Email, Sabun FROM t_secom_person");
    const emailToName = new Map();
    personRows.forEach(p => {
      if (p.Email) emailToName.set(p.Email.toLowerCase(), p);
    });

    const scheduledNames = [];
    scheduleRows.forEach(s => {
      const email = s.email.toLowerCase();
      const p = emailToName.get(email);
      if (p) scheduledNames.push(p.Name);
    });
    console.log("Found scheduled names in t_secom_person count:", scheduledNames.length);

    if (scheduledNames.length > 0) {
      // 3. Query their BQ properties
      const query = `
        SELECT Name, Sabun, Department, Team, WorkGroup 
        FROM \`secom-data.secom.person\` 
        WHERE Name IN (${scheduledNames.map(n => `'${n}'`).join(",")})
      `;
      const [bqRows] = await bq.query({ query, location: 'asia-northeast3' });
      console.log(`BQ properties for scheduled people (Total matching: ${bqRows.length}):`);
      
      const wgCounts = {};
      const deptCounts = {};
      const teamCounts = {};
      bqRows.forEach(r => {
        wgCounts[r.WorkGroup] = (wgCounts[r.WorkGroup] || 0) + 1;
        deptCounts[r.Department] = (deptCounts[r.Department] || 0) + 1;
        teamCounts[r.Team] = (teamCounts[r.Team] || 0) + 1;
      });
      
      console.log("\nWorkGroup counts among scheduled:", wgCounts);
      console.log("Department counts among scheduled:", deptCounts);
      console.log("Team counts among scheduled:", teamCounts);

      console.log("\nSample scheduled people in BQ:");
      console.log(bqRows.slice(0, 15));
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
    process.exit();
  }
}

main();
