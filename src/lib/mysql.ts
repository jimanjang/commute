import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "172.17.3.206",
  port: 3306,
  user: "secom",
  password: "secom123",
  database: "secom",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 5000,
});

export default pool;
