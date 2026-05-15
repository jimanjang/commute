const { getBigQueryClient } = require('./dist/lib/bigquery-oauth');

async function run() {
  try {
    const bq = await getBigQueryClient();
    const query = 'SELECT * FROM `karrotmarket.team_operation.vw_time_sheets_verbose` LIMIT 1';
    const [rows] = await bq.query({ query });
    if (rows.length > 0) {
      console.log('Columns:', Object.keys(rows[0]).join(', '));
      console.log('Sample Data:', JSON.stringify(rows[0], null, 2));
    } else {
      console.log('No data found in view.');
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}
run();
