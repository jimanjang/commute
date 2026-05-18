import { NextResponse } from "next/server";
import pool from "@/lib/mysql";
import { getBigQueryClient } from "@/lib/bigquery-oauth";
import { sendSlackBotNotification, sendSlackDMByEmail } from "@/lib/slack";
import { getKstDate, getTodayStr } from "@/lib/time";

export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    const isDryRun = process.env.DRY_RUN === 'true';
    
    // 1. Get Trigger Info
    const [rows]: any = await pool.query("SELECT * FROM t_secom_trigger WHERE id = ?", [id]);
    if (rows.length === 0) return NextResponse.json({ error: "Trigger not found" }, { status: 404 });
    const trigger = rows[0];

    const [targetRows]: any = await pool.query("SELECT sabun FROM t_secom_trigger_target WHERE trigger_id = ?", [id]);
    const triggerTargets = new Set(targetRows.map((t: any) => t.sabun?.trim()));

    // 2. Context & Reference Time
    const todayStr = getTodayStr();
    const dbDateParam = todayStr.replace(/-/g, '');
    const nowKst = getKstDate();
    const currentHhMm = `${String(nowKst.getHours()).padStart(2, '0')}:${String(nowKst.getMinutes()).padStart(2, '0')}`;
    
    let refHhMm = currentHhMm;
    // For regular triggers, use time_value. For REALTIME, always use current time to catch all check-ins up to now.
    if (trigger.time_type !== 'REALTIME_CHECKIN') {
      if (trigger.time_value && trigger.time_value.includes(":")) {
        refHhMm = trigger.time_value;
      } else if (trigger.time_value && trigger.time_value.length === 2 && !isNaN(Number(trigger.time_value))) {
        refHhMm = `${trigger.time_value}:00`;
      }
    }

    const bigquery = await getBigQueryClient();

    // 3. Roster & Maps
    const rosterQuery = `SELECT Name as name, Sabun as sabun, Team as team, WorkGroup as workGroup FROM \`secom-data.secom.person\` WHERE Name IS NOT NULL AND Name != '' AND WorkGroup IN ('002', '006', '007')`;
    const [rosterRows] = await bigquery.query({ query: rosterQuery });

    const [bridgeRows]: any = await pool.query("SELECT Name, Email, Sabun FROM t_secom_person WHERE Email IS NOT NULL AND Email != ''");
    const sabunToEmail = new Map();
    const nameToEmail = new Map();
    bridgeRows.forEach((p: any) => {
      const email = p.Email?.toLowerCase();
      if (p.Sabun) sabunToEmail.set(p.Sabun.trim(), email);
      nameToEmail.set(p.Name.trim(), email);
    });

    const [scheduleRows]: any = await pool.query("SELECT email, sheet_type_description, start_time, end_time FROM t_secom_schedule WHERE date = ?", [todayStr]);
    const emailToSchedules = new Map();
    scheduleRows.forEach((s: any) => {
      const email = s.email.toLowerCase();
      const idPart = email.split('@')[0].split('.')[0];
      if (!emailToSchedules.has(email)) emailToSchedules.set(email, []);
      emailToSchedules.get(email).push(s);
      if (idPart && !emailToSchedules.has(idPart)) emailToSchedules.set(idPart, emailToSchedules.get(email));
    });

    const exclusionKeywords = ['휴가', '반차', '공가', '병가', '경조', '검진', '공휴일', '휴원', '조퇴', '결근', '회의', '업무'];

    const getUserStatus = (user: any, checkIn: string | null) => {
      const email = sabunToEmail.get(user.sabun?.trim()) || nameToEmail.get(user.name?.trim());
      
      let effectiveCheckIn = null;
      if (checkIn && checkIn.trim() !== "" && checkIn.trim() !== "0") {
        let hhmm = "";
        if (checkIn.length >= 12) {
          hhmm = `${checkIn.substring(8, 10)}:${checkIn.substring(10, 12)}`;
        } else if (checkIn.length >= 4) {
          hhmm = `${checkIn.substring(0, 2)}:${checkIn.substring(2, 4)}`;
        }
        if (hhmm !== "" && hhmm <= refHhMm) effectiveCheckIn = hhmm;
      }

      let status = "-"; 
      if (effectiveCheckIn) {
        status = Number(user.bLate) === 1 ? "지각" : "출근";
      }

      if (email) {
        const idPart = email.split('@')[0].split('.')[0];
        const schedules = emailToSchedules.get(email) || emailToSchedules.get(idPart);
        if (schedules) {
          const desc = schedules.map((s: any) => s.sheet_type_description).join(", ");
          const startTime = schedules.find((s: any) => s.start_time)?.start_time || null;
          const isExcluded = exclusionKeywords.some(k => desc.includes(k));
          if (desc.includes("-") || isExcluded) {
            if (status === "-") status = isExcluded ? "휴가" : "-";
          } else if (!effectiveCheckIn) {
            status = (startTime && refHhMm > startTime) ? "미출근" : "출근 전";
          }
        }
      }
      return { status, email, effectiveCheckIn };
    };

    const [mysqlWorkRows]: any = await pool.query("SELECT Name, Sabun, WSTime, bLate FROM t_secom_workhistory WHERE WorkDate = ?", [dbDateParam]);
    const workMap = new Map();
    mysqlWorkRows.forEach((w: any) => {
      if (w.Sabun) workMap.set(w.Sabun.trim(), w);
      if (w.Name) workMap.set(w.Name.trim(), w);
    });

    const usersWithStatus = rosterRows.map((r: any) => {
      const work = workMap.get(r.sabun?.trim()) || workMap.get(r.name?.trim());
      const { status, email, effectiveCheckIn } = getUserStatus({ ...r, bLate: work?.bLate }, work?.WSTime);
      
      // Detailed Debug for targets
      if (triggerTargets.has(r.sabun?.trim())) {
        console.log(`[Target Debug] Name: ${r.name}, Sabun: ${r.sabun}, Status: ${status}, CheckIn: ${work?.WSTime} -> ${effectiveCheckIn}`);
      }

      return { ...r, status, email, checkIn: effectiveCheckIn };
    });

    let resultData: any = { success: true, targets: 0, sent: 0, preview: "발송 내역이 없습니다.", type: "individual", refTime: refHhMm, totalPeople: 0 };

    if (trigger.time_type === 'REALTIME_CHECKIN') {
      let checkinToday = usersWithStatus.filter(u => u.status === "출근" || u.status === "지각");
      if (triggerTargets.size > 0) {
        checkinToday = checkinToday.filter(u => triggerTargets.has(u.sabun?.trim()));
      }

      // Get already notified sabuns today
      const todayStr = getTodayStr();
      const [notifiedRows]: any = await pool.query(
        `SELECT sabun FROM t_secom_trigger_log 
         WHERE trigger_id = ? AND notify_type = 'checkin' AND status = 'success'
         AND created_at >= ?`,
        [id, `${todayStr} 00:00:00`]
      );
      const notifiedSabuns = new Set(notifiedRows.map((r: any) => r.sabun));

      const pendingUsers = checkinToday.filter(u => !notifiedSabuns.has(u.sabun));

      let sentCount = 0;
      let logs = [];

      for (const u of pendingUsers) {
        if (!u.email) continue;

        try {
          if (isDryRun) {
            logs.push(`🔍 [DRY RUN - 실시간출근] ${u.name}님 알림 발송 생략 (${u.checkIn})`);
          } else {
            await sendSlackBotNotification(u.email, 'checkin', { time: u.checkIn, name: u.name });
            logs.push(`✅ [실시간출근] ${u.name}님에게 알림 전송 완료! (${u.checkIn})`);
          }

          await pool.query(
            "INSERT INTO t_secom_trigger_log (trigger_id, trigger_name, sabun, name, email, notify_type, status) VALUES (?, ?, ?, ?, ?, 'checkin', 'success')",
            [id, trigger.function_name, u.sabun || '', u.name, u.email]
          );
          sentCount++;
        } catch (err: any) {
          console.error(`[Realtime Sync] Error (${u.name}):`, err);
          await pool.query(
            "INSERT INTO t_secom_trigger_log (trigger_id, trigger_name, sabun, name, email, notify_type, status, error_message) VALUES (?, ?, ?, ?, ?, 'checkin', 'failure', ?)",
            [id, trigger.function_name, u.sabun || '', u.name, u.email, err.message]
          );
        }
      }

      resultData.type = "individual";
      resultData.targets = pendingUsers.length;
      resultData.sent = sentCount;
      resultData.preview = logs.length > 0 
        ? logs.join("\n") 
        : (checkinToday.length > 0 
            ? `오늘 출근한 ${checkinToday.length}명은 이미 알림이 전송되었거나 제외되었습니다.` 
            : "오늘 새로 출근이 감지되어 알림을 전송할 대상자가 없습니다.");
    }

    else if (trigger.function_name.startsWith('send_slack_summary')) {
      const stats = {
        target: usersWithStatus.filter(u => u.status !== "휴가" && u.status !== "-").length,
        checkin: usersWithStatus.filter(u => u.status === "출근" || u.status === "지각").length,
        missing: usersWithStatus.filter(u => u.status === "미출근" || u.status === "지각").length
      };
      resultData.type = "summary";
      resultData.targets = 1;
      resultData.totalPeople = stats.target;
      const summaryMsg = `📢 [근태 요약 리포트 (기준시각: ${refHhMm})]\n• 출근 대상: ${stats.target}명\n• 출근 완료: ${stats.checkin}명\n• 지각/누락: ${stats.missing}명\n... (상세 명단 포함)`;
      resultData.preview = isDryRun ? `[DRY RUN] ${summaryMsg}` : summaryMsg;
      
      let receivers = [];
      try { receivers = JSON.parse(trigger.receivers || "[]"); } catch(e) {}
      let sentCount = 0;
      for (const r of receivers) {
        try {
          if (!isDryRun) {
            if (r.type === 'user') {
              const email = sabunToEmail.get(r.value);
              if (email) await sendSlackDMByEmail(email, summaryMsg);
            } else {
              const { WebClient } = await import("@slack/web-api");
              const slack = new WebClient(process.env.SLACK_TOKEN);
              await slack.chat.postMessage({ channel: r.value, text: summaryMsg, mrkdwn: true });
            }
          }
          sentCount++;
        } catch(e) {}
      }
      resultData.sent = sentCount;
    }

    else if (['reminder', 'TEAM_CHANNEL_CHECKIN', 'checkin_confirm'].includes(trigger.function_name)) {
      let missingUsers = usersWithStatus.filter(u => u.status === "미출근" || u.status === "지각");
      if (triggerTargets.size > 0) missingUsers = missingUsers.filter(u => triggerTargets.has(u.sabun?.trim()));

      resultData.totalPeople = missingUsers.length;

      const teamGroups = new Map<string, any[]>();
      missingUsers.forEach(u => {
        const t = u.team || "기타";
        if (!teamGroups.has(t)) teamGroups.set(t, []);
        teamGroups.get(t)!.push(u);
      });

      const [channels]: any = await pool.query("SELECT team_name, channel_id FROM t_secom_slack_channel WHERE is_active = 1");
      const teamMap = new Map<string, string>(channels.map((c: any) => [c.team_name, c.channel_id]));

      let sentCount = 0;
      let logs = [];
      for (const [team, uList] of teamGroups.entries()) {
        const channelId = teamMap.get(team);
        const names = uList.map((u: any) => `*${u.name}*`).join(", ");
        if (!channelId) {
          logs.push(`⚠️ [${team}] 팀은 슬랙 채널이 설정되지 않아 발송을 건너뛰었습니다. (대상: ${names})`);
          continue;
        }
        const msg = `<!channel> 앗! 아직 오늘 출근 지문이 확인되지 않은 분들이 있어요 🙌 (기준: ${refHhMm})\n• 대상자: ${names}`;
        try {
          if (isDryRun) {
            logs.push(`🔍 [DRY RUN - ${team}] 슬랙 발송 생략 (대상: ${names})`);
          } else {
            const { WebClient } = await import("@slack/web-api");
            const slack = new WebClient(process.env.SLACK_TOKEN);
            await slack.chat.postMessage({ channel: channelId, text: msg, mrkdwn: true });
            logs.push(`✅ [${team}] 팀 채널로 발송 완료! (대상: ${names})`);
          }
          sentCount++;
        } catch(e: any) { logs.push(`❌ [${team}] 발송 오류: ${e.message}`); }
      }

      resultData.type = "team";
      resultData.targets = teamGroups.size;
      resultData.sent = sentCount;
      resultData.preview = logs.length > 0 ? logs.join("\n") : `오전 ${refHhMm} 기준, 모든 대상자가 출근을 완료했습니다. ✨`;
    }

    await pool.query("UPDATE t_secom_trigger SET last_run = CURRENT_TIMESTAMP WHERE id = ?", [id]);
    return NextResponse.json(resultData);

  } catch (err: any) {
    console.error("[Trigger Run] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
