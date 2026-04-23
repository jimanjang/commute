import { NextResponse } from "next/server";
import pool from "@/lib/mysql";
import { format } from "date-fns";
import { getKstDate } from "@/lib/time";

// This endpoint is called by an external scheduler (cron) to check if any triggers need to be fired.
export async function GET() {
  try {
    const kstNow = getKstDate();
    const isWeekend = kstNow.getDay() === 0 || kstNow.getDay() === 6;
    
    // We typically don't run commute triggers on weekends.
    if (isWeekend) {
      return NextResponse.json({ status: "weekend_skip", date: format(kstNow, "yyyy-MM-dd HH:mm") });
    }

    const currentTime = format(kstNow, "HH:mm");
    const currentHour = format(kstNow, "HH");
    const todayStr = format(kstNow, "yyyy-MM-dd");

    // 1. Fetch all active triggers
    const [triggers]: any = await pool.query(
      "SELECT * FROM t_secom_trigger WHERE is_active = 1"
    );

    const executed = [];

    // 2. Identify triggers to run
    for (const trigger of triggers) {
      let shouldRun = false;

      // Check if already run today
      const lastRunDate = trigger.last_run ? format(new Date(trigger.last_run), "yyyy-MM-dd") : "";
      const alreadyRunToday = lastRunDate === todayStr;

      if (trigger.time_type === 'SPECIFIC_TIME') {
        // Match specific HH:mm
        if (trigger.time_value === currentTime && !alreadyRunToday) {
          shouldRun = true;
        }
      } else if (trigger.time_type === 'DAY_TIMER') {
        // Match the hour (e.g. "09" for 09:00~10:00 range)
        // We run it as soon as the hour starts, if not already run today.
        if (trigger.time_value === currentHour && !alreadyRunToday) {
          shouldRun = true;
        }
      }

      if (shouldRun) {
        executed.push({ id: trigger.id, function: trigger.function_name });

        // Trigger the run!
        // We use fetch to call our own internal run API.
        const port = process.env.PORT || 3000;
        const baseUrl = `http://localhost:${port}`;
        
        try {
          await fetch(`${baseUrl}/api/admin/bot/triggers/run`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: trigger.id })
          });
        } catch (runErr) {
          console.error(`[Scheduler] Failed to trigger run for ID ${trigger.id}:`, runErr);
        }
      }
    }

    return NextResponse.json({
      timestamp: format(kstNow, "yyyy-MM-dd HH:mm"),
      active_triggers: triggers.length,
      executed_count: executed.length,
      executed_list: executed
    });

  } catch (error: any) {
    console.error("[Scheduler] Check Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
