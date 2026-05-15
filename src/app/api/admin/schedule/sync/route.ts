import { NextResponse } from "next/server";
import pool from "@/lib/mysql";
import { getBigQueryClient } from "@/lib/bigquery-oauth";
import { getTodayStr, getKstDate } from "@/lib/time";

export async function GET(request: Request) {
  try {
    const bigquery = await getBigQueryClient();
    
    // Broaden search to cover the requested range (from 2026-04-01 onwards)
    const bqQuery = `
      SELECT 
        ts.date, 
        u.email, 
        ts.sheet_type, 
        tssti.description as sheet_type_description,
        COALESCE(ts.planned_work_start_time, ts.start_time) as start_time,
        COALESCE(ts.planned_work_end_time, ts.end_time) as end_time
      FROM \`karrotmarket.team_operation.vw_time_sheets_verbose\` ts
      JOIN \`karrotmarket.team_operation.vw_admin_user_info\` u ON ts.admin_user_id = u.admin_user_id
      LEFT JOIN \`karrotmarket.team_operation.utility_time_sheets_sheet_type\` tssti ON ts.sheet_type = tssti.sheet_type
      WHERE ts.date >= '2026-04-01' 
        AND ts.date <= '2026-12-31'
        AND ts.sheet_type NOT IN (3, 17)
    `;

    console.log('[Sync Schedule] Querying BigQuery (US)...');
    const [rows] = await bigquery.query({ 
      query: bqQuery,
      location: 'US'
    });
    console.log(`[Sync Schedule] Found ${rows.length} leave/schedule records.`);

    // 2. Sync to MySQL
    if (rows.length > 0) {
      // Clear existing records to avoid duplicates
      await pool.query("DELETE FROM t_secom_schedule WHERE date >= '2026-04-01'");

      // Insert new records in chunks if necessary, but 6k is fine for one go
      const values = rows.map((r: any) => [
        r.email?.toLowerCase() || "", 
        r.date.value, 
        r.sheet_type, 
        r.sheet_type_description, 
        r.start_time, 
        r.end_time
      ]);
      
      // Split into chunks of 1000 to be safe
      for (let i = 0; i < values.length; i += 1000) {
        const chunk = values.slice(i, i + 1000);
        await pool.query(
          "INSERT INTO t_secom_schedule (email, date, sheet_type, sheet_type_description, start_time, end_time) VALUES ?",
          [chunk]
        );
      }
    }

    return NextResponse.json({
      success: true,
      count: rows.length,
      synced_at: new Date().toISOString()
    });

  } catch (err: any) {
    console.error("[Sync Schedule] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
