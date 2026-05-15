const { BigQuery } = require('@google-cloud/bigquery');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

const CLIENT_ID = '32555940559.apps.googleusercontent.com';
const CLIENT_SECRET = 'ZmssLNjJy2998hD4CTg2ejr2';

async function getBigQueryClient() {
  const tokenPath = path.join(process.cwd(), 'token.json');
  const tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET);
  oauth2Client.setCredentials(tokens);
  return new BigQuery({
    projectId: 'karrotmarket',
    authClient: oauth2Client
  });
}

async function main() {
  const bigquery = await getBigQueryClient();

  // Find people who still have no Team info
  const query = 'SELECT Name, Sabun, Team FROM `secom-data.secom.person` WHERE (Team IS NULL OR Team = "") AND Name != "미등록사용자" LIMIT 20';
  const [rows] = await bigquery.query({ query, location: 'asia-northeast3' });

  console.log('--- Users with missing Team info in BigQuery ---');
  if (rows.length === 0) {
    console.log('None found in top 20! Everyone seems to have a Team.');
  } else {
    rows.forEach(r => {
      console.log(`Name: ${r.Name}, Sabun: "${r.Sabun}", Team: "${r.Team}"`);
    });
  }
}

main().catch(console.error);
