const { BigQuery } = require('@google-cloud/bigquery');
const path = require('path');

async function main() {
  const keyFilename = path.join(process.cwd(), "service-account.json");
  const bigquery = new BigQuery({ keyFilename });

  const query = 'SELECT * FROM `karrotmarket.team_operation.vw_admin_user_info` LIMIT 1';
  const [rows] = await bigquery.query({ query, location: 'US' });

  if (rows.length > 0) {
    console.log('Columns in vw_admin_user_info:', Object.keys(rows[0]));
    console.log('Sample data:', rows[0]);
  } else {
    console.log('No data found in vw_admin_user_info');
  }
}

main().catch(console.error);
