const mysql = require('mysql2/promise');
const config = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'secom',
  port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306
};

async function run() {
  const connection = await mysql.createConnection(config);
  const [rows] = await connection.execute(
    "SELECT WorkDate, WSTime, WCTime, typeof(WCTime) as type_info FROM t_secom_workhistory WHERE Name = 'Laika(장지만)' ORDER BY InsertTime DESC LIMIT 5"
  ).catch(async () => {
     // If typeof doesn't work
     return await connection.execute("SELECT WorkDate, WSTime, WCTime FROM t_secom_workhistory WHERE Name = 'Laika(장지만)' ORDER BY InsertTime DESC LIMIT 5");
  });
  console.log(JSON.stringify(rows, null, 2));
  await connection.end();
}
run();
