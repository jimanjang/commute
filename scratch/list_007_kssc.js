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
    console.log("--- Querying all t_secom_person records with '.kssc' in email ---");
    const [ksscRows] = await pool.query(
      "SELECT Name, Sabun, Email, WorkGroup, UpdateTime FROM t_secom_person WHERE Email LIKE '%kssc%' ORDER BY Name ASC"
    );
    console.log(`Total count: ${ksscRows.length}`);
    console.log(JSON.stringify(ksscRows, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
    process.exit();
  }
}

main();
