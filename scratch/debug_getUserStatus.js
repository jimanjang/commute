const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: '172.17.3.206',
    user: 'secom',
    password: 'secom123',
    database: 'secom'
  });

  try {
    const todayStr = "2026-05-18";
    const refHhMm = "12:35";

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

    const user = { name: 'Heather(헤더)', sabun: 'KS2512012', bLate: undefined };
    const checkIn = '20260518122106';

    const email = sabunToEmail.get(user.sabun?.trim()) || nameToEmail.get(user.name?.trim());
    console.log("Email:", email);

    let effectiveCheckIn = null;
    if (checkIn && checkIn.trim() !== "" && checkIn.trim() !== "0") {
      let hhmm = "";
      if (checkIn.length >= 12) {
        hhmm = `${checkIn.substring(8, 10)}:${checkIn.substring(10, 12)}`;
      } else if (checkIn.length >= 4) {
        hhmm = `${checkIn.substring(0, 2)}:${checkIn.substring(2, 4)}`;
      }
      console.log("Parsed hhmm:", hhmm);
      if (hhmm !== "" && hhmm <= refHhMm) effectiveCheckIn = hhmm;
      console.log("effectiveCheckIn:", effectiveCheckIn);
    }

    let status = "-"; 
    if (effectiveCheckIn) {
      let isLate = false;
      if (user.bLate !== undefined && user.bLate !== null) {
        isLate = Number(user.bLate) === 1;
      } else if (email) {
        const idPart = email.split('@')[0].split('.')[0];
        const schedules = emailToSchedules.get(email) || emailToSchedules.get(idPart);
        console.log("Schedules found:", schedules);
        if (schedules) {
          const startTime = schedules.find((s) => s.start_time)?.start_time || null;
          console.log("startTime:", startTime);
          if (startTime && effectiveCheckIn > startTime) {
            isLate = true;
          }
        }
      }
      status = isLate ? "지각" : "출근";
      console.log("Status after effectiveCheckIn check:", status);
    }

    if (email) {
      const idPart = email.split('@')[0].split('.')[0];
      const schedules = emailToSchedules.get(email) || emailToSchedules.get(idPart);
      if (schedules) {
        const desc = schedules.map((s) => s.sheet_type_description).join(", ");
        const startTime = schedules.find((s) => s.start_time)?.start_time || null;
        const exclusionKeywords = ['휴가', '반차', '공가', '병가', '경조', '검진', '공휴일', '휴원', '조퇴', '결근', '회의', '업무'];
        const isExcluded = exclusionKeywords.some(k => desc.includes(k));
        console.log("desc:", desc, "isExcluded:", isExcluded);
        if (desc.includes("-") || isExcluded) {
          if (status === "-") status = isExcluded ? "휴가" : "-";
        } else if (!effectiveCheckIn) {
          status = (startTime && refHhMm > startTime) ? "미출근" : "출근 전";
        }
      }
    }

    console.log("Final status:", status);

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

main();
