const { BigQuery } = require('@google-cloud/bigquery');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

const CLIENT_ID = '32555940559.apps.googleusercontent.com';
const CLIENT_SECRET = 'ZmssLNjJy2998hD4CTg2ejr2';

async function run() {
  const tokenPath = path.join(process.cwd(), 'token.json');
  const tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET);
  oauth2Client.setCredentials(tokens);
  const bq = new BigQuery({ projectId: 'karrotmarket', authClient: oauth2Client });

  try {
    const query = 'SELECT * FROM `karrotmarket.team_operation.vw_admin_user_info` LIMIT 1';
    const [rows] = await bq.query({ query });
    console.log('Columns in vw_admin_user_info:', Object.keys(rows[0]).join(', '));
    console.log('Sample Row:', JSON.stringify(rows[0], null, 2));
  } catch (err) {
    console.error(err.message);
  }
}
run();
