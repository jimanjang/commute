const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: '172.17.3.206',
    user: 'secom',
    password: 'secom123',
    database: 'secom',
    port: 3306
  });

  try {
    const [triggers] = await pool.query("SELECT * FROM t_secom_trigger");
    console.log(triggers);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
    process.exit();
  }
}

main();
