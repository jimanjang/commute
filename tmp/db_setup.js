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
      CREATE TABLE IF NOT EXISTS t_secom_trigger (
        id INT AUTO_INCREMENT PRIMARY KEY,
        function_name VARCHAR(50) NOT NULL,
        event_source VARCHAR(50) DEFAULT 'TIME_DRIVEN',
        time_type VARCHAR(50) DEFAULT 'DAY_TIMER',
        time_value VARCHAR(20) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        last_run DATETIME,
        error_rate VARCHAR(10) DEFAULT '0%',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await pool.query(ddl);
    console.log('Table t_secom_trigger created successfully');
    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
setup();
