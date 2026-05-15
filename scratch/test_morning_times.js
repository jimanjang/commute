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
    const todayStr = '2026-05-15';
    const dbDateParam = '20260515';
    const testTimes = ['10:00', '10:05', '10:10'];

    // Load common data
    const [rosterRows] = await bq.query({ query: "SELECT Name, Sabun, Team, WorkGroup FROM `secom-data.secom.person` WHERE WorkGroup IN ('002', '006', '007')", location: 'asia-northeast3' });
    const [workRows] = await pool.query("SELECT Name, Sabun, WSTime, bLate FROM t_secom_workhistory WHERE WorkDate = ?", [dbDateParam]);
    const workMap = new Map();
    workRows.forEach(w => {
      if (w.Sabun) workMap.set(w.Sabun.trim(), w);
      workMap.set(w.Name.trim(), w);
    });
    const [scheduleRows] = await pool.query("SELECT email, sheet_type_description, start_time FROM t_secom_schedule WHERE date = ?", [todayStr]);
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
      console.log(`\n\n>>> Testing for Ref Time: ${refTime} <<<`);
      
      const results = rosterRows.map(r => {
        const work = workMap.get(r.Sabun?.trim()) || workMap.get(r.Name?.trim());
        const email = sabunToEmail.get(r.Sabun?.trim()) || nameToEmail.get(r.Name?.trim());
        const schedules = email ? (emailToSchedules.get(email) || emailToSchedules.get(email.split('@')[0].split('.')[0])) : null;
        
        let checkInHhMm = null;
        if (work && work.WSTime && work.WSTime.length >= 12) {
          checkInHhMm = `${work.WSTime.substring(8, 10)}:${work.WSTime.substring(10, 12)}`;
        }

        let status = "-";
        if (checkInHhMm && checkInHhMm <= refTime) {
          status = Number(work.bLate) === 1 ? "지각" : "출근";
        }

        if (schedules) {
          const desc = schedules.map(s => s.sheet_type_description).join(", ");
          const startTime = schedules.find(s => s.start_time)?.start_time || null;
          const isExcluded = exclusionKeywords.some(k => desc.includes(k));
          if (desc.includes("-") || isExcluded) {
            if (status === "-") status = isExcluded ? "휴가" : "-";
          } else if (!checkInHhMm || checkInHhMm > refTime) {
            status = (startTime && refTime > startTime) ? "미출근" : "출근 전";
          }
        }
        return { ...r, status, checkIn: checkInHhMm };
      });

      const stats = {
        CheckIn: results.filter(u => u.status === "출근" || u.status === "지각").length,
        Missing: results.filter(u => u.status === "미출근" || u.status === "지각").length,
        BeforeWork: results.filter(u => u.status === "출근 전").length,
        Vacation: results.filter(u => u.status === "휴가").length
      };

      console.log(`Stats: ${JSON.stringify(stats)}`);
      
      const tombo = results.find(u => u.Name.includes('Tombo'));
      const laika = results.find(u => u.Name.includes('Laika'));
      console.log(`  - Tombo: Status=${tombo?.status}`);
      console.log(`  - Laika: Status=${laika?.status} (${laika?.checkIn})`);
      
      const missingSamples = results.filter(u => u.status === "미출근").map(u => u.Name);
      console.log(`  - Missing Samples: ${missingSamples.slice(0, 3).join(', ')}`);
    }

  } catch (err) {
    console.error('Simulation failed:', err.message);
  } finally {
    process.exit();
  }
}

main();
