const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host: '172.17.3.206', user: 'secom', password: 'secom123', database: 'secom'
  });

  console.log('Creating t_secom_slack_channel table...');
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS t_secom_slack_channel (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      team_name    VARCHAR(64) NOT NULL UNIQUE COMMENT '팀명 (GWS organizations.department 값)',
      channel_id   VARCHAR(32) NOT NULL COMMENT 'Slack 채널 ID (예: C0123456789)',
      channel_name VARCHAR(64) COMMENT '채널 표시명 (예: #people-team)',
      is_active    TINYINT(1) DEFAULT 1,
      created_at   DATETIME DEFAULT NOW(),
      updated_at   DATETIME DEFAULT NOW() ON UPDATE NOW()
    ) COMMENT='팀명과 Slack 채널 ID 매핑 테이블'
  `);

  console.log('✅ t_secom_slack_channel created.');

  // 테스트 데이터 삽입 (피플팀)
  await conn.execute(`
    INSERT IGNORE INTO t_secom_slack_channel (team_name, channel_id, channel_name)
    VALUES ('피플팀', 'PLACEHOLDER', '#people-team')
  `);
  console.log('✅ Sample row for 피플팀 inserted.');

  const [rows] = await conn.execute('SELECT * FROM t_secom_slack_channel');
  console.log('Current data:', rows);

  await conn.end();
}

migrate().catch(console.error);
