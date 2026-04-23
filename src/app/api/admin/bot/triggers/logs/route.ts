import { NextResponse } from "next/server";
import pool from "@/lib/mysql";

export async function GET() {
  try {
    // Fetch the last 100 logs for now
    const [logs]: any = await pool.query(
      "SELECT * FROM t_secom_trigger_log ORDER BY created_at DESC LIMIT 100"
    );

    return NextResponse.json(logs);
  } catch (err: any) {
    console.error("[Trigger Logs] GET Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
