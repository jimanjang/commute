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
    const [tables] = await bq.dataset('db_karrot_cs_kr').getTables();
    console.log('Tables in db_karrot_cs_kr:', tables.map(t => t.id).join(', '));
    
    const [tables2] = await bq.dataset('team_operation').getTables();
    console.log('Tables in team_operation:', tables2.map(t => t.id).join(', '));
  } catch (err) {
    console.error(err.message);
  }
}
run();
