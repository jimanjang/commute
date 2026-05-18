const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: '172.17.3.206',
    user: 'secom',
    password: 'secom123',
    database: 'secom'
  });

  try {
    console.log("Converting t_secom_alarm collation to utf8mb4_0900_ai_ci...");
    
    await connection.query(`
      ALTER TABLE t_secom_alarm CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
    `);
    
    console.log("✅ Collation converted successfully!");
    
  } catch (error) {
    console.error("❌ Error converting collation:", error);
  } finally {
    await connection.end();
  }
}

main();
