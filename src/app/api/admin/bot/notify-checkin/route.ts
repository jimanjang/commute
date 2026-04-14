import { NextResponse } from "next/server";
import { getNameByEmail } from "@/lib/directory";
import { sendSlackBotNotification } from "@/lib/slack";
import { BigQuery } from "@google-cloud/bigquery";
import path from "path";

/**
 * Manually trigger a check-in confirmation using INCLUSIVE MULTI-KEYWORD SEARCH.
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email || !email.endsWith("@daangnservice.com")) {
      return NextResponse.json({ error: "회사 도메인 이메일을 입력해주세요." }, { status: 400 });
    }

    // 1. Prepare Search Keywords (Inclusive Strategy)
    const emailPrefix = email.split('@')[0]; // e.g., 'tombo.lee'
    const shortPrefix = emailPrefix.split('.')[0]; // e.g., 'tombo'
    const fullName = await getNameByEmail(email); // e.g., '김보선'
    
    const searchKeywords = Array.from(new Set([
      emailPrefix,
      shortPrefix,
      fullName
    ].filter(k => !!k))); // Unique, non-null keywords

    const kstNow = new Date(new Date().getTime() + (9 * 60 * 60 * 1000));
    const todayStr = kstNow.toISOString().split('T')[0];
    const dbDateParam = todayStr.replace(/-/g, '');

    let actualCheckIn = "-";
    let foundName = "-";

    // Try MySQL with dynamic multi-OR query
    try {
      const pool = (await import("@/lib/mysql")).default;
      
      // Build dynamic OR conditions
      const conditions = searchKeywords.map(() => "Name LIKE ?").join(" OR ");
      const params = [dbDateParam, ...searchKeywords.map(k => `%${k}%`)];

      const [mysqlRows]: any = await pool.query(
        `SELECT Name, WSTime FROM t_secom_workhistory 
         WHERE WorkDate = ? 
         AND (${conditions})
         LIMIT 1`,
        params
      );

      if (mysqlRows && mysqlRows.length > 0 && mysqlRows[0].WSTime) {
        const wt = mysqlRows[0].WSTime;
        actualCheckIn = wt.length >= 14 ? `${wt.substring(8, 10)}:${wt.substring(10, 12)}` : wt;
        foundName = mysqlRows[0].Name;
      }
    } catch (err: any) {
      console.warn("[Bot] MySQL check failed:", err.message);
    }

    // Fallback to BigQuery with same logic
    if (actualCheckIn === "-") {
      try {
        const bigquery = new BigQuery({ keyFilename: path.join(process.cwd(), "service-account.json") });
        
        // Build BigQuery dynamic conditions
        const bqConditionStr = searchKeywords.map((_, i) => `Name LIKE @k${i}`).join(" OR ");
        const bqParams: any = { today: dbDateParam };
        searchKeywords.forEach((k, i) => { bqParams[`k${i}`] = `%${k}%`; });

        const bqQuery = `
          SELECT Name, WSTime FROM \`secom-data.secom.workhistory_today\` 
          WHERE WorkDate = @today 
          AND (${bqConditionStr})
          LIMIT 1
        `;

        const [bqRows] = await bigquery.query({ 
          query: bqQuery, 
          params: bqParams 
        });
        
        if (bqRows && bqRows.length > 0 && bqRows[0].WSTime) {
          const wt = bqRows[0].WSTime;
          actualCheckIn = wt.length >= 14 ? `${wt.substring(8, 10)}:${wt.substring(10, 12)}` : wt;
          foundName = bqRows[0].Name;
        }
      } catch (bqErr: any) {
        console.warn("[Bot] BQ check failed:", bqErr.message);
      }
    }

    if (actualCheckIn === "-") {
      return NextResponse.json({ 
        message: `'${searchKeywords.join("/")}' 키워드에 해당하는 오늘 출근 기록을 찾을 수 없습니다.` 
      }, { status: 200 });
    }

    // 3. Send Slack DM
    await sendSlackBotNotification(email, 'checkin', { time: actualCheckIn });

    return NextResponse.json({ 
      success: true, 
      matchedUser: foundName, 
      time: actualCheckIn 
    });
    
  } catch (error: any) {
    console.error("[Bot] Checkin Notify API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
