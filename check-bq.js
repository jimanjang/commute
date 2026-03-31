const {BigQuery} = require('@google-cloud/bigquery');
const bq = new BigQuery({ keyFilename: 'service-account.json' });

async function test() {
  const query = 'SELECT COUNT(*) as total, COUNTIF(Name != "미등록사용자" AND Name IS NOT NULL) as withName, COUNTIF(Sabun != "" AND Sabun IS NOT NULL) as withSabun FROM `secom-data.secom.person`';
  try {
    const [rows] = await bq.query({ query });
    console.log('Results:', JSON.stringify(rows[0], null, 2));
    
    const [sample] = await bq.query('SELECT Name, Sabun, EmployeeNo FROM `secom-data.secom.person` WHERE Name != "미등록사용자" AND Name IS NOT NULL LIMIT 10');
    console.log('Sample IDs:', JSON.stringify(sample, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  }
}
test();
