const mysql = require('mysql2/promise');
const { BigQuery } = require('@google-cloud/bigquery');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

const CLIENT_ID = '32555940559.apps.googleusercontent.com';
const CLIENT_SECRET = 'ZmssLNjJy2998hD4CTg2ejr2';

async function getBigQueryClient() {
  const tokenPath = path.join(__dirname, '..', 'token.json');
  const tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET);
  oauth2Client.setCredentials(tokens);
  return new BigQuery({
    projectId: 'karrotmarket',
    authClient: oauth2Client
  });
}

async function main() {
  const pool = mysql.createPool({
    host: '172.17.3.206',
    user: 'secom',
    password: 'secom123',
    database: 'secom'
  });

  try {
    const todayStr = "2026-05-18";
    const dbDateParam = "20260518";
    const refHhMm = "12:35";

    const bigquery = await getBigQueryClient();

    const rosterQuery = `SELECT Name as name, Sabun as sabun, Team as team, WorkGroup as workGroup FROM \`secom-data.secom.person\` WHERE Name IS NOT NULL AND Name != '' AND WorkGroup IN ('002', '006', '007')`;
    const [rosterRows] = await bigquery.query({ query: rosterQuery, location: 'asia-northeast3' });

    const [bridgeRows] = await pool.query("SELECT Name, Email, Sabun FROM t_secom_person WHERE Email IS NOT NULL AND Email != ''");
    const sabunToEmail = new Map();
    const nameToEmail = new Map();
    bridgeRows.forEach((p) => {
      const email = p.Email?.toLowerCase();
      if (p.Sabun) sabunToEmail.set(p.Sabun.trim(), email);
      nameToEmail.set(p.Name.trim(), email);
    });

    const [scheduleRows] = await pool.query("SELECT email, sheet_type_description, start_time, end_time FROM t_secom_schedule WHERE date = ?", [todayStr]);
    const emailToSchedules = new Map();
    scheduleRows.forEach((s) => {
      const email = s.email.toLowerCase();
      const idPart = email.split('@')[0].split('.')[0];
      if (!emailToSchedules.has(email)) emailToSchedules.set(email, []);
      emailToSchedules.get(email).push(s);
      if (idPart && !emailToSchedules.has(idPart)) emailToSchedules.set(idPart, emailToSchedules.get(email));
    });

    const exclusionKeywords = ['휴가', '반차', '공가', '병가', '경조', '검진', '공휴일', '휴원', '조퇴', '결근', '회의', '업무'];

    const getUserStatus = (user, checkIn) => {
      const email = sabunToEmail.get(user.sabun?.trim()) || nameToEmail.get(user.name?.trim());
      
      let effectiveCheckIn = null;
      if (checkIn && checkIn.trim() !== "" && checkIn.trim() !== "0") {
        let hhmm = "";
        if (checkIn.length >= 12) {
          hhmm = `${checkIn.substring(8, 10)}:${checkIn.substring(10, 12)}`;
        } else if (checkIn.length >= 4) {
          hhmm = `${checkIn.substring(0, 2)}:${checkIn.substring(2, 4)}`;
        }
        if (hhmm !== "" && hhmm <= refHhMm) effectiveCheckIn = hhmm;
      }

      let status = "-"; 
      if (effectiveCheckIn) {
        let isLate = false;
        if (user.bLate !== undefined && user.bLate !== null) {
          isLate = Number(user.bLate) === 1;
        } else if (email) {
          const idPart = email.split('@')[0].split('.')[0];
          const schedules = emailToSchedules.get(email) || emailToSchedules.get(idPart);
          if (schedules) {
            const startTime = schedules.find((s) => s.start_time)?.start_time || null;
            if (startTime && effectiveCheckIn > startTime) {
              isLate = true;
            }
          }
        }
        status = isLate ? "지각" : "출근";
      }

      if (email) {
        const idPart = email.split('@')[0].split('.')[0];
        const schedules = emailToSchedules.get(email) || emailToSchedules.get(idPart);
        if (schedules) {
          const desc = schedules.map((s) => s.sheet_type_description).join(", ");
          const startTime = schedules.find((s) => s.start_time)?.start_time || null;
          const isExcluded = exclusionKeywords.some(k => desc.includes(k));
          if (desc.includes("-") || isExcluded) {
            if (status === "-") status = isExcluded ? "휴가" : "-";
          } else if (!effectiveCheckIn) {
            status = (startTime && refHhMm > startTime) ? "미출근" : "출근 전";
          }
        }
      }
      return { status, email, effectiveCheckIn };
    };

    const [mysqlWorkRows] = await pool.query("SELECT Name, Sabun, WSTime, bLate FROM t_secom_workhistory WHERE WorkDate = ?", [dbDateParam]);
    const [mysqlAlarmRows] = await pool.query(
      `SELECT p.Sabun, p.Name, MIN(a.ATime) AS ATime
       FROM t_secom_alarm a
       INNER JOIN t_secom_person p ON a.CardNo = p.CardNo
       WHERE a.ATime LIKE ?
       GROUP BY p.Sabun, p.Name`,
      [`${dbDateParam}%`]
    );

    const workMap = new Map();
    mysqlWorkRows.forEach((w) => {
      if (w.Sabun) workMap.set(w.Sabun.trim(), w);
      if (w.Name) workMap.set(w.Name.trim(), w);
    });

    const alarmMap = new Map();
    mysqlAlarmRows.forEach((a) => {
      if (a.Sabun) alarmMap.set(a.Sabun.trim(), a);
      if (a.Name) alarmMap.set(a.Name.trim(), a);
    });

    const usersWithStatus = rosterRows.map((r) => {
      const work = workMap.get(r.sabun?.trim()) || workMap.get(r.name?.trim());
      const alarm = alarmMap.get(r.sabun?.trim()) || alarmMap.get(r.name?.trim());
      
      let checkInTime = null;
      let bLate = undefined;
      
      const hasOfficialCheckIn = work && work.WSTime && work.WSTime.trim() !== "" && work.WSTime.trim() !== "0";

      if (hasOfficialCheckIn) {
        checkInTime = work.WSTime;
        bLate = work.bLate;
      } else if (alarm) {
        checkInTime = alarm.ATime;
      } else if (work) {
        checkInTime = work.WSTime;
        bLate = work.bLate;
      }

      const { status, email, effectiveCheckIn } = getUserStatus({ ...r, bLate }, checkInTime);
      return { ...r, status, email, checkIn: effectiveCheckIn };
    });

    const heatherResult = usersWithStatus.find(u => u.sabun === "KS2512012");
    console.log("\n--- Heather Status Calculation Result ---");
    console.log(heatherResult);

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

main();
