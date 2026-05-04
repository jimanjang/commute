const mysql = require('mysql2/promise');
const pool = mysql.createPool({ host: '172.17.3.206', user: 'secom', password: 'secom123', database: 'secom' });

async function main() {
  const sql = `
    CREATE TABLE IF NOT EXISTS t_secom_scheduler_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      executed_count INT NOT NULL DEFAULT 0,
      executed_list TEXT NULL,
      error_message TEXT NULL,
      INDEX idx_executed_at (executed_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `;
  await pool.query(sql);
  console.log('✅ t_secom_scheduler_log 테이블 생성 완료');
  await pool.end();
}
main().catch(e => { console.error('❌ 실패:', e.message); process.exit(1); });
