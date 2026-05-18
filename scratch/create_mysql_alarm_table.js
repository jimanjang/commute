const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: '172.17.3.206',
    user: 'secom',
    password: 'secom123',
    database: 'secom'
  });

  try {
    console.log("Creating t_secom_alarm table in MySQL...");
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS t_secom_alarm (
        ATime VARCHAR(14) NOT NULL,
        ID INT NULL,
        EqCode INT NOT NULL,
        Master INT NOT NULL,
        Param INT NULL,
        Ack INT NULL,
        AckUser VARCHAR(16) NULL,
        AckTime VARCHAR(14) NULL,
        AckContent VARCHAR(64) NULL,
        Transfer INT NULL,
        AckMode INT NULL,
        CardNo VARCHAR(18) NOT NULL,
        Name VARCHAR(64) NULL,
        State VARCHAR(7) NULL,
        Flag1 VARCHAR(4) NULL,
        Flag2 VARCHAR(4) NULL,
        Flag3 VARCHAR(4) NULL,
        Flag4 VARCHAR(4) NULL,
        InsertTime VARCHAR(20) NULL,
        UpdateTime VARCHAR(20) NULL,
        Version VARCHAR(20) NULL,
        Sabun VARCHAR(50) NULL,
        PRIMARY KEY (ATime, EqCode, Master, CardNo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    
    console.log("✅ Table t_secom_alarm created successfully!");
    
  } catch (error) {
    console.error("❌ Error creating table:", error);
  } finally {
    await connection.end();
  }
}

main();
