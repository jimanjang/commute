const {BigQuery} = require('@google-cloud/bigquery');
const bq = new BigQuery({ keyFilename: 'service-account.json' });

async function test() {
  const query = 'SELECT WorkGroup, COUNT(*) as count FROM `secom-data.secom.person` WHERE Name IS NOT NULL AND Name != "미등록사용자" AND Name != "" GROUP BY WorkGroup';
  try {
    const [rows] = await bq.query({ query });
    console.log('WorkGroup Distribution:', JSON.stringify(rows, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  }
}
test();
