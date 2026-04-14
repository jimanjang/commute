import { NextResponse } from "next/server";
import { BigQuery } from "@google-cloud/bigquery";
import path from "path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const yearMonthParam = searchParams.get("yearMonth") || "2026-03"; // YYYY-MM

  try {
    const keyFilename = path.join(process.cwd(), "service-account.json");
    const bigquery = new BigQuery({ keyFilename });

    // YYYY-MM (2026-03) -> YYYYMM (202603)
    const dbYearMonth = yearMonthParam.replace("-", "");

    const query = `
      SELECT 
        w.WorkDate,
        COUNT(DISTINCT CASE WHEN w.WSTime IS NOT NULL AND w.WSTime != '' THEN p.Name END) as checkIns,
        COUNT(DISTINCT CASE WHEN w.WCTime IS NOT NULL AND w.WCTime != '' THEN p.Name END) as checkOuts,
        SUM(CAST(w.bLate AS INT64)) as lates,
        SUM(CAST(w.bAbsent AS INT64)) as absents
      FROM 
        \`secom-data.secom.person\` p
      JOIN (
        SELECT Name, WorkDate, WSTime, WCTime, bLate, bAbsent
        FROM (
          SELECT Name, WorkDate, WSTime, WCTime, bLate, bAbsent, InsertTime, 1 as Priority 
          FROM \`secom-data.secom.workhistory\` 
          WHERE STARTS_WITH(WorkDate, @dbYearMonth)
          
          UNION ALL
          
          SELECT Name, WorkDate, WSTime, WCTime, bLate, bAbsent, InsertTime, 2 as Priority 
          FROM \`secom-data.secom.workhistory_today\` 
          WHERE STARTS_WITH(WorkDate, @dbYearMonth)
        )
        QUALIFY ROW_NUMBER() OVER (PARTITION BY Name, WorkDate ORDER BY InsertTime DESC, Priority DESC) = 1
      ) w ON p.Name = w.Name
      WHERE 
        p.Name IS NOT NULL AND p.Name != '' AND p.Name != '미등록사용자'
        AND p.WorkGroup IN ('002', '006', '007')
      GROUP BY 
        w.WorkDate
      ORDER BY 
        w.WorkDate ASC
    `;

    const options = {
      query: query,
      params: { dbYearMonth },
    };

    const [bqRows] = await bigquery.query(options);

    // 2. MySQL Overlay (Immediately reflect changes and catch missing days)
    const dailyMap = new Map();
    
    // Initialize with BigQuery Data
    bqRows.forEach((row: any) => {
      dailyMap.set(row.WorkDate, {
        checkIns: Number(row.checkIns || 0),
        checkOuts: Number(row.checkOuts || 0),
        lates: Number(row.lates || 0),
        absents: Number(row.absents || 0)
      });
    });

    try {
      const pool = (await import("@/lib/mysql")).default;
      const [mysqlRows]: any = await pool.query(
        `SELECT 
           WorkDate, 
           COUNT(DISTINCT CASE WHEN WSTime IS NOT NULL AND WSTime != '' THEN Name END) as checkIns,
           COUNT(DISTINCT CASE WHEN WCTime IS NOT NULL AND WCTime != '' THEN Name END) as checkOuts,
           SUM(CASE WHEN bLate = '1' OR bLate = 1 THEN 1 ELSE 0 END) as lates,
           SUM(CASE WHEN bAbsent = '1' OR bAbsent = 1 THEN 1 ELSE 0 END) as absents
         FROM t_secom_workhistory 
         WHERE WorkDate LIKE ?
         GROUP BY WorkDate`,
        [`${dbYearMonth}%`]
      );

      if (mysqlRows && mysqlRows.length > 0) {
        for (const mr of mysqlRows) {
          const wd = mr.WorkDate;
          const existing = dailyMap.get(wd) || { checkIns: 0, checkOuts: 0, lates: 0, absents: 0 };
          
          // Use MAX to ensure we don't lose data, or just overwrite if MySQL is more trustworthy for recent days
          dailyMap.set(wd, {
            checkIns: Math.max(existing.checkIns, Number(mr.checkIns || 0)),
            checkOuts: Math.max(existing.checkOuts, Number(mr.checkOuts || 0)),
            lates: Math.max(existing.lates, Number(mr.lates || 0)),
            absents: Math.max(existing.absents, Number(mr.absents || 0))
          });
        }
      }
    } catch (mysqlErr) {
      console.warn("[Calendar API] MySQL overlay failed:", mysqlErr);
    }

    // 3. Format result
    const result = Array.from(dailyMap.entries())
      .map(([wd, val]) => {
        const formattedWorkDate = wd.length === 8 ? `${wd.substring(0,4)}-${wd.substring(4,6)}-${wd.substring(6,8)}` : wd;
        return {
          date: formattedWorkDate,
          ...val
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(result);


  } catch (error) {
    console.warn("BigQuery Fetch Failed, returning mock data. Error details:", error);
    
    // Fallback Mock Data
    const data = [];
    const year = parseInt(yearMonthParam.substring(0, 4));
    const month = parseInt(yearMonthParam.substring(5, 7));
    
    for (let i = 1; i <= 31; i++) {
      const dateObj = new Date(year, month - 1, i);
      if (dateObj.getMonth() !== month - 1) break;
      
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
      if (!isWeekend) {
        data.push({
          date: `${yearMonthParam}-${i.toString().padStart(2, '0')}`,
          checkIns: 120 + Math.floor(Math.random() * 20),
          lates: Math.floor(Math.random() * 5),
          absents: Math.floor(Math.random() * 3)
        });
      }
    }
    return NextResponse.json(data);
  }
}
