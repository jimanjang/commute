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
    console.log("--- Checking MySQL t_secom_person ---");
    const [mysqlRows] = await pool.query("SELECT Team, COUNT(*) as cnt FROM t_secom_person GROUP BY Team");
    console.log(mysqlRows);

    console.log("\n--- Checking BigQuery secom-data.secom.person ---");
    const [bqRows] = await bq.query({
      query: "SELECT Team, COUNT(*) as cnt FROM `secom-data.secom.person` GROUP BY Team",
      location: 'asia-northeast3'
    });
    console.log(bqRows);

    console.log("\n--- Sample matched records from MySQL t_secom_person ---");
    const [sampleRows] = await pool.query("SELECT Name, Sabun, Email, Team FROM t_secom_person WHERE Team IS NOT NULL AND Team != '' LIMIT 10");
    console.log(sampleRows);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
    process.exit();
  }
}

main();
