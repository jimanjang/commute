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

  const bq = new BigQuery({
    projectId: 'karrotmarket',
    authClient: oauth2Client
  });

  const query = 'SELECT * FROM `karrotmarket.team_operation.vw_time_sheets_verbose` LIMIT 1';
  try {
    const [rows] = await bq.query({ query });
    if (rows.length > 0) {
      console.log('Columns:', Object.keys(rows[0]).join(', '));
      console.log('Sample Data:', JSON.stringify(rows[0], null, 2));
    }
  } catch (e) {
    console.error(e.message);
  }
}
run();
