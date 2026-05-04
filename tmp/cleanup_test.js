const mysql = require('mysql2/promise');

async function cleanup() {
  const connection = await mysql.createConnection({
    host: '172.17.3.206',
    user: 'secom',
    password: 'secom123',
    database: 'secom'
  });

  try {
    const todayStr = new Date().toLocaleDateString('en-CA');
    const dbDate = todayStr.replace(/-/g, '');

    await connection.execute("DELETE FROM t_secom_trigger_log WHERE sabun LIKE 'T00%'");
    await connection.execute("DELETE FROM t_secom_workhistory WHERE WorkDate = ? AND Name LIKE 'TestUser_%'", [dbDate]);
    await connection.execute("DELETE FROM t_secom_person WHERE Sabun LIKE 'T00%'");

    console.log("✅ Cleanup complete.");
  } catch (e) {
    console.error("Cleanup Error:", e);
  } finally {
    await connection.end();
  }
}

cleanup();
