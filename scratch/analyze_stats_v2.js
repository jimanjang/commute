const { BigQuery } = require('@google-cloud/bigquery');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const CLIENT_ID = '32555940559.apps.googleusercontent.com';
const CLIENT_SECRET = 'ZmssLNjJy2998hD4CTg2ejr2';

async function run() {
  const tokenPath = path.join(process.cwd(), 'token.json');
  const tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET);
  oauth2Client.setCredentials(tokens);
  const bq = new BigQuery({ projectId: 'karrotmarket', authClient: oauth2Client });
  const pool = await mysql.createConnection({ host: '172.17.3.206', port: 3306, user: 'secom', password: 'secom123', database: 'secom' });

  try {
    const [activeUsers] = await bq.query({ query: "SELECT email, name FROM `karrotmarket.db_karrot_cs_kr.admin_users` WHERE workStatus = '재직'" });
    const [schedules] = await pool.query('SELECT email, sheet_type_description FROM t_secom_schedule WHERE date = CURDATE()');
    
    const scheduleMap = new Map();
    schedules.forEach(s => {
      if (!s.email) return;
      const email = s.email.toLowerCase();
      if (!scheduleMap.has(email)) scheduleMap.set(email, []);
      scheduleMap.get(email).push(s.sheet_type_description);
    });

    let targets = 0;
    let leave = 0;
    let off = 0;
    let specialCount = 0;

    activeUsers.forEach(u => {
      const descs = scheduleMap.get(u.email.toLowerCase()) || [];
      const isOnLeave = descs.some(d => ['휴가', '반차', '병가', '공가', '경조', '휴원', '조퇴'].some(k => d.includes(k)));
      const isWorkDay = descs.some(d => ['근무일', '업무', '교육', '회의', '면담', '출장'].includes(d));
      const hasSpecial = descs.some(d => !['근무일', '업무', '보정시간', '휴가 발생'].includes(d));

      if (isOnLeave) {
        leave++;
        specialCount++;
      } else if (isWorkDay) {
        targets++;
        if (hasSpecial) specialCount++;
      } else {
        off++; 
      }
    });

    console.log('Total Active:', activeUsers.length);
    console.log('Working Targets:', targets);
    console.log('On Leave:', leave);
    console.log('Just Off/Missing:', off);
    console.log('Special (Holiday/Leave/etc):', specialCount);
    
    await pool.end();
  } catch (err) {
    console.error(err);
  }
}
run();
