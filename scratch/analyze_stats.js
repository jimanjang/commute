const { getBigQueryClient } = require('./dist/lib/bigquery-oauth');
const mysql = require('mysql2/promise');

async function run() {
  try {
    const bq = await getBigQueryClient();
    const pool = await mysql.createConnection({ 
      host: '172.17.3.206', port: 3306, user: 'secom', password: 'secom123', database: 'secom' 
    });

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
      const descStr = descs.join(', ');
      
      const isOnLeave = descs.some(d => ['휴가', '반차', '병가', '공가', '경조', '휴원', '조퇴'].some(k => d.includes(k)));
      const isWorkDay = descs.some(d => d === '근무일' || d === '업무' || d === '교육' || d === '회의' || d === '면담' || d === '출장');
      
      // Special logic from Duty Status page
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

    console.log('--- Breakdown ---');
    console.log('Total Active Users:', activeUsers.length);
    console.log('Today Targets (Working):', targets);
    console.log('On Leave:', leave);
    console.log('Just Off (No records):', off);
    console.log('Special Schedules Count:', specialCount);

    await pool.end();
  } catch (err) {
    console.error(err);
  }
}
run();
