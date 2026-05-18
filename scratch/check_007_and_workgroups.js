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
    // 1. Get all unique WorkGroup values in t_secom_person and counts
    const [wgCounts] = await pool.query(
      "SELECT WorkGroup, COUNT(*) as cnt FROM t_secom_person GROUP BY WorkGroup"
    );
    console.log("WorkGroup counts in t_secom_person:");
    console.log(wgCounts);

    // 2. Query all users where WorkGroup = '007'
    const [wg007] = await pool.query(
      "SELECT Name, Sabun, Email, Team, WorkGroup, UpdateTime FROM t_secom_person WHERE WorkGroup = '007'"
    );
    console.log("\nUsers in WorkGroup '007':");
    console.log(JSON.stringify(wg007, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
    process.exit();
  }
}

main();
