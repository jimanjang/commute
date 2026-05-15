const {BigQuery} = require('@google-cloud/bigquery');
const bq = new BigQuery({ keyFilename: 'service-account.json' });

async function checkSchema() {
  try {
    const query = 'SELECT * FROM `karrotmarket.team_operation.vw_time_sheets_verbose` LIMIT 1';
    const [rows] = await bq.query({ query });
    console.log('Sample Data:', JSON.stringify(rows, null, 2));
    
    if (rows.length > 0) {
      console.log('Columns:', Object.keys(rows[0]));
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}
checkSchema();
