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
          w.bAbsent,
          w.ModifyUser
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
          w.bAbsent,
          w.ModifyUser
        FROM 
          \`secom-data.secom.person\` p
        LEFT JOIN (
           SELECT Name, WSTime, WCTime, bLate, bAbsent, ModifyUser FROM \`secom-data.secom.workhistory\` WHERE WorkDate = '${dbDateParam}'
           UNION ALL
           SELECT Name, WSTime, WCTime, bLate, bAbsent, ModifyUser FROM \`secom-data.secom.workhistory_today\` WHERE WorkDate = '${dbDateParam}'
        ) w ON p.Name = w.Name
        WHERE 
          p.Name IS NOT NULL AND p.Name != '' AND p.Name != '미등록사용자'
          AND p.WorkGroup IN ('002', '006', '007')
        ORDER BY 
          p.Name ASC
      `;
    }

    const [bqRows] = await bigquery.query({ query: bqQuery });
    
    // 1.5 MySQL Overlay (Immediately reflect changes made via Admin Web)
    let mysqlMap = new Map();
    try {
      const pool = (await import("@/lib/mysql")).default;
      const kstNow = new Date(new Date().getTime() + (9 * 60 * 60 * 1000));
      const kstTodayStr = kstNow.toISOString().slice(0, 10).replace(/-/g, '');
      const [mysqlRows]: any = await pool.query(
        "SELECT Name, WSTime, WCTime, bLate, bAbsent, ModifyUser, ModifyTime FROM t_secom_workhistory WHERE WorkDate = ?",
        [dbDateParam || kstTodayStr]
      );


      if (mysqlRows && mysqlRows.length > 0) {
        for (const r of mysqlRows) {
          mysqlMap.set(r.Name, r);
        }
      }
    } catch (mysqlErr) {
      console.warn("[Auth] MySQL overlay failed for dashboard:", mysqlErr);
    }

    // 2. 구성원 데이터 매핑
    const users = bqRows.map((bu: any) => {
      // Use MySQL data if available, otherwise use BigQuery data
      const fresh = mysqlMap.get(bu.name) || bu;
      
      let status = "미출근";
      if (fresh.WSTime || fresh.checkIn) {
        status = "출근";
        if (fresh.bLate === "1" || fresh.bLate === 1) status = "지각";
      } else if (fresh.bAbsent === "1" || fresh.bAbsent === 1) {
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
        checkIn: (fresh.WSTime || fresh.checkIn) ? 
          ((fresh.WSTime || fresh.checkIn).length >= 14 ? 
            `${(fresh.WSTime || fresh.checkIn).substring(8, 10)}:${(fresh.WSTime || fresh.checkIn).substring(10, 12)}` : 
            (fresh.WSTime || fresh.checkIn).substring(0, 5)) : "-",
        checkOut: (fresh.WCTime || fresh.checkOut) ? 
          ((fresh.WCTime || fresh.checkOut).length >= 14 ? 
            `${(fresh.WCTime || fresh.checkOut).substring(8, 10)}:${(fresh.WCTime || fresh.checkOut).substring(10, 12)}` : 
            (fresh.WCTime || fresh.checkOut).substring(0, 5)) : "-",
        status: status,
        isModified: !!(fresh.ModifyUser && fresh.ModifyUser !== '-1' && fresh.ModifyUser !== '')
      };
    });



    // 3. 실시간 통계 산출 (Merged Data 기준)
    const todayCheckIn = users.filter(u => u.status === "출근" || u.status === "지각").length;
    const lateMissing = users.filter(u => u.status === "지각" || u.status === "미출근" || u.status === "결근").length;
    const modifiedCount = users.filter(u => u.isModified).length;

    return NextResponse.json({ 
      users, 
      stats: {
        totalMember: users.length,
        todayCheckIn,
        lateMissing,
        modifiedCount
      }
    });


  } catch (error) {
    console.error("Failed to fetch merged users:", error);
    
    return NextResponse.json({
      users: [],
      stats: { totalMember: 0, todayCheckIn: 0, lateMissing: 0, modifiedCount: 0 }
    });
  }
}

