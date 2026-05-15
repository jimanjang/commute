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

  const query = 'SELECT Name, Sabun FROM `secom-data.secom.person` WHERE Sabun IS NOT NULL AND Sabun != "" LIMIT 10';
  const [rows] = await bigquery.query({ query, location: 'asia-northeast3' });

  console.log('Sabun samples from secom.person:');
  rows.forEach(r => {
    console.log(`Name: ${r.Name}, Sabun: "${r.Sabun}"`);
  });
}

main().catch(console.error);
