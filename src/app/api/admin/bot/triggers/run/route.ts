import { NextResponse } from "next/server";
import pool from "@/lib/mysql";
import { BigQuery } from "@google-cloud/bigquery";
import { sendSlackBotNotification } from "@/lib/slack";
import path from "path";
import { getKstDate, getTodayStr } from "@/lib/time";

export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    
    // 1. Get Trigger Info & Targets
    const [rows]: any = await pool.query("SELECT * FROM t_secom_trigger WHERE id = ?", [id]);
    if (rows.length === 0) return NextResponse.json({ error: "Trigger not found" }, { status: 404 });
    const trigger = rows[0];

    const [targetRows]: any = await pool.query("SELECT sabun FROM t_secom_trigger_target WHERE trigger_id = ?", [id]);
    const triggerTargets = new Set(targetRows.map((t: any) => t.sabun));

    // 2. Execution Logic
    const kstNow = getKstDate();
    const todayStr = getTodayStr();
    const dbDateParam = todayStr.replace(/-/g, '');
    
    const keyFilename = path.join(process.cwd(), "service-account.json");
    const bigquery = new BigQuery({ keyFilename });

    // MySQL Overlay for Emails
    const [personRows]: any = await pool.query("SELECT Name, Sabun, Email FROM t_secom_person");
    const personMap = new Map();
    for (const p of personRows) {
      if (p.Sabun) personMap.set(p.Sabun, p);
      if (p.Name) personMap.set(p.Name, p);
    }

    // ─── REALTIME_CHECKIN: Special branch ───
    if (trigger.time_type === 'REALTIME_CHECKIN') {
      // 1) Get today's raw check-in records from MySQL (Any entry for today)
      const [checkinRows]: any = await pool.query(
        `SELECT Name, WSTime FROM t_secom_workhistory WHERE WorkDate = ?`,
        [dbDateParam]
      );

      // Maps for quick lookup
      const checkinBySabun = new Map<string, string>(); // sabun -> WSTime (can be empty string)
      const checkedInNames = new Set<string>();

      // Populate check-in info
      for (const row of checkinRows) {
        checkedInNames.add(row.Name);
        const p = personMap.get(row.Name);
        if (p && p.Sabun) {
          checkinBySabun.set(p.Sabun, row.WSTime || '');
        }
      }

      // 2) Get already-processed entries for this trigger today
      const [alreadySentRows]: any = await pool.query(
        `SELECT sabun, notify_type, status FROM t_secom_trigger_log
         WHERE trigger_id = ? AND DATE(CONVERT_TZ(created_at, '+00:00', '+09:00')) = ?`,
        [id, todayStr]
      );

      const alreadySentCheckin = new Set(
        alreadySentRows
          .filter((r: any) => r.notify_type === 'checkin' && r.status === 'success')
          .map((r: any) => r.sabun)
      );
      const alreadyWaiting = new Set(
        alreadySentRows
          .filter((r: any) => r.notify_type === 'checkin' && r.status === 'waiting')
          .map((r: any) => r.sabun)
      );
      const alreadySentReminder = new Set(
        alreadySentRows
          .filter((r: any) => r.notify_type === 'reminder')
          .map((r: any) => r.sabun)
      );

      // 3) Process NEW check-ins (Not in log at all today)
      let successCount = 0;
      let waitingCount = 0;

      // Filter people who checked in but haven't been processed yet
      for (const [sabun, wsTime] of checkinBySabun.entries()) {
        // If trigger has targets, skip non-targets
        if (triggerTargets.size > 0 && !triggerTargets.has(sabun)) continue;
        
        // Skip if already successfully sent or already waiting
        if (alreadySentCheckin.has(sabun) || alreadyWaiting.has(sabun)) continue;

        const p = personMap.get(sabun);
        if (!p || !p.Email) continue;

        if (wsTime && wsTime.trim() !== '') {
          // A) WSTime available -> Send notification
          try {
            await sendSlackBotNotification(p.Email, 'checkin', { time: wsTime, name: p.Name });
            successCount++;
            await pool.query(
              "INSERT INTO t_secom_trigger_log (trigger_id, trigger_name, sabun, name, email, notify_type, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
              [id, trigger.function_name, sabun, p.Name, p.Email, 'checkin', 'success']
            );
          } catch (err: any) {
            console.error(`[Realtime Checkin] Error (${p.Name}):`, err);
            await pool.query(
              "INSERT INTO t_secom_trigger_log (trigger_id, trigger_name, sabun, name, email, notify_type, status, error_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
              [id, trigger.function_name, sabun, p.Name, p.Email, 'checkin', 'failure', err.message]
            );
          }
        } else {
          // B) WSTime NOT yet available -> Mark as waiting
          waitingCount++;
          await pool.query(
            "INSERT INTO t_secom_trigger_log (trigger_id, trigger_name, sabun, name, email, notify_type, status, error_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [id, trigger.function_name, sabun, p.Name, p.Email, 'checkin', 'waiting', 'WSTime not yet available — will retry on next poll']
          );
        }
      }

      // 4) Resolve 'waiting' entries whose WSTime is now available
      let waitingResolvedCount = 0;
      for (const sabun of alreadyWaiting) {
        const wsTime = checkinBySabun.get(sabun);
        if (wsTime && wsTime.trim() !== '') {
          const p = personMap.get(sabun);
          if (!p || !p.Email) continue;

          try {
            await sendSlackBotNotification(p.Email, 'checkin', { time: wsTime, name: p.Name });
            waitingResolvedCount++;
            await pool.query(
              `UPDATE t_secom_trigger_log SET status = 'success', error_message = NULL 
               WHERE trigger_id = ? AND sabun = ? AND notify_type = 'checkin' AND status = 'waiting'
               AND DATE(CONVERT_TZ(created_at, '+00:00', '+09:00')) = ?`,
              [id, sabun, todayStr]
            );
          } catch (err: any) {
            console.error(`[Realtime Checkin] Waiting Resolve Error (${p.Name}):`, err);
            await pool.query(
              `UPDATE t_secom_trigger_log SET status = 'failure', error_message = ? 
               WHERE trigger_id = ? AND sabun = ? AND notify_type = 'checkin' AND status = 'waiting'
               AND DATE(CONVERT_TZ(created_at, '+00:00', '+09:00')) = ?`,
              [err.message, id, sabun, todayStr]
            );
          }
        }
      }

      // 5) Reminders (After 10:00 AM)
      let reminderCount = 0;
      if (kstNow.getHours() >= 10 && alreadySentReminder.size === 0) {
        // Target list for reminders
        let reminderTargets: any[] = [];
        if (triggerTargets.size > 0) {
          for (const s of triggerTargets) {
            const p = personMap.get(s);
            if (p && !checkedInNames.has(p.Name)) reminderTargets.push(p);
          }
        } else {
          for (const [, p] of personMap.entries()) {
            if (p.Email && p.Sabun && !checkedInNames.has(p.Name)) reminderTargets.push(p);
          }
        }

        for (const user of reminderTargets) {
          try {
            await sendSlackBotNotification(user.Email, 'reminder', { name: user.Name });
            reminderCount++;
            await pool.query(
              "INSERT INTO t_secom_trigger_log (trigger_id, trigger_name, sabun, name, email, notify_type, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
              [id, trigger.function_name, user.Sabun, user.Name, user.Email, 'reminder', 'success']
            );
          } catch (err: any) {
            console.error(`[Realtime Reminder] Error (${user.Name}):`, err);
            await pool.query(
              "INSERT INTO t_secom_trigger_log (trigger_id, trigger_name, sabun, name, email, notify_type, status, error_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
              [id, trigger.function_name, user.Sabun, user.Name, user.Email, 'reminder', 'failure', err.message]
            );
          }
        }
      }

      // Update last_run
      await pool.query("UPDATE t_secom_trigger SET last_run = CURRENT_TIMESTAMP WHERE id = ?", [id]);

      return NextResponse.json({
        success: true,
        checkin_sent: successCount,
        waiting_resolved: waitingResolvedCount,
        waiting_tracked: waitingCount,
        reminder_sent: reminderCount
      });
    }

    // ─── Standard triggers (TIME_DRIVEN) ───
    const bqQuery = `
      SELECT p.Name as name, p.Sabun as sabun, w.WSTime as checkIn, w.bLate, w.bAbsent
      FROM \`secom-data.secom.person\` p
      LEFT JOIN \`secom-data.secom.workhistory_today\` w ON p.Name = w.Name
      WHERE p.Name IS NOT NULL AND p.WorkGroup IN ('002', '006', '007')
    `;
    const [bqRows] = await bigquery.query({ query: bqQuery });

    const users = bqRows.map((bu: any) => {
      const p = personMap.get(bu.sabun || bu.name);
      const email = p?.Email;
      let status = "미출근";
      if (bu.checkIn) {
        status = "출근";
        if (bu.bLate === "1" || bu.bLate === 1) status = "지각";
      } else if (bu.bAbsent === "1" || bu.bAbsent === 1) {
        status = "결근";
      }
      return { ...bu, email, status };
    });

    let targets: any[] = [];
    if (trigger.function_name === 'attendance_smart_alert') {
      targets = users;
    } else if (trigger.function_name === 'reminder') {
      targets = users.filter(u => u.status === "지각" || u.status === "미출근" || u.status === "결근");
    } else if (trigger.function_name === 'checkin_confirm') {
      targets = users.filter(u => u.status === "출근");
    }

    if (triggerTargets.size > 0) {
      targets = targets.filter(u => triggerTargets.has(u.sabun));
    }

    let successCount = 0;
    for (const user of targets) {
      if (!user.email) continue;
      
      let notifyType: 'checkin' | 'reminder' = 'reminder';
      if (trigger.function_name === 'attendance_smart_alert') {
        notifyType = (user.status === "출근" || user.status === "지각") ? 'checkin' : 'reminder';
      } else {
        notifyType = trigger.function_name === 'reminder' ? 'reminder' : 'checkin';
      }

      try {
        await sendSlackBotNotification(user.email, notifyType, { time: user.checkIn, name: user.name });
        successCount++;
        await pool.query(
          "INSERT INTO t_secom_trigger_log (trigger_id, trigger_name, sabun, name, email, notify_type, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [id, trigger.function_name, user.sabun, user.name, user.email, notifyType, 'success']
        );
      } catch (err: any) { 
        console.error(`Run Trigger Error (${user.name}):`, err); 
        await pool.query(
          "INSERT INTO t_secom_trigger_log (trigger_id, trigger_name, sabun, name, email, notify_type, status, error_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [id, trigger.function_name, user.sabun, user.name, user.email, notifyType, 'failure', err.message]
        );
      }
    }

    await pool.query("UPDATE t_secom_trigger SET last_run = CURRENT_TIMESTAMP WHERE id = ?", [id]);
    return NextResponse.json({ success: true, targets: targets.length, sent: successCount });

  } catch (err: any) {
    console.error("[Trigger Run] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
