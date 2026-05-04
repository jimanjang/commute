const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: '172.17.3.206',
    user: 'secom',
    password: 'secom123',
    database: 'secom'
  });

  try {
    // 1. t_secom_person 테이블 스키마 확인
    console.log("=== [1] t_secom_person 테이블 컬럼 목록 ===");
    const [cols] = await connection.execute("DESCRIBE t_secom_person");
    cols.forEach(c => console.log(`  - ${c.Field} (${c.Type}) ${c.Null === 'NO' ? 'NOT NULL' : ''}`));

    // 2. Laika 데이터 확인
    console.log("\n=== [2] Laika(라이카) MySQL 데이터 확인 ===");
    const [rows] = await connection.execute(
      "SELECT * FROM t_secom_person WHERE Name LIKE ? OR Name LIKE ? LIMIT 5",
      ['%라이카%', '%Laika%']
    );
    if (rows.length === 0) {
      console.log("  ❌ MySQL에 Laika 데이터 없음");
    } else {
      for (const r of rows) {
        console.log("  데이터:", JSON.stringify(r, null, 2));
      }
    }

    // 3. Team 컬럼이 있는지 확인 (or 다른 이름)
    console.log("\n=== [3] Team 관련 컬럼 검색 ===");
    const teamCols = cols.filter(c => c.Field.toLowerCase().includes('team') || c.Field.toLowerCase().includes('dept') || c.Field.toLowerCase().includes('attr') || c.Field.toLowerCase().includes('custom'));
    if (teamCols.length === 0) {
      console.log("  ❌ Team/Custom 관련 컬럼 없음");
    } else {
      teamCols.forEach(c => console.log(`  ✅ ${c.Field} (${c.Type})`));
    }

  } finally {
    await connection.end();
  }
}

main().catch(console.error);
