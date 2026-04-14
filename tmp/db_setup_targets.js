const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: "172.17.3.206",
  port: 3306,
  user: "secom",
  password: "secom123",
  database: "secom"
});

async function setup() {
  try {
    const ddl = `
      CREATE TABLE IF NOT EXISTS t_secom_trigger_target (
        id INT AUTO_INCREMENT PRIMARY KEY,
        trigger_id INT NOT NULL,
        sabun VARCHAR(20) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX (trigger_id),
        INDEX (sabun)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await pool.query(ddl);
    console.log('Table t_secom_trigger_target created successfully');
    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
setup();
