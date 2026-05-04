import { NextResponse } from "next/server";
import pool from "@/lib/mysql";
import { getKstDate } from "@/lib/time";

export async function GET(request: Request) {
  try {
    const kstNow = getKstDate();
    const todayStr = kstNow.toISOString().split('T')[0];
    const dbDateParam = todayStr.replace(/-/g, '');

    // 1. Get REALTIME_CHECKIN triggers
    const [triggers]: any = await pool.query(
      "SELECT id, function_name FROM t_secom_trigger WHERE time_type = 'REALTIME_CHECKIN' AND is_active = 1"
    );

    if (triggers.length === 0) {
      return NextResponse.json({ gaps: [] });
    }

    // 2. Get today's check-ins
    const [checkinRows]: any = await pool.query(
      `SELECT Name, WSTime FROM t_secom_workhistory WHERE WorkDate = ? AND WSTime IS NOT NULL AND WSTime != ''`,
      [dbDateParam]
    );
    const checkinMap = new Map<string, string>();
    for (const r of checkinRows) checkinMap.set(r.Name, r.WSTime);

    // 3. Get person info
    const [personRows]: any = await pool.query("SELECT Name, Sabun, Email FROM t_secom_person");
    const personMap = new Map<string, any>();
    for (const p of personRows) personMap.set(p.Sabun || p.Name, p);

    const gaps: any[] = [];

    for (const trigger of triggers) {
      // Get targets for this trigger
      const [targetRows]: any = await pool.query("SELECT sabun FROM t_secom_trigger_target WHERE trigger_id = ?", [trigger.id]);
      const triggerTargets = new Set(targetRows.map((t: any) => t.sabun));

      // Get successfully sent logs for today
      const [alreadySentRows]: any = await pool.query(
        `SELECT sabun FROM t_secom_trigger_log 
         WHERE trigger_id = ? AND notify_type = 'checkin' AND status = 'success'
         AND DATE(CONVERT_TZ(created_at, '+00:00', '+09:00')) = ?`,
        [trigger.id, todayStr]
      );
      const alreadySent = new Set(alreadySentRows.map((r: any) => r.sabun));

      // Find people who:
      // a) Checked in today
      // b) Are targets of this trigger (or everyone if no targets specified)
      // c) Have NOT received a successful checkin log today
      for (const [key, p] of personMap.entries()) {
        if (!p.Email) continue;
        
        const sabun = p.Sabun || key;
        
        // If trigger has targets, must be in targets
        if (triggerTargets.size > 0 && !triggerTargets.has(sabun)) continue;
        
        // Must have checked in
        const wsTime = checkinMap.get(p.Name);
        if (!wsTime) continue;

        // Must NOT have been sent
        if (alreadySent.has(sabun)) continue;

        gaps.push({
          trigger_id: trigger.id,
          trigger_name: trigger.function_name,
          sabun: sabun,
          name: p.Name,
          email: p.Email,
          checkIn: wsTime
        });
      }
    }

    return NextResponse.json({ gaps });
  } catch (error: any) {
    console.error("[Gaps API] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { trigger_id, sabun, name, email, checkIn } = await request.json();
    if (!trigger_id || !sabun || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { sendSlackBotNotification } = await import("@/lib/slack");

    let logStatus = 'success';
    let errorMsg = null;

    try {
      await sendSlackBotNotification(email, 'checkin', { time: checkIn, name });
    } catch (err: any) {
      logStatus = 'failure';
      errorMsg = err.message;
      console.error(`[Manual Retry] Error (${name}):`, err);
    }

    const kstNow = getKstDate();
    const todayStr = kstNow.toISOString().split('T')[0];

    // Check if there was a waiting or failure log today, update it if so, else insert
    const [existingLogs]: any = await pool.query(
      `SELECT id FROM t_secom_trigger_log 
       WHERE trigger_id = ? AND sabun = ? AND notify_type = 'checkin'
       AND DATE(CONVERT_TZ(created_at, '+00:00', '+09:00')) = ?`,
      [trigger_id, sabun, todayStr]
    );

    if (existingLogs.length > 0) {
      await pool.query(
        `UPDATE t_secom_trigger_log SET status = ?, error_message = ? WHERE id = ?`,
        [logStatus, errorMsg, existingLogs[0].id]
      );
    } else {
      await pool.query(
        "INSERT INTO t_secom_trigger_log (trigger_id, trigger_name, sabun, name, email, notify_type, status, error_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [trigger_id, 'manual_retry', sabun, name, email, 'checkin', logStatus, errorMsg]
      );
    }

    return NextResponse.json({ success: logStatus === 'success' });
  } catch (error: any) {
    console.error("[Manual Retry] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
