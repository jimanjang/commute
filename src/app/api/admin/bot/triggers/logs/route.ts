import { NextResponse } from "next/server";
import pool from "@/lib/mysql";

export async function GET() {
  try {
    // Fetch the last 100 logs for now
    const [logs]: any = await pool.query(
      "SELECT * FROM t_secom_trigger_log ORDER BY created_at DESC LIMIT 100"
    );

    const formattedLogs = logs.map((log: any) => {
      if (log.created_at) {
        const d = new Date(log.created_at);
        d.setHours(d.getHours() - 9);
        log.created_at = d.toISOString();
      }
      return log;
    });

    return NextResponse.json(formattedLogs);
  } catch (err: any) {
    console.error("[Trigger Logs] GET Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
