const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: '172.17.3.206',
    user: 'secom',
    password: 'secom123',
    database: 'secom',
    port: 3306
  });

  try {
    const [tables] = await pool.query("SHOW TABLES");
    console.log("Tables in database:", tables);

    for (const t of tables) {
      const tableName = Object.values(t)[0];
      const [columns] = await pool.query(`SHOW COLUMNS FROM ${tableName}`);
      console.log(`\nColumns in ${tableName}:`);
      console.log(columns.map(c => c.Field));
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
    process.exit();
  }
}

main();
