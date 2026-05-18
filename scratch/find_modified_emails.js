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
    console.log("--- Rows in t_secom_person updated recently or containing .kssc / .lastname ---\n");

    // 1. Check rows containing '.kssc'
    const [ksscRows] = await pool.query(
      "SELECT Name, Sabun, Email, UpdateTime FROM t_secom_person WHERE Email LIKE '%kssc%'"
    );
    console.log(`Found ${ksscRows.length} rows with '.kssc':`);
    console.log(ksscRows);

    // 2. Check rows updated today (2026-05-18)
    const [recentRows] = await pool.query(
      "SELECT Name, Sabun, Email, UpdateTime FROM t_secom_person WHERE DATE(UpdateTime) = '2026-05-18' OR UpdateTime LIKE '2026-05-18%'"
    );
    console.log(`\nFound ${recentRows.length} rows updated today:`);
    console.log(recentRows);

    // 3. Let's see if there is another table that logs email updates or if we can see any t_secom_person rows where Email is updated but UpdateTime is different
    const [sampleEmails] = await pool.query(
      "SELECT Name, Sabun, Email, UpdateTime FROM t_secom_person WHERE Email IS NOT NULL AND Email != '' ORDER BY UpdateTime DESC LIMIT 20"
    );
    console.log(`\nLatest 20 updated emails:`);
    console.log(sampleEmails);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
    process.exit();
  }
}

main();
