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
    const query = 'SELECT * FROM `karrotmarket.db_karrot_cs_kr.admin_users` LIMIT 1';
    const [rows] = await bq.query({ query });
    console.log('Columns:', Object.keys(rows[0]).join(', '));
    console.log('Sample Status:', rows[0].status || rows[0].work_status || rows[0].employment_status || 'not found');
  } catch (err) {
    console.error(err.message);
  }
}
run();
