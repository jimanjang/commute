const { BigQuery } = require('@google-cloud/bigquery');
const path = require('path');

async function main() {
  const keyFilename = path.join(process.cwd(), "service-account.json");
  const bigquery = new BigQuery({ keyFilename });

  // 1. Laika의 모든 컬럼 확인
  console.log("=== [1] Laika(라이카) 전체 컬럼 확인 ===");
  const [rows1] = await bigquery.query({
    query: `SELECT * FROM \`secom-data.secom.person\` WHERE Name LIKE '%라이카%' OR Name LIKE '%Laika%' LIMIT 3`
  });

  if (rows1.length === 0) {
    console.log("  ❌ Laika 데이터 없음");
  } else {
    console.log("  컬럼 목록:", Object.keys(rows1[0]).join(', '));
    for (const r of rows1) {
      console.log("  데이터:", JSON.stringify(r, null, 2));
    }
  }

  // 2. person 테이블 전체 스키마 확인
  console.log("\n=== [2] person 테이블 스키마 전체 컬럼 확인 ===");
  const [meta] = await bigquery.dataset('secom').table('person').getMetadata();
  const fields = meta.schema.fields;
  fields.forEach(f => console.log(`  - ${f.name} (${f.type})`));
}

main().catch(console.error);
