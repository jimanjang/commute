import { NextResponse } from "next/server";
import { BigQuery } from "@google-cloud/bigquery";
import path from "path";
import { getKstDate, getTodayStr } from "@/lib/time";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const dbDateParam = dateParam ? dateParam.replace(/-/g, '') : null;
    const isTargetToday = !dateParam || dateParam === getTodayStr();

    const bigquery = await (await import("@/lib/bigquery-oauth")).getBigQueryClient();
    const pool = (await import("@/lib/mysql")).default;

    // 1. Get Primary Roster and Fingerprint Records (KR Location)
    const bqQuery = `
      SELECT 
        p.Name as name, p.Sabun as sabun, p.Department as department, p.Team as team, p.Part as part, 
        p.WorkGroup as workGroup, p.WorkStatus as workStatus, p.JoiningDate as joiningDate,
        w.WSTime as checkIn, w.WCTime as checkOut, w.bLate, w.bAbsent, w.ModifyUser
      FROM \`secom-data.secom.person\` p
      LEFT JOIN (
         SELECT Name, WSTime, WCTime, bLate, bAbsent, ModifyUser, InsertTime,
                ROW_NUMBER() OVER (PARTITION BY Name ORDER BY InsertTime DESC) as rn
         FROM (
           SELECT Name, WSTime, WCTime, bLate, bAbsent, ModifyUser, InsertTime FROM \`secom-data.secom.workhistory\` WHERE WorkDate = '${dbDateParam || getTodayStr().replace(/-/g, '')}'
           UNION ALL
           SELECT Name, WSTime, WCTime, bLate, bAbsent, ModifyUser, InsertTime FROM \`secom-data.secom.workhistory_today\` WHERE WorkDate = '${dbDateParam || getTodayStr().replace(/-/g, '')}'
         )
      ) w ON p.Name = w.Name AND w.rn = 1
      WHERE p.Name IS NOT NULL AND p.Name != '' AND p.Name != '미등록사용자'
        AND p.WorkGroup IN ('002', '006', '007')
      ORDER BY p.Name ASC
    `;
    const [bqRows] = await bigquery.query({ 
      query: bqQuery,
      location: 'asia-northeast3'
    });

    // 2. Get Bridge (Name -> Email) from MySQL
    const [personRows]: any = await pool.query("SELECT Name, Email FROM t_secom_person WHERE Email IS NOT NULL AND Email != ''");
    const nameToEmail = new Map();
    personRows.forEach((p: any) => nameToEmail.set(p.Name, p.Email.toLowerCase()));

    // 3. Get Schedules from MySQL
    const targetDateStr = dateParam || getTodayStr();
    const [scheduleRows]: any = await pool.query("SELECT email, sheet_type_description, start_time, end_time FROM t_secom_schedule WHERE date = ?", [targetDateStr]);
    const emailToSchedule = new Map();
    scheduleRows.forEach((s: any) => {
      const email = s.email.toLowerCase();
      const id = email.split('@')[0].split('.')[0];

      if (!emailToSchedule.has(email)) emailToSchedule.set(email, []);
      emailToSchedule.get(email).push(s);

      if (id && !emailToSchedule.has(id)) emailToSchedule.set(id, emailToSchedule.get(email));
    });
    
    // Get Current Time for "Late" check
    const nowKst = getKstDate();
    const currentHhMm = `${String(nowKst.getHours()).padStart(2, '0')}:${String(nowKst.getMinutes()).padStart(2, '0')}`;

    // 4. Merge All
    const users = bqRows.map((r: any) => {
      const email = nameToEmail.get(r.name);
      const mysqlId = email ? email.split('@')[0] : null;
      const schedules = email ? (emailToSchedule.get(email) || emailToSchedule.get(mysqlId)) : null;
      
      let status = "-"; 
      if (r.checkIn) status = Number(r.bLate) === 1 ? "지각" : "출근";
      
      let scheduleDesc = "";
      let startTime = null;
      let endTime = null;

      if (schedules) {
        scheduleDesc = schedules.map((s: any) => s.sheet_type_description).join(", ");
        startTime = schedules.find((s: any) => s.start_time)?.start_time || null;
        endTime = schedules.find((s: any) => s.end_time)?.end_time || null;

        const isExcluded = ['휴가', '반차', '공가', '병가', '경조', '검진', '공휴일', '휴원', '조퇴', '결근', '회의', '업무'].some(k => scheduleDesc.includes(k));

        if (scheduleDesc.includes("-") || isExcluded) {
          if (status === "-") {
            status = isExcluded ? "휴가" : "-"; // Mark as Vacation if it's meeting/work but no check-in? 
            // Actually, if it's excluded from Target, it should behave like Vacation or Off.
            if (['회의', '업무'].some(k => scheduleDesc.includes(k))) status = "휴가"; 
            else if (['휴가', '반차', '공가', '병가', '경조', '검진', '공휴일', '휴원', '조퇴', '결근'].some(k => scheduleDesc.includes(k))) status = "휴가";
            else status = "-";
          }
        } else {
          // Work day (strictly '근무일' or similar)
          if (!r.checkIn) {
            if (isTargetToday && startTime && currentHhMm > startTime) {
              status = "미출근"; 
            } else {
              status = "출근 전"; 
            }
          }
        }
      }

      const formatTime = (t: string | null) => {
        if (!t) return null;
        if (t.length >= 14) return `${t.substring(8,10)}:${t.substring(10,12)}`;
        if (t.length >= 5) return t.substring(0,5);
        return t;
      };

      const displayName = r.name.replace(/^당근_/, '');

      return {
        ...r,
        name: r.name,
        displayName,
        email,
        checkIn: formatTime(r.checkIn),
        checkOut: formatTime(r.checkOut),
        status,
        startTime,
        endTime,
        isModified: !!r.ModifyUser,
        scheduleDescription: scheduleDesc
      };
    });

    const stats = {
      todayTarget: users.filter(u => u.status !== "휴가" && u.status !== "-").length,
      todayCheckIn: users.filter(u => u.status === "출근" || u.status === "지각").length,
      lateMissing: users.filter(u => u.status === "지각" || u.status === "미출근").length,
      beforeWorkCount: users.filter(u => u.status === "출근 전").length,
      offCount: users.filter(u => u.status === "-").length,
      vacationCount: users.filter(u => u.status === "휴가").length
    };

    return NextResponse.json({ users, stats });

  } catch (error) {
    console.error("[Users API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
