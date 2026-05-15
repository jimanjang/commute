const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({ host: '172.17.3.206', user: 'secom', password: 'secom123', database: 'secom' });
  try {
    const today = '20260515';
    console.log(`--- Checking Work History for ${today} ---`);
    const [rows] = await pool.query("SELECT * FROM t_secom_workhistory WHERE WorkDate = ? LIMIT 10", [today]);
    
    if (rows.length === 0) {
      console.log("❌ No records found for today in t_secom_workhistory!");
      // Try with hyphens just in case
      const [rows2] = await pool.query("SELECT * FROM t_secom_workhistory WHERE WorkDate = ? LIMIT 5", ['2026-05-15']);
      console.log("Hyphenated check:", rows2.length > 0 ? "Found records" : "No records");
    } else {
      console.log(`✅ Found ${rows.length} sample records:`);
      rows.forEach(r => console.log(`Name: ${r.Name}, Time: ${r.WSTime}, Sabun: ${r.Sabun}`));
    }
  } catch (err) {
    console.error('Query failed:', err.message);
  } finally {
    process.exit();
  }
}

main();
