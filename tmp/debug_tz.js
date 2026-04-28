const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: '172.17.3.206', user: 'secom', password: 'secom123', database: 'secom'
});

async function main() {
  // Check what MySQL thinks "today" is
  const [curdate] = await pool.query("SELECT CURDATE() as d, NOW() as n");
  console.log("MySQL CURDATE:", curdate[0].d, "| NOW:", curdate[0].n);

  // Check logs with CONVERT_TZ
  const [rows1] = await pool.query(
    `SELECT sabun, notify_type, created_at, 
            DATE(CONVERT_TZ(created_at, '+00:00', '+09:00')) as kst_date
     FROM t_secom_trigger_log 
     WHERE trigger_id = 4 
     ORDER BY created_at DESC LIMIT 10`
  );
  console.log("\nLogs with CONVERT_TZ:");
  const lines = [];
  for (const r of rows1) {
    lines.push(`  ${r.sabun} | ${r.notify_type} | UTC: ${r.created_at.toISOString()} | KST_DATE: ${r.kst_date}`);
  }
  console.log(lines.join('\n'));

  // Check what todayStr would be
  const seoulString = new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" });
  const kst = new Date(seoulString);
  const yyyy = kst.getFullYear();
  const mm = String(kst.getMonth() + 1).padStart(2, '0');
  const dd = String(kst.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  console.log("\nApp todayStr (KST):", todayStr);

  // Query with todayStr
  const [rows2] = await pool.query(
    `SELECT DISTINCT sabun, notify_type FROM t_secom_trigger_log 
     WHERE trigger_id = 4 AND DATE(CONVERT_TZ(created_at, '+00:00', '+09:00')) = ? AND status = 'success'`,
    [todayStr]
  );
  console.log("\nAlready sent today (KST):", rows2.length, "rows");
  for (const r of rows2) {
    console.log("  ", r.sabun, r.notify_type);
  }

  await pool.end();
}
main();
