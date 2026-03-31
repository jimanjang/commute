const {BigQuery} = require('@google-cloud/bigquery');
const bq = new BigQuery({ keyFilename: 'service-account.json' });

async function test() {
  const query = 'SELECT * FROM `secom-data.secom.person` WHERE Name != "미등록사용자" AND Name IS NOT NULL LIMIT 1';
  try {
    const [rows] = await bq.query({ query });
    if (rows.length > 0) {
      console.log('Row details:', JSON.stringify(rows[0], null, 2));
    } else {
      console.log('No rows found.');
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}
test();
