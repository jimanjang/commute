const { BigQuery } = require('@google-cloud/bigquery');
async function query() {
  const bigquery = new BigQuery({ keyFilename: 'service-account.json' });
  try {
    const [rows] = await bigquery.query({
      query: `SELECT WorkDate, Name, WSTime, WCTime, TotalWorkTime FROM \`secom-data.secom.workhistory\` WHERE Name LIKE '%Laika%' ORDER BY WorkDate DESC LIMIT 5`
    });
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  }
}
query();
