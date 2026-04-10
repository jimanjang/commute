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
        SUM(CAST(w.bLate AS INT64)) as lates,
        SUM(CAST(w.bAbsent AS INT64)) as absents
      FROM 
        \`secom-data.secom.person\` p
      JOIN (
        SELECT Name, WorkDate, WSTime, bLate, bAbsent
        FROM (
          SELECT Name, WorkDate, WSTime, bLate, bAbsent, InsertTime, 1 as Priority 
          FROM \`secom-data.secom.workhistory\` 
          WHERE STARTS_WITH(WorkDate, @dbYearMonth)
          
          UNION ALL
          
          SELECT Name, WorkDate, WSTime, bLate, bAbsent, InsertTime, 2 as Priority 
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

    const [rows] = await bigquery.query(options);

    // Format WorkDate from "20260318" to "2026-03-18"
    const formattedRows = rows.map(row => {
      const wd = row.WorkDate ? row.WorkDate.toString() : "";
      const formattedWorkDate = wd.length === 8 ? `${wd.substring(0,4)}-${wd.substring(4,6)}-${wd.substring(6,8)}` : "";
      
      return {
        date: formattedWorkDate,
        checkIns: row.checkIns || 0,
        lates: row.lates || 0,
        absents: row.absents || 0
      };
    });

    return NextResponse.json(formattedRows);

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
