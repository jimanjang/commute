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

  const query = 'SELECT Name, Sabun, Department, Team FROM `secom-data.secom.person` WHERE Name IS NOT NULL LIMIT 10';
  const [rows] = await bigquery.query({ query, location: 'asia-northeast3' });

  console.log('Sample from secom.person:');
  rows.forEach(r => {
    console.log(`Name: ${r.Name}, Team: "${r.Team}", Dept: "${r.Department}"`);
  });
}

main().catch(console.error);
