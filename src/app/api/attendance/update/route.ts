import { NextResponse } from "next/server";
import pool from "@/lib/mysql";
import { BigQuery } from "@google-cloud/bigquery";
import path from "path";

export async function PATCH(request: Request) {
  try {
    const { name, date, startTime, endTime, reason } = await request.json();

    if (!name || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const date8 = date.replace(/-/g, "");
    
    // 1. Fetch current record to preserve precise Date prefixes (for midnight crossings)
    const [existingRows]: any = await pool.query(
      "SELECT WSTime, WCTime FROM t_secom_workhistory WHERE Name = ? AND WorkDate = ? ORDER BY InsertTime DESC LIMIT 1",
      [name, date8]
    );

    function updateTimeComponent(originalTimestamp: string | null, newTimeStr: string | null, defaultDate: string) {
      if (!newTimeStr) return null; 
      const cleanTime = newTimeStr.replace(/:/g, "").padEnd(6, '0').slice(0, 6);
      
      let datePart = defaultDate;
      if (originalTimestamp && originalTimestamp.length >= 8) {
         datePart = originalTimestamp.substring(0, 8);
      }
      return datePart + cleanTime;
    }

    const rec = existingRows && existingRows.length > 0 ? existingRows[0] : { WSTime: null, WCTime: null };

    // If new time is provided, we merge it with the original date prefix (to preserve next-day checkouts!)
    // If not provided, it returns null, and COALESCE keeps the old value.
    const formattedStartTime = updateTimeComponent(rec.WSTime, startTime, date8);
    const formattedEndTime = updateTimeComponent(rec.WCTime, endTime, date8);

    // AUTO-DETECT Midnight crossing if original checkout was null (or we construct logic)
    let finalEndTime = formattedEndTime;
    if (finalEndTime && formattedStartTime && !rec.WCTime) {
       // e.g. "190000" < "080000" is false. "010000" < "080000" is true.
       if (endTime.replace(/:/g,"") < startTime.replace(/:/g,"")) {
          // It's next day!
          // Use YYYY/MM/DD to avoid timezone issues when constructing Date
          const year = parseInt(date8.substring(0,4));
          const month = parseInt(date8.substring(4,6)) - 1;
          const day = parseInt(date8.substring(6,8));
          const d = new Date(year, month, day);
          d.setDate(d.getDate() + 1);
          
          const ny = d.getFullYear();
          const nm = (d.getMonth() + 1).toString().padStart(2, '0');
          const nd = d.getDate().toString().padStart(2, '0');
          const nextDayStr = `${ny}${nm}${nd}`;
          
          finalEndTime = nextDayStr + endTime.replace(/:/g, "").padEnd(6, '0').slice(0, 6);
       }
    }

    // 1.5 Get current session for the modifier information
    const { getServerSession } = await import("next-auth/next");
    const { authOptions } = await import("@/lib/auth");
    const session = await getServerSession(authOptions);
    
    // Extract first name (e.g., "laika" from "laika jang")
    const modifierName = session?.user?.name 
      ? session.user.name.split(' ')[0] 
      : 'ADMIN_WEB';

    // 2. MySQL은 Primary Key가 있으므로 UPDATE 수행
    const nowStr = new Date().toLocaleString("sv-SE").replace(/[- :]/g, "").slice(0, 14);
    
    // 강제로 InsertTime / UpdateTime 중 하나를 현재 시간으로 만들어줘야 
    // 외부 Python Sync 스크립트가 해당 Row가 변경된 것을 인지하고 BigQuery로 다시 밀어넣을 수 있습니다!
    const updateQuery = `
      UPDATE t_secom_workhistory 
      SET 
        WSTime = COALESCE(?, WSTime), 
        WCTime = COALESCE(?, WCTime),
        PrevWSTime = ?, 
        PrevWCTime = ?,
        ModifyUser = ?,
        ModifyTime = ?,
        InsertTime = ?,
        ModifyReason = ?
      WHERE Name = ? AND WorkDate = ?


      ORDER BY InsertTime DESC
      LIMIT 1
    `;

    const [updateResult]: any = await pool.query(updateQuery, [
      formattedStartTime, 
      finalEndTime, 
      rec.WSTime, // 기존 출근 기록 백업
      rec.WCTime, // 기존 퇴근 기록 백업
      modifierName,
      nowStr,
      nowStr, // 강제로 InsertTime 최신화
      reason || null, // 수정 사유 저장
      name, 
      date8
    ]);




    if (updateResult.affectedRows === 0) {
      return NextResponse.json({ error: "Record not found in MySQL" }, { status: 404 });
    }

    // BigQuery Update 제거됨 (무료 티어 403 에러 리스크 방지용).
    // 프론트엔드 조회 API(/api/attendance)에서 MySQL 최신본을 자동 합산 표출하도록 구현됨.

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Failed to process attendance update:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
