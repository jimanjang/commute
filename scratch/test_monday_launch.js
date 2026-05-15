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
    const testCases = [
      { time: '10:10', label: '오전 1차 체크 (Tombo 출근, Laika 미출근 상태)' },
      { time: '16:30', label: '오후 최종 체크 (Sina, Alice 출근 완료 상태)' }
    ];

    // Virtual Check-in Data
    const virtualWork = new Map([
      ['Laika(라이카)', { WSTime: '20260518101300', bLate: 1 }],
      ['Tombo(톰보)', { WSTime: '20260518100500', bLate: 1 }],
      ['Sina(시나)', { WSTime: '20260518150000', bLate: 0 }],
      ['Alice Jeon(엘리스)', { WSTime: '20260518161000', bLate: 1 }]
    ]);

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

    for (const test of testCases) {
      console.log(`\n\n--- [${test.label}] 기준 시각: ${test.time} ---`);
      
      const results = rosterRows.map(r => {
        const email = sabunToEmail.get(r.Sabun?.trim()) || nameToEmail.get(r.Name?.trim());
        const schedules = email ? (emailToSchedules.get(email) || emailToSchedules.get(email.split('@')[0].split('.')[0])) : null;
        
        // Use virtual work if exists, otherwise assume no check-in
        const work = virtualWork.get(r.Name.trim());
        
        let checkInHhMm = null;
        if (work && work.WSTime && work.WSTime.length >= 12) {
          checkInHhMm = `${work.WSTime.substring(8, 10)}:${work.WSTime.substring(10, 12)}`;
        }

        let status = "-";
        // ONLY count as Check-in if it happened BEFORE or AT the ref time
        if (checkInHhMm && checkInHhMm <= test.time) {
          status = Number(work.bLate) === 1 ? "지각" : "출근";
        }

        if (schedules) {
          const desc = schedules.map(s => s.sheet_type_description).join(", ");
          const startTime = schedules.find(s => s.start_time)?.start_time || null;
          const isExcluded = exclusionKeywords.some(k => desc.includes(k));
          if (desc.includes("-") || isExcluded) {
            if (status === "-") status = isExcluded ? "휴가" : "-";
          } else if (status === "-") {
            status = (startTime && test.time > startTime) ? "미출근" : "출근 전";
          }
        }
        return { ...r, status, checkIn: checkInHhMm };
      });

      // Verification
      const targetNames = ['Laika', 'Tombo', 'Sina', 'Alice'];
      targetNames.forEach(tn => {
        const u = results.find(r => r.Name.includes(tn));
        if (u) {
          console.log(`- ${u.Name}: Status=[${u.status}], CheckIn=[${u.checkIn || 'No'}]`);
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
