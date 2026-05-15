const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    host: "172.17.3.206",
    port: 3306,
    user: "secom",
    password: "secom123",
    database: "secom",
  });
  const [rows] = await pool.execute('SELECT * FROM t_secom_person LIMIT 5');
  console.log(JSON.stringify(rows, null, 2));
  await pool.end();
}
run();
