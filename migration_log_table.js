const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: "172.17.3.206",
    port: 3306,
    user: "secom",
    password: "secom123",
    database: "secom",
  });

  console.log("Connected to database. Creating table...");

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS t_secom_trigger_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      trigger_id INT,
      trigger_name VARCHAR(255),
      sabun VARCHAR(50),
      name VARCHAR(50),
      email VARCHAR(100),
      notify_type VARCHAR(50),
      status VARCHAR(20),
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_trigger_id (trigger_id),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await connection.query(createTableQuery);
    console.log("✅ Table 't_secom_trigger_log' created or already exists.");
  } catch (err) {
    console.error("❌ Error creating table:", err);
  } finally {
    await connection.end();
  }
}

migrate();
