const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    host: "172.17.3.206",
    port: 3306,
    user: "secom",
    password: "secom123",
    database: "secom",
  });
  const [rows] = await pool.execute("SELECT COUNT(*) as count FROM t_secom_person WHERE Email IS NOT NULL AND Email != ''");
  console.log(rows[0]);
  await pool.end();
}
run();
