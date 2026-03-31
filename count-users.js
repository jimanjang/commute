const {BigQuery} = require('@google-cloud/bigquery');
const bq = new BigQuery({ keyFilename: 'service-account.json' });

async function test() {
  const query = 'SELECT COUNT(DISTINCT Name) as count FROM `secom-data.secom.person` WHERE Name IS NOT NULL AND Name != "" AND Name != "미등록사용자"';
  try {
    const [rows] = await bq.query({ query });
    console.log('Final Count with Names:', rows[0].count);
  } catch (e) {
    console.error('Error:', e.message);
  }
}
test();
