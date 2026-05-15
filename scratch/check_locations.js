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
    const [meta1] = await bq.dataset('secom', { projectId: 'secom-data' }).getMetadata();
    console.log('secom-data.secom location:', meta1.location);

    const [meta2] = await bq.dataset('team_operation', { projectId: 'karrotmarket' }).getMetadata();
    console.log('karrotmarket.team_operation location:', meta2.location);
  } catch (err) {
    console.error(err.message);
  }
}
run();
