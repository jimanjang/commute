const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: '172.17.3.206',
  user: 'secom',
  password: 'secom123',
  database: 'secom'
});

async function main() {
  try {
    await pool.query('ALTER TABLE t_secom_trigger ADD COLUMN days_of_week VARCHAR(50) DEFAULT "1,2,3,4,5"');
    console.log("Column days_of_week added successfully.");
  } catch (err) {
    if (err.code === 'ER_DUP_COLUMN_NAME') {
      console.log("Column already exists.");
    } else {
      console.error(err);
    }
  } finally {
    await pool.end();
  }
}

main();
