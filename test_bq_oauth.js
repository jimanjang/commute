const {BigQuery} = require('@google-cloud/bigquery');
const {OAuth2Client} = require('google-auth-library');

async function testBigQuery() {
  const accessToken = process.env.ACCESS_TOKEN;
  if (!accessToken) {
    console.error('Error: Please provide ACCESS_TOKEN environment variable.');
    return;
  }

  try {
    const oauth2Client = new OAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const bq = new BigQuery({ 
      projectId: 'karrotmarket',
      authClient: oauth2Client 
    });

    console.log('Querying BigQuery...');
    
    // Testing time_sheets
    const query = `
      SELECT ts.date, u.email, ts.sheet_type
      FROM \`karrotmarket.db_karrot_cs_kr.time_sheets\` ts
      JOIN \`karrotmarket.db_karrot_cs_kr.admin_users\` u ON ts.admin_user_id = u.id
      LIMIT 3
    `;

    const [rows] = await bq.query({ query });
    console.log('✅ Query Successful! Found data:');
    console.log(JSON.stringify(rows, null, 2));

  } catch (e) {
    console.error('❌ Query Failed:', e.message);
  }
}

testBigQuery();
