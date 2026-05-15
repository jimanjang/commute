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
    const targetDate = '2026-05-16'; // Tomorrow
    const refHhMm = '10:00';

    console.log(`--- Simulation Test for Tomorrow ${targetDate} (Ref Time: ${refHhMm}) ---`);

    // 1. Roster
    const [rosterRows] = await bq.query({ query: "SELECT Name, Sabun, Team FROM `secom-data.secom.person` WHERE WorkGroup IN ('002', '006', '007')", location: 'asia-northeast3' });

    // 2. Schedules for Tomorrow
    const [scheduleRows] = await pool.query("SELECT email, sheet_type_description, start_time FROM t_secom_schedule WHERE date = ?", [targetDate]);
    const emailToSchedules = new Map();
    scheduleRows.forEach(s => {
      const email = s.email.toLowerCase();
      const id = email.split('@')[0].split('.')[0];
      if (!emailToSchedules.has(email)) emailToSchedules.set(email, []);
      emailToSchedules.get(email).push(s);
      if (id && !emailToSchedules.has(id)) emailToSchedules.set(id, emailToSchedules.get(email));
    });

    // 3. Bridge
    const [bridgeRows] = await pool.query("SELECT Name, Email, Sabun FROM t_secom_person WHERE Email IS NOT NULL AND Email != ''");
    const nameToEmail = new Map();
    const sabunToEmail = new Map();
    bridgeRows.forEach(p => {
      const email = p.Email.toLowerCase();
      nameToEmail.set(p.Name.trim(), email);
      if (p.Sabun) sabunToEmail.set(p.Sabun.trim(), email);
    });

    // 4. Calculate Status (Assuming NO check-ins yet for tomorrow)
    const results = rosterRows.map(r => {
      const email = sabunToEmail.get(r.Sabun?.trim()) || nameToEmail.get(r.Name?.trim());
      const schedules = email ? (emailToSchedules.get(email) || emailToSchedules.get(email.split('@')[0].split('.')[0])) : null;
      
      let status = "-"; // Default: Not target
      if (schedules) {
        const desc = schedules.map(s => s.sheet_type_description).join(", ");
        const startTime = schedules.find(s => s.start_time)?.start_time || null;
        const isExcluded = ['휴가', '반차', '공가', '병가', '경조', '검진', '공휴일', '휴원', '조퇴', '결근', '회의', '업무'].some(k => desc.includes(k));
        
        if (desc.includes("-") || isExcluded) {
          status = isExcluded ? "휴가" : "-";
        } else {
          // It's a Work day!
          status = (startTime && refHhMm > startTime) ? "미출근" : "출근 전";
        }
      }
      return { ...r, status, schedules: schedules?.map(s => s.sheet_type_description).join(', ') };
    });

    const targets = results.filter(u => u.status !== "-" && u.status !== "휴가");
    console.log(`\nTotal People: ${results.length}`);
    console.log(`Active Targets for Tomorrow Morning: ${targets.length}`);
    targets.forEach(t => console.log(`- ${t.Name} (${t.Team}): Status=${t.status}, Schedule=${t.schedules}`));

    const vacation = results.filter(u => u.status === "휴가");
    console.log(`\nVacation/Leave for Tomorrow: ${vacation.length}`);
    vacation.slice(0, 3).forEach(v => console.log(`- ${v.Name}: ${v.schedules}`));

  } catch (err) {
    console.error('Tomorrow simulation failed:', err.message);
  } finally {
    process.exit();
  }
}

main();
