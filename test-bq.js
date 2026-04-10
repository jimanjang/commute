const { BigQuery } = require('@google-cloud/bigquery');
const path = require('path');

async function testBQ() {
  const keyFilename = path.join(process.cwd(), 'service-account.json');
  const bq = new BigQuery({ keyFilename });
  
  const query = `
    INSERT INTO \`secom-data.secom.workhistory_today\` (Name, WorkDate, WSTime, WCTime, ModifyUser)
    VALUES ('Laika', '20260403', '20260403080000', '20260403190000', 'ADMIN_TEST')
  `;
  
  try {
    const [job] = await bq.query({ query });
    console.log("Success:", job);
  } catch (err) {
    console.error("Failed:", err.message);
  }
}
testBQ();
