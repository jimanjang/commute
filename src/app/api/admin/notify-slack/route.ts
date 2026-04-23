import { NextResponse } from "next/server";
import { BigQuery } from "@google-cloud/bigquery";
import { sendSlackDMByEmail } from "@/lib/slack";
import path from "path";
import { getKstDate } from "@/lib/time";

export async function POST(request: Request) {
  try {
    const kstNow = getKstDate();
    const todayStr = kstNow.toISOString().split('T')[0];
    const dbDateParam = todayStr.replace(/-/g, '');

    const keyFilename = path.join(process.cwd(), "service-account.json");
    const bigquery = new BigQuery({ keyFilename });

    // 1. Fetch Today's Data from BigQuery
    const bqQuery = `
      SELECT 
        p.Name as name, 
        w.WSTime as checkIn,
        w.WCTime as checkOut,
        w.bLate,
        w.bAbsent
      FROM 
        \`secom-data.secom.person\` p
      LEFT JOIN 
        \`secom-data.secom.workhistory_today\` w ON p.Name = w.Name
      WHERE 
        p.Name IS NOT NULL AND p.Name != '' AND p.Name != '미등록사용자'
        AND p.WorkGroup IN ('002', '006', '007')
    `;

    const [bqRows] = await bigquery.query({ query: bqQuery });

    // 2. MySQL Overlay
    let mysqlMap = new Map();
    try {
      const pool = (await import("@/lib/mysql")).default;
      const [mysqlRows]: any = await pool.query(
        "SELECT Name, WSTime, WCTime, bLate, bAbsent FROM t_secom_workhistory WHERE WorkDate = ?",
        [dbDateParam]
      );
      for (const r of mysqlRows) {
        mysqlMap.set(r.Name, r);
      }
    } catch (mysqlErr) {
      console.warn("[SlackNotify] MySQL overlay failed:", mysqlErr);
    }

    // 3. Combine and Aggregate
    const users = bqRows.map((bu: any) => {
      const fresh = mysqlMap.get(bu.name) || bu;
      let status = "미출근";
      if (fresh.WSTime || fresh.checkIn) {
        status = "출근";
        if (fresh.bLate === "1" || fresh.bLate === 1) status = "지각";
      } else if (fresh.bAbsent === "1" || fresh.bAbsent === 1) {
        status = "결근";
      }
      
      const checkOut = (fresh.WCTime || fresh.checkOut) ? 
          ((fresh.WCTime || fresh.checkOut).length >= 14 ? 
            `${(fresh.WCTime || fresh.checkOut).substring(8, 10)}:${(fresh.WCTime || fresh.checkOut).substring(10, 12)}` : 
            (fresh.WCTime || fresh.checkOut).substring(0, 5)) : "-";

      return { name: bu.name, status, checkOut };
    });

    const totalCount = users.length;
    const presentCount = users.filter(u => u.status === "출근" || u.status === "지각").length;
    const lateMissingUsers = users.filter(u => u.status === "지각" || u.status === "미출근" || u.status === "결근" || u.checkOut === "-");

    // 4. Construct Slack Message
    const lateList = lateMissingUsers
      .map(u => `- *${u.name}* (${u.status})`)
      .slice(0, 30) // Limit to avoid hitting message length limits
      .join("\n");

    const message = `
*📢 [근태 요약 리포트] ${todayStr}*

• *전체 구성원:* ${totalCount}명
• *현재 출근자:* ${presentCount}명
• *지각/누락자:* ${lateMissingUsers.length}명

*📍 지각/누락 명단 (상위 30명):*
${lateList || "- 없음"}

${lateMissingUsers.length > 30 ? `_...외 ${lateMissingUsers.length - 30}명 더 있음_` : ""}

> 이 리포트는 관리자 대시보드에서 수동으로 발송되었습니다.
    `.trim();

    // 5. Send DM to laika@daangnservice.com
    await sendSlackDMByEmail("laika@daangnservice.com", message);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("[SlackNotify] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
