import { NextResponse } from "next/server";
import pool from "@/lib/mysql";
import { getTodayStr } from "@/lib/time";

export async function GET() {
  try {
    const today = getTodayStr();
    
    // 1. Today's overall stats
    const [statsRows]: any = await pool.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
        SUM(CASE WHEN status = 'failure' THEN 1 ELSE 0 END) as failure
      FROM t_secom_trigger_log 
      WHERE DATE(created_at) = ?`,
      [today]
    );

    // 2. Stats by trigger type
    const [typeRows]: any = await pool.query(
      `SELECT 
        notify_type,
        COUNT(*) as count
      FROM t_secom_trigger_log 
      WHERE DATE(created_at) = ?
      GROUP BY notify_type`,
      [today]
    );

    // 3. Hourly stats for trend
    const [hourlyRows]: any = await pool.query(
      `SELECT 
        HOUR(created_at) as hour,
        COUNT(*) as count
      FROM t_secom_trigger_log 
      WHERE DATE(created_at) = ?
      GROUP BY HOUR(created_at)
      ORDER BY hour`,
      [today]
    );

    return NextResponse.json({
      today: statsRows[0] || { total: 0, success: 0, failure: 0 },
      byType: typeRows,
      hourly: hourlyRows
    });

  } catch (error: any) {
    console.error("Failed to fetch notification stats:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
