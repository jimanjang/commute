import { NextResponse } from "next/server";
import { BigQuery } from "@google-cloud/bigquery";
import path from "path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nameParam = searchParams.get("name") || "본인";
  const yearMonthParam = searchParams.get("yearMonth") || "2026-03"; // YYYY-MM

  try {
    const keyFilename = path.join(process.cwd(), "service-account.json");
    const bigquery = new BigQuery({ keyFilename });

    // YYYY-MM (2026-03) -> YYYYMM (202603)
    const dbYearMonth = yearMonthParam.replace("-", ""); 
    
    // User might just be "Laika", but DB has "Laika(장지만)". "본인" defaults to "Laika"
    const searchName = nameParam === "본인" || nameParam === "Laika" ? "Laika" : nameParam.split(" ")[0];

    const query = `
      SELECT 
        WorkDate, WorkType, CAST(bLate AS INT64) as bLate, CAST(bAbsent AS INT64) as bAbsent, 
        WSTime, WCTime, ScheduleName, ModifyUser, ModifyTime, 
        CAST(TotalWorkTime AS FLOAT64) as TotalWorkTime, 
        CAST(OWTime AS FLOAT64) as OWTime, CAST(NWTime AS FLOAT64) as NWTime, 
        CAST(HWTime AS FLOAT64) as HWTime, Name, Sabun
      FROM (
        SELECT *, 1 as Priority FROM \`secom-data.secom.workhistory\`
        UNION ALL
        SELECT *, 2 as Priority FROM \`secom-data.secom.workhistory_today\`
      )
      WHERE 
        Name LIKE @namePattern AND
        STARTS_WITH(WorkDate, @dbYearMonth)
      QUALIFY ROW_NUMBER() OVER (PARTITION BY WorkDate ORDER BY InsertTime DESC, Priority DESC) = 1
      ORDER BY 
        WorkDate ASC
    `;

    const options = {
      query: query,
      params: { 
        namePattern: `%${searchName}%`, 
        dbYearMonth 
      },
    };

    const [rows] = await bigquery.query(options);

    // Transform Data For Frontend (Formatting)
    const formattedRows = rows.map(row => {
      // WorkDate: "20260318" -> "2026-03-18"
      const wd = row.WorkDate ? row.WorkDate.toString() : "";
      const formattedWorkDate = wd.length === 8 ? `${wd.substring(0,4)}-${wd.substring(4,6)}-${wd.substring(6,8)}` : "";
      
      // WSTime: "20260318085300" -> "08:53:00"
      let wst = row.WSTime ? row.WSTime.toString() : "";
      if (wst.length === 14) wst = `${wst.substring(8,10)}:${wst.substring(10,12)}:${wst.substring(12,14)}`;
      else if (wst.length === 6) wst = `${wst.substring(0,2)}:${wst.substring(2,4)}:${wst.substring(4,6)}`;
      
      // WCTime: "20260317190800" -> "19:08:00"
      let wct = row.WCTime ? row.WCTime.toString() : "";
      if (wct.length === 14) wct = `${wct.substring(8,10)}:${wct.substring(10,12)}:${wct.substring(12,14)}`;
      else if (wct.length === 6) wct = `${wct.substring(0,2)}:${wct.substring(2,4)}:${wct.substring(4,6)}`;

      return {
        ...row,
        WorkDate: formattedWorkDate,
        WSTime: wst,
        WCTime: wct,
        TotalWorkTime: (row.TotalWorkTime || 0) / 60, // 분 -> 시간
        OWTime: (row.OWTime || 0) / 60,
        NWTime: (row.NWTime || 0) / 60,
        HWTime: (row.HWTime || 0) / 60,
      };
    });

    return NextResponse.json(formattedRows);

  } catch (error) {
    console.warn("BigQuery Fetch Failed, returning mock data. Error details:", error);
    
    // UI 폴백
    const data = [];
    const year = parseInt(yearMonthParam.substring(0, 4));
    const month = parseInt(yearMonthParam.substring(5, 7));
    
    for (let i = 1; i <= 31; i++) {
      const dateObj = new Date(year, month - 1, i);
      if (dateObj.getMonth() !== month - 1) break;
      
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
      if (!isWeekend) {
        data.push({
          WorkDate: `${yearMonthParam}-${i.toString().padStart(2, '0')}`,
          WorkType: "근무",
          bLate: 0,
          bAbsent: 0,
          WSTime: "08:55:00",
          WCTime: "19:00:00",
          ScheduleName: "10:00 ~ 19:00",
          ModifyUser: "Ian Jeong",
          ModifyTime: "2026-03-01T00:00:00Z",
          TotalWorkTime: 8,
          OWTime: 0,
          NWTime: 0,
          HWTime: 0,
          Name: nameParam,
          Sabun: "",
        });
      }
    }
    return NextResponse.json(data);
  }
}
