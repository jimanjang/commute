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

  // Try to find columns like email, name, team, department
  const query = 'SELECT email, name, team, department, part FROM `karrotmarket.team_operation.vw_admin_user_info` LIMIT 10';
  const [rows] = await bigquery.query({ query, location: 'US' });

  console.log('Sample from vw_admin_user_info:');
  rows.forEach(r => {
    console.log(`Email: ${r.email}, Name: ${r.name}, Team: "${r.team}", Dept: "${r.department}"`);
  });
}

main().catch(console.error);
