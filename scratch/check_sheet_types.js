const { BigQuery } = require('@google-cloud/bigquery');
const fs = require('fs');
const { OAuth2Client } = require('google-auth-library');

async function run() {
  const tokens = JSON.parse(fs.readFileSync('token.json', 'utf8'));
  const oauth2Client = new OAuth2Client('32555940559.apps.googleusercontent.com', 'ZmssLNjJy2998hD4CTg2ejr2');
  oauth2Client.setCredentials(tokens);
  const bq = new BigQuery({ projectId: 'karrotmarket', authClient: oauth2Client });
  
  try {
    const [rows] = await bq.query({ 
      query: 'SELECT sheet_type, description FROM `karrotmarket.team_operation.utility_time_sheets_sheet_type` ORDER BY sheet_type', 
      location: 'US' 
    });
    console.log(JSON.stringify(rows, null, 2));
  } catch (e) {
    console.error(e);
  }
}
run();
