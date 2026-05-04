const { BigQuery } = require('@google-cloud/bigquery');
const path = require('path');

async function main() {
  const keyFilename = path.join(process.cwd(), "service-account.json");
  const bigquery = new BigQuery({ keyFilename });

  const query = `
    SELECT 
      p.Name as name, 
      p.Sabun as sabun, 
      p.WorkGroup as workGroup
    FROM 
      \`secom-data.secom.person\` p
    WHERE 
      p.Name IS NOT NULL AND p.Name != '' AND p.Name != '미등록사용자'
      AND p.WorkGroup IN ('002', '006', '007')
    LIMIT 5
  `;

  try {
    console.log('=== [1] BigQuery Person Table Test ===');
    const [rows] = await bigquery.query({ query });
    console.log(`  결과: ${rows.length}건 발견`);
    for (const r of rows) {
      console.log(`  - ${r.name} (${r.sabun}) | WG: ${r.workGroup}`);
    }
  } catch (e) {
    console.error('  ❌ BQ 쿼리 실패:', e.message);
  }
}
main().catch(console.error);
