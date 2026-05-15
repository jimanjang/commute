const mysql = require('mysql2/promise');
const { BigQuery } = require('@google-cloud/bigquery');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');

async function main() {
  const pool = mysql.createPool({ host: '172.17.3.206', user: 'secom', password: 'secom123', database: 'secom' });
  const tokens = JSON.parse(fs.readFileSync('C:/Users/당근서비스/.antigravity/secom-admin/commute/token.json', 'utf8'));
  const oauth2Client = new OAuth2Client('32555940559.apps.googleusercontent.com', 'ZmssLNjJy2998hD4CTg2ejr2');
  oauth2Client.setCredentials(tokens);
  const bq = new BigQuery({ projectId: 'karrotmarket', authClient: oauth2Client });

  try {
    const targetDate = '2026-05-18'; // Monday
    const testTimes = ['10:10', '16:30'];

    // Virtual Check-in Data (Fuzzy mapping)
    const virtualWork = [
      { key: 'Laika', WSTime: '20260518101300', bLate: 1 },
      { key: 'Tombo', WSTime: '20260518100500', bLate: 1 },
      { key: 'Sina', WSTime: '20260518150000', bLate: 1 },
      { key: 'Alice', WSTime: '20260518161000', bLate: 1 }
    ];

    const [rosterRows] = await bq.query({ query: "SELECT Name, Sabun, Team FROM `secom-data.secom.person` WHERE WorkGroup IN ('002', '006', '007')", location: 'asia-northeast3' });
    const [scheduleRows] = await pool.query("SELECT email, sheet_type_description, start_time FROM t_secom_schedule WHERE date = ?", [targetDate]);
    const emailToSchedules = new Map();
    scheduleRows.forEach(s => {
      const email = s.email.toLowerCase();
      const id = email.split('@')[0].split('.')[0];
      if (!emailToSchedules.has(email)) emailToSchedules.set(email, []);
      emailToSchedules.get(email).push(s);
      if (id && !emailToSchedules.has(id)) emailToSchedules.set(id, emailToSchedules.get(email));
    });
    const [bridgeRows] = await pool.query("SELECT Name, Email, Sabun FROM t_secom_person WHERE Email IS NOT NULL AND Email != ''");
    const nameToEmail = new Map();
    const sabunToEmail = new Map();
    bridgeRows.forEach(p => {
      const email = p.Email.toLowerCase();
      nameToEmail.set(p.Name.trim(), email);
      if (p.Sabun) sabunToEmail.set(p.Sabun.trim(), email);
    });

    const exclusionKeywords = ['휴가', '반차', '공가', '병가', '경조', '검진', '공휴일', '휴원', '조퇴', '결근', '회의', '업무'];

    for (const refTime of testTimes) {
      console.log(`\n\n--- [시뮬레이션] 기준 시각: ${refTime} ---`);
      
      const results = rosterRows.map(r => {
        const email = sabunToEmail.get(r.Sabun?.trim()) || nameToEmail.get(r.Name?.trim());
        const schedules = email ? (emailToSchedules.get(email) || emailToSchedules.get(email.split('@')[0].split('.')[0])) : null;
        
        // Find virtual work record
        const work = virtualWork.find(v => r.Name.includes(v.key));
        
        let checkInHhMm = null;
        if (work && work.WSTime && work.WSTime.length >= 12) {
          const hhmm = `${work.WSTime.substring(8, 10)}:${work.WSTime.substring(10, 12)}`;
          // Only recognize check-in if it happened before the reference time
          if (hhmm <= refTime) checkInHhMm = hhmm;
        }

        let status = "-";
        if (checkInHhMm) {
          status = (work && Number(work.bLate) === 1) ? "지각" : "출근";
        }

        if (schedules) {
          const desc = schedules.map(s => s.sheet_type_description).join(", ");
          const startTime = schedules.find(s => s.start_time)?.start_time || null;
          const isExcluded = exclusionKeywords.some(k => desc.includes(k));
          if (desc.includes("-") || isExcluded) {
            if (status === "-") status = isExcluded ? "휴가" : "-";
          } else if (status === "-") {
            status = (startTime && refTime > startTime) ? "미출근" : "출근 전";
          }
        }
        return { ...r, status, checkIn: checkInHhMm };
      });

      // Verification
      const targetKeys = ['Laika', 'Tombo', 'Sina', 'Alice'];
      targetKeys.forEach(key => {
        const u = results.find(r => r.Name.includes(key));
        if (u) {
          console.log(`- ${u.Name}: Status=[${u.status}], CheckIn=[${u.checkIn || '아직 안 찍음'}]`);
        }
      });
      
      const missingCount = results.filter(u => u.status === "미출근").length;
      console.log(`전체 미출근자 수: ${missingCount}명`);
    }

  } catch (err) {
    console.error('Monday simulation failed:', err.message);
  } finally {
    process.exit();
  }
}

main();
