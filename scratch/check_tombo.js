const { BigQuery } = require('@google-cloud/bigquery');
const path = require('path');

async function run() {
  const bq = new BigQuery({ keyFilename: path.join(process.cwd(), 'service-account.json') });
  const query = `
    SELECT * 
    FROM \`karrotmarket.team_operation.vw_time_sheets_verbose\` 
    WHERE email = "tombo.lee@daangnservice.com" 
      AND date = CURRENT_DATE("+09:00") 
    LIMIT 1
  `;
  try {
    const [rows] = await bq.query({ query });
    console.log(JSON.stringify(rows[0], null, 2));
  } catch (e) {
    console.error(e);
  }
}
run();
