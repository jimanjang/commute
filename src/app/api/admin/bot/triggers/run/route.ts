import { NextResponse } from "next/server";
import pool from "@/lib/mysql";
import { BigQuery } from "@google-cloud/bigquery";
import { sendSlackBotNotification } from "@/lib/slack";
import path from "path";

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
    const kstNow = new Date(new Date().getTime() + (9 * 60 * 60 * 1000));
    const todayStr = kstNow.toISOString().split('T')[0];
    
    const keyFilename = path.join(process.cwd(), "service-account.json");
    const bigquery = new BigQuery({ keyFilename });

    const bqQuery = `
      SELECT p.Name as name, p.Sabun as sabun, w.WSTime as checkIn, w.bLate, w.bAbsent
      FROM \`secom-data.secom.person\` p
      LEFT JOIN \`secom-data.secom.workhistory_today\` w ON p.Name = w.Name
      WHERE p.Name IS NOT NULL AND p.WorkGroup IN ('002', '006', '007')
    `;
    const [bqRows] = await bigquery.query({ query: bqQuery });

    // MySQL Overlay for Emails
    const [personRows]: any = await pool.query("SELECT Name, Sabun, Email FROM t_secom_person");
    const personMap = new Map();
    for (const p of personRows) personMap.set(p.Sabun || p.Name, p);

    const users = bqRows.map((bu: any) => {
      const email = personMap.get(bu.sabun || bu.name)?.Email;
      let status = "미출근";
      if (bu.checkIn) {
        status = "출근";
        if (bu.bLate === "1" || bu.bLate === 1) status = "지각";
      } else if (bu.bAbsent === "1" || bu.bAbsent === 1) {
        status = "결근";
      }
      return { ...bu, email, status };
    });

    // 3. Filter targets based on function_name
    let targets = [];
    if (trigger.function_name === 'reminder') {
      targets = users.filter(u => u.status === "지각" || u.status === "미출근" || u.status === "결근");
    } else if (trigger.function_name === 'checkin_confirm') {
      targets = users.filter(u => u.status === "출근");
    }

    // Apply Targeting Filter if triggerTargets is not empty
    if (triggerTargets.size > 0) {
      targets = targets.filter(u => triggerTargets.has(u.sabun));
    }

    // 4. Send Notifications
    let successCount = 0;
    for (const user of targets) {
      if (!user.email) continue;
      try {
        await sendSlackBotNotification(user.email, trigger.function_name === 'reminder' ? 'reminder' : 'checkin' as any, { time: user.checkIn });
        successCount++;
      } catch (err) { console.error(`Run Trigger Error (${user.name}):`, err); }
    }

    // 5. Update last_run
    await pool.query("UPDATE t_secom_trigger SET last_run = CURRENT_TIMESTAMP WHERE id = ?", [id]);

    return NextResponse.json({ success: true, targets: targets.length, sent: successCount });

  } catch (err: any) {
    console.error("[Trigger Run] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
