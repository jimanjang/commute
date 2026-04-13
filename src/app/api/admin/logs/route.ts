import { NextResponse } from "next/server";
import pool from "@/lib/mysql";
import { BigQuery } from "@google-cloud/bigquery";
import path from "path";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name") || "";
    
    // 1. Fetch modification logs from MySQL
    let query = `
      SELECT 
        Name, Sabun, WorkDate, WSTime, WCTime, PrevWSTime, PrevWCTime, ModifyTime, ModifyUser, Department, Team, ModifyReason
      FROM t_secom_workhistory 
      WHERE ModifyUser IS NOT NULL AND ModifyUser != '-1' AND ModifyUser != ''
    `;
    const params: any[] = [];

    if (name) {
      query += ` AND (Name LIKE ? OR Sabun LIKE ?) `;
      params.push(`%${name}%`, `%${name}%`);
    }

    query += ` ORDER BY ModifyTime DESC LIMIT 100`;

    const [mysqlRows]: any = await pool.query(query, params);

    if (mysqlRows.length === 0) {
      return NextResponse.json([]);
    }

    // 2. Batch check sync status with BigQuery
    let bqDataMap = new Set();
    try {
      const keyFilename = path.join(process.cwd(), "service-account.json");
      const bigquery = new BigQuery({ keyFilename });

      // Extract unique (Name, WorkDate) for filtering to minimize BQ scanned data
      const names = Array.from(new Set(mysqlRows.map((r: any) => r.Name)));
      const dates = Array.from(new Set(mysqlRows.map((r: any) => r.WorkDate)));

      const bqQuery = `
        SELECT Name, WorkDate, WSTime, WCTime
        FROM (
          SELECT Name, WorkDate, WSTime, WCTime, ModifyUser FROM \`secom-data.secom.workhistory\`
          UNION ALL
          SELECT Name, WorkDate, WSTime, WCTime, ModifyUser FROM \`secom-data.secom.workhistory_today\`
        )
        WHERE 
          Name IN UNNEST(@names) AND 
          WorkDate IN UNNEST(@dates) AND
          ModifyUser IS NOT NULL AND ModifyUser != '-1' AND ModifyUser != ''
      `;


      const [bqRows] = await bigquery.query({
        query: bqQuery,
        params: { names, dates }
      });

      // Create a lookup key to check if MySQL record exists in BQ
      bqRows.forEach((row: any) => {
        const key = `${row.Name}|${row.WorkDate}|${row.WSTime}|${row.WCTime}`;
        bqDataMap.add(key);
      });
    } catch (bqErr) {
      console.warn("BigQuery sync check failed:", bqErr);
      // We'll continue without sync status if BQ fails
    }

    // 3. Format and attach sync status
    const formattedRows = mysqlRows.map((row: any) => {
      const wd = row.WorkDate?.toString() || "";
      const formattedDate = wd.length === 8 ? `${wd.substring(0,4)}-${wd.substring(4,6)}-${wd.substring(6,8)}` : wd;

      const formatHHMM = (t: any) => {
        if (!t) return "-";
        const ts = t.toString();
        if (ts.length >= 12) return `${ts.substring(8,10)}:${ts.substring(10,12)}`;
        if (ts.length === 6) return `${ts.substring(0,2)}:${ts.substring(2,4)}`;
        return ts;
      };

      let displayModifyTime = row.ModifyTime;
      if (typeof row.ModifyTime === 'string' && row.ModifyTime.length === 14) {
        displayModifyTime = `${row.ModifyTime.substring(0,4)}-${row.ModifyTime.substring(4,6)}-${row.ModifyTime.substring(6,8)} ${row.ModifyTime.substring(8,10)}:${row.ModifyTime.substring(10,12)}`;
      }

      // Check if this specific modification exists in BigQuery
      const lookupKey = `${row.Name}|${row.WorkDate}|${row.WSTime}|${row.WCTime}`;
      const isSynced = bqDataMap.has(lookupKey);

      return {
        ...row,
        WorkDate: formattedDate,
        WSTime: formatHHMM(row.WSTime),
        WCTime: formatHHMM(row.WCTime),
        PrevWSTime: formatHHMM(row.PrevWSTime),
        PrevWCTime: formatHHMM(row.PrevWCTime),
        ModifyTime: displayModifyTime,
        isSynced: isSynced,
        ModifyReason: row.ModifyReason || ""

      };

    });

    return NextResponse.json(formattedRows);
  } catch (error) {
    console.error("Failed to fetch audit logs with sync status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
