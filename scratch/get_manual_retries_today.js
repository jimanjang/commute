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
    console.log("=== Listing today's manual retry/run trigger logs ===");
    const [rows] = await pool.query(
      `SELECT id, sabun, name, email, status, error_message, created_at 
       FROM t_secom_trigger_log 
       WHERE DATE(created_at) = '2026-05-18'
       ORDER BY created_at ASC`
    );

    console.log(`Total trigger log entries today: ${rows.length}`);
    console.table(rows.map(r => ({
      ID: r.id,
      Sabun: r.sabun,
      Name: r.name,
      EmailUsed: r.email,
      Status: r.status,
      Error: r.error_message || 'None',
      Time: new Date(r.created_at).toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul' })
    })));

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
    process.exit();
  }
}

main();
