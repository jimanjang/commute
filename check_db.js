const mysql = require('mysql2/promise');

async function check() {
  const pool = mysql.createPool({ 
    host: '172.17.3.206', 
    user: 'secom', 
    password: 'secom123', 
    database: 'secom' 
  });
  
  try {
    const [rows] = await pool.query("SELECT WSTime, WCTime, ModifyUser, ModifyTime FROM t_secom_workhistory WHERE Name = 'Laika(장지만)' AND WorkDate = '20260331' ORDER BY InsertTime DESC LIMIT 1");
    console.log("DB_RESULT_START");
    console.log(JSON.stringify(rows[0], null, 2));
    console.log("DB_RESULT_END");
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

check();
