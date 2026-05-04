const { BigQuery } = require('@google-cloud/bigquery');
const path = require('path');

async function main() {
  const keyFilename = path.join(process.cwd(), "service-account.json");
  const bigquery = new BigQuery({ keyFilename });

  const [rows] = await bigquery.query({
    query: "SELECT Name, Sabun, Team, Department, UpdateTime FROM `secom-data.secom.person` WHERE Name LIKE '%라이카%' OR Name LIKE '%Laika%' LIMIT 5"
  });

  if (rows.length === 0) {
    console.log("결과 없음");
    return;
  }

  for (const r of rows) {
    console.log(`Name: ${r.Name}`);
    console.log(`  Sabun: ${r.Sabun}`);
    console.log(`  Team: "${r.Team}"`);
    console.log(`  Department: "${r.Department}"`);
    console.log(`  UpdateTime: ${r.UpdateTime}`);
    console.log('---');
  }
}

main().catch(console.error);
