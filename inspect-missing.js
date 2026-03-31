const {BigQuery} = require('@google-cloud/bigquery');
const bq = new BigQuery({ keyFilename: 'service-account.json' });

async function test() {
  const query = 'SELECT * FROM `secom-data.secom.person` WHERE Name != "미등록사용자" AND Name IS NOT NULL LIMIT 10';
  try {
    const [rows] = await bq.query({ query });
    console.log('Keys in row:', Object.keys(rows[0]));
    console.log('Sample Data (First 10):');
    rows.forEach(r => {
      console.log(`- Name: ${r.Name}, Sabun: ${r.Sabun}, EmployeeNo: ${r.EmployeeNo}, Ssabun: ${r.Ssabun}`);
    });
  } catch (e) {
    console.error('Error:', e.message);
  }
}
test();
