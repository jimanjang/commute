import { NextResponse } from "next/server";
import { BigQuery } from "@google-cloud/bigquery";
import path from "path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nameParam = searchParams.get("name") || "본인";
  const currentYearMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const yearMonthParam = searchParams.get("yearMonth") || currentYearMonth; 


  try {
    const keyFilename = path.join(process.cwd(), "service-account.json");
    const bigquery = new BigQuery({ keyFilename });

    // YYYY-MM (2026-03) -> YYYYMM (202603)
    const dbYearMonth = yearMonthParam.replace("-", ""); 
    
    // User might just be "Laika", but DB has "Laika(장지만)". 
    // We search for a broad pattern to match either case.
    const searchName = nameParam.split("(")[0].trim().replace("본인", "Laika");



    const query = `
      SELECT 
        WorkDate, WorkType, CAST(bLate AS INT64) as bLate, CAST(bAbsent AS INT64) as bAbsent, 
        WSTime, WCTime, ScheduleName, ModifyUser, ModifyTime, 
        PrevWSTime, PrevWCTime,
        CAST(TotalWorkTime AS FLOAT64) as TotalWorkTime, 
        CAST(OWTime AS FLOAT64) as OWTime, CAST(NWTime AS FLOAT64) as NWTime, 
        CAST(HWTime AS FLOAT64) as HWTime, Name, Sabun
      FROM (
        SELECT 
          WorkDate, WorkType, bLate, bAbsent, WSTime, WCTime, ScheduleName, 
          ModifyUser, ModifyTime, PrevWSTime, PrevWCTime, TotalWorkTime, OWTime, NWTime, HWTime, Name, Sabun, InsertTime,
          1 as Priority 
        FROM \`secom-data.secom.workhistory\`
        UNION ALL
        SELECT 
          WorkDate, WorkType, bLate, bAbsent, WSTime, WCTime, ScheduleName, 
          ModifyUser, ModifyTime, PrevWSTime, PrevWCTime, TotalWorkTime, OWTime, NWTime, HWTime, Name, Sabun, InsertTime,
          2 as Priority 
        FROM \`secom-data.secom.workhistory_today\`
      )
      WHERE 
        Name LIKE @namePattern AND
        (REPLACE(WorkDate, '-', '') LIKE @dbYearMonthPattern)
      QUALIFY ROW_NUMBER() OVER (PARTITION BY WorkDate ORDER BY InsertTime DESC, Priority DESC) = 1
      ORDER BY 
        WorkDate ASC
    `;

    const options = {
      query: query,
      params: { 
        namePattern: `%${searchName}%`, 
        dbYearMonthPattern: `${dbYearMonth}%` 
      },
    };

    const [rows] = await bigquery.query(options);

    // Try to get fresh overrides from MySQL to immediately reflect changes
    // before BigQuery syncs them via batch processes
    let mysqlMap = new Map();
    try {
      // Import dynamically to avoid top level await/pool issues if this is purely a nextjs API
      const pool = (await import("@/lib/mysql")).default;
      const [mysqlRows]: any = await pool.query(
        "SELECT WorkDate, WSTime, WCTime, PrevWSTime, PrevWCTime, ModifyUser, ModifyTime, ModifyReason FROM t_secom_workhistory WHERE Name = ? AND WorkDate LIKE ?",
        [nameParam.split(" ")[0] || "Laika", `${dbYearMonth}%`]
      );

      if (mysqlRows && mysqlRows.length > 0) {
        for (const r of mysqlRows) {
          mysqlMap.set(r.WorkDate, r);
        }
      }
    } catch (dbErr) {
      console.warn("MySQL overlay failed:", dbErr);
    }

    // Transform Data For Frontend (Formatting)
    const formattedRows = rows.map(row => {
      // WorkDate: "20260318" -> "2026-03-18"
      const wd = row.WorkDate ? row.WorkDate.toString() : "";
      const formattedWorkDate = wd.length === 8 ? `${wd.substring(0,4)}-${wd.substring(4,6)}-${wd.substring(6,8)}` : "";
      
      // Override with MySQL data if it exists (meaning the record was modified but BigQuery sync hasn't run yet)
      const freshRow = mysqlMap.get(wd) || row;
      
      let wst = freshRow.WSTime ? freshRow.WSTime.toString().trim() : "";
      if (wst.length >= 14) wst = `${wst.substring(8,10)}:${wst.substring(10,12)}:${wst.substring(12,14)}`;
      else if (wst.length === 6) wst = `${wst.substring(0,2)}:${wst.substring(2,4)}:${wst.substring(4,6)}`;
      else if (wst.length === 4) wst = `${wst.substring(0,2)}:${wst.substring(2,4)}`;
      
      let wct = freshRow.WCTime ? freshRow.WCTime.toString().trim() : "";
      if (wct.length >= 14) wct = `${wct.substring(8,10)}:${wct.substring(10,12)}:${wct.substring(12,14)}`;
      else if (wct.length === 6) wct = `${wct.substring(0,2)}:${wct.substring(2,4)}:${wct.substring(4,6)}`;
      else if (wct.length === 4) wct = `${wct.substring(0,2)}:${wct.substring(2,4)}`;

      // Format previous times as well
      const formatTime = (t: any) => {
        if (!t) return "";
        const s = t.toString().trim();
        if (s.length >= 14) return `${s.substring(8,10)}:${s.substring(10,12)}`;
        if (s.length === 6) return `${s.substring(0,2)}:${s.substring(2,4)}`;
        if (s.length === 4) return `${s.substring(0,2)}:${s.substring(2,4)}`;
        return s;
      };

      const prevWst = formatTime(freshRow.PrevWSTime);
      const prevWct = formatTime(freshRow.PrevWCTime);


      // BQ Sync Check logic (Simplified for Main View)
      // Check if current row in BQ is the modified one
      const isModified = !!(freshRow.ModifyUser && freshRow.ModifyUser !== '-1' && freshRow.ModifyUser !== '');
      const isSynced = isModified ? (!!row.ModifyUser && row.ModifyUser !== '-1' && row.WSTime === freshRow.WSTime && row.WCTime === freshRow.WCTime) : true;


      return {
        ...row,
        WorkDate: formattedWorkDate,
        WSTime: wst,
        WCTime: wct,
        PrevWSTime: prevWst,
        PrevWCTime: prevWct,
        ModifyUser: freshRow.ModifyUser || row.ModifyUser,
        ModifyTime: freshRow.ModifyTime || row.ModifyTime,
        ModifyReason: freshRow.ModifyReason || row.ModifyReason || "",
        isSynced: isSynced,
        TotalWorkTime: (row.TotalWorkTime || 0) / 60, // 분 -> 시간
        OWTime: (row.OWTime || 0) / 60,
        NWTime: (row.NWTime || 0) / 60,
        HWTime: (row.HWTime || 0) / 60,
      };

    });

    return NextResponse.json(formattedRows);


  } catch (error) {
    console.error("Critical BigQuery Fetch Failure:", error);
    return NextResponse.json({ error: "BigQuery connection failed", details: error instanceof Error ? error.message : String(error) }, { status: 500 });


  }
}
