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
    console.log("--- Sample records from t_secom_person ---");
    const [personRows] = await pool.query("SELECT * FROM t_secom_person LIMIT 10");
    console.log(personRows);

    console.log("\n--- Unique teams in t_secom_person ---");
    const [teamRows] = await pool.query("SELECT Team, COUNT(*) as cnt FROM t_secom_person GROUP BY Team");
    console.log(teamRows);

    console.log("\n--- Unique departments in t_secom_person ---");
    const [deptRows] = await pool.query("SELECT Department, COUNT(*) as cnt FROM t_secom_person GROUP BY Department");
    console.log(deptRows);

    console.log("\n--- Slack channels mappings ---");
    const [channelRows] = await pool.query("SELECT * FROM t_secom_slack_channel");
    console.log(channelRows);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
    process.exit();
  }
}

main();
