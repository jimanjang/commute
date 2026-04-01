import { NextResponse } from "next/server";
import pool from "@/lib/mysql";

export async function PATCH(request: Request) {
  try {
    const { name, date, startTime, endTime } = await request.json();

    if (!name || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. MySQL에서 해당 구성원의 해당 날짜 최신 기록 조회
    // 2. WSTime, WCTime 업데이트
    // Note: WSTime/WCTime format is 'HH:MM:SS' or 'YYYYMMDDHHMMSS' (Sync script uses astype(str))
    // Typically MySQL stores them as 'HH:MM:SS' or strings.
    
    const date8 = date.replace(/-/g, "");
    const formattedStartTime = startTime ? date8 + startTime.replace(":", "") + "00" : null;
    const formattedEndTime = endTime ? date8 + endTime.replace(":", "") + "00" : null;

    const query = `
      UPDATE t_secom_workhistory 
      SET 
        WSTime = COALESCE(?, WSTime), 
        WCTime = COALESCE(?, WCTime),
        ModifyUser = 'ADMIN_WEB',
        ModifyTime = ?
      WHERE Name = ? AND WorkDate = ?
      ORDER BY InsertTime DESC
      LIMIT 1
    `;

    const nowStr = new Date().toLocaleString("sv-SE").replace(/[- :]/g, "").slice(0, 14);

    const [result]: any = await pool.query(query, [
      formattedStartTime, 
      formattedEndTime, 
      nowStr,
      name, 
      date.replace(/-/g, "")
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Failed to update attendance in MySQL:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
