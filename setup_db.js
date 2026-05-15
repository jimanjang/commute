const mysql = require('mysql2/promise');

async function setupDB() {
  const connection = await mysql.createConnection({
    host: "172.17.3.206",
    port: 3306,
    user: "secom",
    password: "secom123",
    database: "secom",
  });

  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS t_secom_schedule (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        sheet_type INT,
        sheet_type_description VARCHAR(100),
        start_time VARCHAR(10),
        end_time VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email_date (email, date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    console.log('Creating t_secom_schedule table...');
    await connection.query(createTableQuery);
    console.log('✅ t_secom_schedule table created or already exists.');

  } catch (error) {
    console.error('❌ Error creating table:', error);
  } finally {
    await connection.end();
  }
}

setupDB();
