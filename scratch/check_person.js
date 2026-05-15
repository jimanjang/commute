const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const connection = await mysql.createConnection(process.env.MYSQL_URL);
  const [rows] = await connection.execute('SELECT * FROM t_secom_person LIMIT 5');
  console.log(JSON.stringify(rows, null, 2));
  await connection.end();
}
run();
