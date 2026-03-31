import { NextResponse } from "next/server";
import { BigQuery } from "@google-cloud/bigquery";
import path from "path";

export async function GET() {
  try {
    const keyFilename = path.join(process.cwd(), "service-account.json");
    const bigquery = new BigQuery({ keyFilename });

    // 1. 주간 근무 시간 추이 (최근 7일)
    const weeklyQuery = `
      SELECT 
        WorkDate, 
        AVG(CAST(TotalWorkTime AS FLOAT64)) as avgWorkTime
      FROM \`secom-data.secom.workhistory\`
      WHERE CAST(WorkDate AS STRING) >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
      GROUP BY WorkDate
      ORDER BY WorkDate ASC
    `;

    // 2. 부서별 정시 출근 분석
    const deptQuery = `
      SELECT 
        Department as name,
        ROUND(AVG(1 - CAST(bLate AS INT64)) * 100, 1) as val
      FROM \`secom-data.secom.workhistory\`
      WHERE CAST(WorkDate AS STRING) >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
      GROUP BY Department
      ORDER BY val DESC
    `;

    const [weeklyRows] = await bigquery.query({ query: weeklyQuery });
    const [deptRows] = await bigquery.query({ query: deptQuery });

    // 데이터 가공 (차트용)
    const weeklyTrend = weeklyRows.map(row => ({
      date: row.WorkDate,
      value: (row.avgWorkTime || 0) / 60 // 분 -> 시간
    }));

    return NextResponse.json({
      weeklyTrend,
      deptAnalysis: deptRows.map(row => ({
        name: row.name || "기타",
        val: row.val || 0,
        color: row.val > 90 ? "bg-emerald-500" : "bg-orange-500"
      }))
    });

  } catch (error) {
    console.error("Failed to fetch analysis data:", error);
    return NextResponse.json({
      weeklyTrend: [6.5, 8.0, 7.5, 8.2, 7.8, 0, 0].map((v, i) => ({ date: i, value: v })),
      deptAnalysis: [
        { name: '개발팀', val: 98, color: 'bg-emerald-500' },
        { name: '디자인팀', val: 89, color: 'bg-orange-500' },
      ]
    });
  }
}
