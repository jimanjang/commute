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

  const query = `
    SELECT ts.*, u.email
    FROM \`karrotmarket.team_operation.vw_time_sheets_verbose\` ts
    JOIN \`karrotmarket.db_karrot_cs_kr.admin_users\` u ON ts.admin_user_id = u.id
    WHERE u.email = "tombo.lee@daangnservice.com" 
      AND ts.date = CURRENT_DATE("+09:00")
  `;
  try {
    const [rows] = await bq.query({ query });
    console.log(JSON.stringify(rows, null, 2));
  } catch (e) {
    console.error(e.message);
  }
}
run();
