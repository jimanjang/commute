import { NextResponse } from "next/server";
import { getBigQueryClient } from "@/lib/bigquery-oauth";
import pool from "@/lib/mysql";
import { getKstDate, getTodayStr } from "@/lib/time";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const yearMonthParam = searchParams.get("yearMonth"); // YYYY-MM
    if (!yearMonthParam) return NextResponse.json({ error: "yearMonth is required" }, { status: 400 });

    const dbYearMonth = yearMonthParam.replace(/-/g, '');
    const bigquery = await getBigQueryClient();
    const todayStr = getTodayStr();
    const nowKst = getKstDate();
    const currentHhMm = `${String(nowKst.getHours()).padStart(2, '0')}:${String(nowKst.getMinutes()).padStart(2, '0')}`;

    // 1. Get the Primary Roster (WorkGroup 002, 006, 007)
    const rosterQuery = `
      SELECT Name FROM \`secom-data.secom.person\` 
      WHERE WorkGroup IN ('002', '006', '007') 
        AND Name IS NOT NULL AND Name != '' AND Name != '미등록사용자'
    `;
    const [rosterRows] = await bigquery.query({ query: rosterQuery, location: 'asia-northeast3' });
    const rosterNames = rosterRows.map((r: any) => r.Name);
    const rosterNamesQuoted = rosterNames.map((n: any) => `'${n.replace(/'/g, "\\'")}'`).join(',');

    if (rosterNames.length === 0) return NextResponse.json([]);

    // 2. Fetch Detailed Work History
    const historyQuery = `
      SELECT Name, WorkDate, WSTime, bLate
      FROM (
        SELECT Name, WorkDate, WSTime, bLate, ROW_NUMBER() OVER (PARTITION BY Name, WorkDate ORDER BY InsertTime DESC, Priority DESC) as rn
        FROM (
          SELECT Name, WorkDate, WSTime, bLate, InsertTime, 1 as Priority FROM \`secom-data.secom.workhistory\` 
          WHERE STARTS_WITH(WorkDate, @dbYearMonth) AND Name IN (${rosterNamesQuoted})
          UNION ALL
          SELECT Name, WorkDate, WSTime, bLate, InsertTime, 2 as Priority FROM \`secom-data.secom.workhistory_today\` 
          WHERE STARTS_WITH(WorkDate, @dbYearMonth) AND Name IN (${rosterNamesQuoted})
        )
      ) WHERE rn = 1
    `;
    const [historyRows] = await bigquery.query({ query: historyQuery, params: { dbYearMonth }, location: 'asia-northeast3' });
    const historyMap = new Map();
    historyRows.forEach((h: any) => historyMap.set(`${h.Name}|${h.WorkDate}`, h));

    // 3. Bridge (Name -> Email)
    const [personRows]: any = await pool.query("SELECT Name, Email FROM t_secom_person WHERE Email IS NOT NULL AND Email != ''");
    const nameToEmail = new Map();
    personRows.forEach((p: any) => nameToEmail.set(p.Name, p.Email.toLowerCase()));

    // 4. Fetch Schedules for the month
    const [scheduleRows]: any = await pool.query(
      "SELECT email, date, sheet_type_description, start_time FROM t_secom_schedule WHERE date LIKE ?",
      [`${yearMonthParam}%`]
    );
    
    // key: Email|Date -> schedule objects[]
    const scheduleMap = new Map();
    scheduleRows.forEach((s: any) => {
      const dateStr = typeof s.date === 'string' ? s.date : s.date.toISOString().split('T')[0];
      const key = `${s.email.toLowerCase()}|${dateStr}`;
      if (!scheduleMap.has(key)) scheduleMap.set(key, []);
      scheduleMap.get(key).push({ ...s, dateStr });
    });

    // 5. Aggregate Daily Stats
    const daysInMonth = new Date(Number(yearMonthParam.split('-')[0]), Number(yearMonthParam.split('-')[1]), 0).getDate();
    const result: any[] = [];

    const exclusionKeywords = ['휴가', '반차', '공가', '병가', '경조', '검진', '공휴일', '휴원', '조퇴', '결근', '회의', '업무', '보정시간', '휴가 발생'];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${yearMonthParam}-${String(day).padStart(2, '0')}`;
      const dbDateStr = dateStr.replace(/-/g, '');
      const isToday = dateStr === todayStr;
      const isFuture = dateStr > todayStr;

      let stats = {
        date: dateStr,
        target: rosterNames.length, // ALWAYS Total Roster Size as per "구성원 현황" request
        checkIns: 0,
        lates: 0,
        missing: 0,
        beforeWork: 0,
        off: 0,
        vacation: 0
      };

      // Calculate categories
      rosterNames.forEach(name => {
        const email = nameToEmail.get(name);
        const history = historyMap.get(`${name}|${dbDateStr}`);
        const schedules = email ? scheduleMap.get(`${email}|${dateStr}`) : null;

        let status = "-"; 
        if (history?.WSTime) {
          status = Number(history.bLate) === 1 ? "지각" : "출근";
        }

        if (schedules) {
          const desc = schedules.map((s: any) => s.sheet_type_description).join(", ");
          const startTime = schedules.find((s: any) => s.start_time)?.start_time || null;

          if (desc.includes("-")) {
            if (status === "-") status = "휴무";
          } else if (exclusionKeywords.some(k => desc.includes(k))) {
            if (status === "-") {
              if (['회의', '업무'].some(k => desc.includes(k))) status = "휴가"; 
              else if (['휴가', '반차', '공가', '병가', '경조', '검진', '공휴일', '휴원', '조퇴', '결근'].some(k => desc.includes(k))) status = "휴가";
              else status = "-";
            }
          } else {
            // Work day
            if (!history?.WSTime) {
              if (isFuture) {
                status = "출근 전";
              } else if (isToday) {
                status = (startTime && currentHhMm > startTime) ? "미출근" : "출근 전";
              } else {
                status = "미출근";
              }
            }
          }
        }

        if (status === "출근") { stats.checkIns++; }
        else if (status === "지각") { stats.checkIns++; stats.lates++; }
        else if (status === "미출근") { stats.missing++; }
        else if (status === "출근 전") { stats.beforeWork++; }
        else if (status === "휴가") { stats.vacation++; }
        else if (status === "휴무" || status === "-") { stats.off++; }
      });

      result.push(stats);
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error("[Calendar API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch calendar data" }, { status: 500 });
  }
}
