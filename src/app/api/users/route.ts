import { NextResponse } from "next/server";
import { BigQuery } from "@google-cloud/bigquery";
import path from "path";

function isToday(dateString: string | null) {
  if (!dateString) return true;
  const today = new Date();
  const kst = new Date(today.getTime() + (9 * 60 * 60 * 1000));
  const todayStr = kst.toISOString().split('T')[0];
  return dateString === todayStr;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    
    const targetIsToday = isToday(dateParam);
    const dbDateParam = dateParam ? dateParam.replace(/-/g, '') : null;

    const keyFilename = path.join(process.cwd(), "service-account.json");
    const bigquery = new BigQuery({ keyFilename });

    // 1. BigQuery에서 실시간 정보 조회
    let bqQuery = "";
    if (targetIsToday) {
      bqQuery = `
        SELECT 
          p.Name as name, 
          p.Sabun as sabun, 
          p.Department as department, 
          p.Team as team, 
          p.Part as part, 
          p.WorkGroup as workGroup, 
          p.WorkStatus as workStatus, 
          p.JoiningDate as joiningDate,
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
        ORDER BY 
          p.Name ASC
      `;
    } else {
      bqQuery = `
        SELECT 
          p.Name as name, 
          p.Sabun as sabun, 
          p.Department as department, 
          p.Team as team, 
          p.Part as part, 
          p.WorkGroup as workGroup, 
          p.WorkStatus as workStatus, 
          p.JoiningDate as joiningDate,
          w.WSTime as checkIn,
          w.WCTime as checkOut,
          w.bLate,
          w.bAbsent
        FROM 
          \`secom-data.secom.person\` p
        LEFT JOIN (
           SELECT Name, WSTime, WCTime, bLate, bAbsent FROM \`secom-data.secom.workhistory\` WHERE WorkDate = '${dbDateParam}'
           UNION ALL
           SELECT Name, WSTime, WCTime, bLate, bAbsent FROM \`secom-data.secom.workhistory_today\` WHERE WorkDate = '${dbDateParam}'
        ) w ON p.Name = w.Name
        WHERE 
          p.Name IS NOT NULL AND p.Name != '' AND p.Name != '미등록사용자'
          AND p.WorkGroup IN ('002', '006', '007')
        ORDER BY 
          p.Name ASC
      `;
    }

    const [bqRows] = await bigquery.query({ query: bqQuery });
    
    // 2. 구성원 데이터 매핑
    const users = bqRows.map((bu: any) => {
      let status = "미출근";
      if (bu.checkIn && bu.checkIn !== "") {
        status = "출근";
        if (bu.bLate === "1") status = "지각";
      } else if (bu.bAbsent === "1") {
        status = "결근";
      }

      return {
        name: bu.name?.trim() || "이름없음",
        displayName: bu.name?.trim() || "이름없음",
        sabun: bu.sabun,
        team: bu.team || bu.department || "-",
        part: bu.part || "",
        workGroup: bu.workGroup || "-",
        workStatus: bu.workStatus || "재직",
        joiningDate: bu.joiningDate || "-",
        checkIn: bu.checkIn ? (bu.checkIn.length === 14 ? `${bu.checkIn.substring(8, 10)}:${bu.checkIn.substring(10, 12)}` : bu.checkIn.substring(0, 5)) : "-",
        checkOut: bu.checkOut ? (bu.checkOut.length === 14 ? `${bu.checkOut.substring(8, 10)}:${bu.checkOut.substring(10, 12)}` : bu.checkOut.substring(0, 5)) : "-",
        status: status
      };
    });

    // 3. 실시간 통계 산출
    let statsQuery = "";
    if (targetIsToday) {
      statsQuery = `
        SELECT 
          COUNT(DISTINCT p.Name) as totalMember,
          COUNT(DISTINCT CASE WHEN w.WSTime IS NOT NULL AND w.WSTime != '' THEN p.Name END) as todayCheckIn,
          COUNT(DISTINCT CASE WHEN w.bLate = '1' OR w.bAbsent = '1' THEN p.Name END) as lateMissing
        FROM 
          \`secom-data.secom.person\` p
        LEFT JOIN 
          \`secom-data.secom.workhistory_today\` w ON p.Name = w.Name
        WHERE 
          p.Name IS NOT NULL AND p.Name != '' AND p.Name != '미등록사용자'
          AND p.WorkGroup IN ('002', '006', '007')
      `;
    } else {
      statsQuery = `
        SELECT 
          COUNT(DISTINCT p.Name) as totalMember,
          COUNT(DISTINCT CASE WHEN w.WSTime IS NOT NULL AND w.WSTime != '' THEN p.Name END) as todayCheckIn,
          COUNT(DISTINCT CASE WHEN w.bLate = '1' OR w.bAbsent = '1' THEN p.Name END) as lateMissing
        FROM 
          \`secom-data.secom.person\` p
        LEFT JOIN (
           SELECT Name, WSTime, bLate, bAbsent FROM \`secom-data.secom.workhistory\` WHERE WorkDate = '${dbDateParam}'
           UNION ALL
           SELECT Name, WSTime, bLate, bAbsent FROM \`secom-data.secom.workhistory_today\` WHERE WorkDate = '${dbDateParam}'
        ) w ON p.Name = w.Name
        WHERE 
          p.Name IS NOT NULL AND p.Name != '' AND p.Name != '미등록사용자'
          AND p.WorkGroup IN ('002', '006', '007')
      `;
    }

    const [statsRows] = await bigquery.query({ query: statsQuery });
    const stats = statsRows[0] || { totalMember: users.length, todayCheckIn: 0, lateMissing: 0 };

    return NextResponse.json({ 
      users, 
      stats: {
        ...stats,
        pendingApproval: 0 
      }
    });

  } catch (error) {
    console.error("Failed to fetch merged users:", error);
    
    // Fallback: Mockup data matching the format expected by frontend
    return NextResponse.json({
      users: [
        { name: "Aiden Kim", sabun: "1001", team: "Core", workGroup: "A조", status: "재직", joiningDate: "2024-01-01" },
        { name: "Alice Jeon", sabun: "1002", team: "FE", workGroup: "B조", status: "재직", joiningDate: "2024-02-15" }
      ],
      stats: { totalMember: 2, todayCheckIn: 0, lateMissing: 0, pendingApproval: 0 }
    });
  }
}
