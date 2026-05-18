const { BigQuery } = require('@google-cloud/bigquery');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');

async function main() {
  const tokens = JSON.parse(fs.readFileSync('C:/Users/당근서비스/.antigravity/secom-admin/commute/token.json', 'utf8'));
  const oauth2Client = new OAuth2Client('32555940559.apps.googleusercontent.com', 'ZmssLNjJy2998hD4CTg2ejr2');
  oauth2Client.setCredentials(tokens);
  const bq = new BigQuery({ projectId: 'karrotmarket', authClient: oauth2Client });

  try {
    console.log("--- Unique WorkGroups in BigQuery ---");
    const [wgRows] = await bq.query({
      query: "SELECT WorkGroup, COUNT(*) as cnt FROM `secom-data.secom.person` GROUP BY WorkGroup",
      location: 'asia-northeast3'
    });
    console.log(wgRows);

    console.log("\n--- Unique Teams in BigQuery ---");
    const [teamRows] = await bq.query({
      query: "SELECT Team, Department, COUNT(*) as cnt FROM `secom-data.secom.person` GROUP BY Team, Department LIMIT 20",
      location: 'asia-northeast3'
    });
    console.log(teamRows);

    console.log("\n--- Sample Roster Data (First 10) ---");
    const [sampleRows] = await bq.query({
      query: "SELECT Name, Sabun, Department, Team, WorkGroup FROM `secom-data.secom.person` LIMIT 10",
      location: 'asia-northeast3'
    });
    console.log(sampleRows);

  } catch (err) {
    console.error("Error checking BQ:", err);
  } finally {
    process.exit();
  }
}

main();
