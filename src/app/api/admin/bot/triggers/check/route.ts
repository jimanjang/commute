import { NextResponse } from "next/server";
import pool from "@/lib/mysql";
import { format } from "date-fns";
import { getKstDate } from "@/lib/time";

// This endpoint is called by an external scheduler (cron) to check if any triggers need to be fired.
export async function GET() {
  try {
    const kstNow = getKstDate();
    const currentTime = format(kstNow, "HH:mm");
    const currentHour = format(kstNow, "HH");
    const todayStr = format(kstNow, "yyyy-MM-dd");
    const currentDay = kstNow.getDay().toString(); // 0(Sun) ~ 6(Sat)

    // 1. Fetch all active triggers
    const [triggers]: any = await pool.query(
      "SELECT * FROM t_secom_trigger WHERE is_active = 1"
    );

    const executed = [];

    // 2. Identify triggers to run
    for (const trigger of triggers) {
      let shouldRun = false;

      // Day of week check (Default: 1,2,3,4,5 if null/empty)
      const allowedDays = (trigger.days_of_week || "1,2,3,4,5").split(",");
      if (!allowedDays.includes(currentDay)) {
        continue; // Skip this trigger for today
      }

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
      } else if (trigger.time_type === 'REALTIME_CHECKIN') {
        // Realtime checkin: run every poll cycle (every 30s).
        // Dedup is handled inside the run logic by checking trigger_log.
        shouldRun = true;
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
