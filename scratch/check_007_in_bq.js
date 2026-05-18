const { BigQuery } = require('@google-cloud/bigquery');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');

async function main() {
  try {
    const tokens = JSON.parse(fs.readFileSync('C:/Users/당근서비스/.antigravity/secom-admin/commute/token.json', 'utf8'));
    const oauth2Client = new OAuth2Client('32555940559.apps.googleusercontent.com', 'ZmssLNjJy2998hD4CTg2ejr2');
    oauth2Client.setCredentials(tokens);
    const bq = new BigQuery({ projectId: 'karrotmarket', authClient: oauth2Client });

    const query = "SELECT Name, Sabun, Email, Team, WorkGroup, UpdateTime FROM `secom-data.secom.person` WHERE WorkGroup = '007'";
    const [rows] = await bq.query({ query, location: 'asia-northeast3' });
    
    console.log("Users in BigQuery secom.person where WorkGroup = '007':");
    console.log(rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

main();
