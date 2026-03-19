import { NextResponse } from "next/server";
import { BigQuery } from "@google-cloud/bigquery";
import path from "path";

export async function GET() {
  try {
    const keyFilename = path.join(process.cwd(), "service-account.json");
    const bigquery = new BigQuery({ keyFilename });

    // 부서(Department)가 '007'인 고유 사용자 목록 조회
    // Name에 직급 등이 포함된 '이름(직급)' 형태일 수 있으므로 괄호 앞부분만 추출
    const query = `
      SELECT DISTINCT 
        REGEXP_EXTRACT(Name, r'^[^(]+') as name,
        Sabun as sabun
      FROM 
        \`secom-data.secom.person\`
      WHERE 
        Department = '007' AND Name IS NOT NULL
      ORDER BY 
        name ASC
    `;

    const [rows] = await bigquery.query({ query });
    
    // 기본 "본인" 옵션을 맨 앞에 추가
    const users = [{ name: "본인", sabun: "" }, ...rows];
    
    return NextResponse.json(users);

  } catch (error) {
    console.error("Failed to fetch department users:", error);
    
    // 쿼리 실패시 기본 fallback 제공
    return NextResponse.json([
      { name: "본인", sabun: "" },
      { name: "Aiden Kim", sabun: "1001" },
      { name: "Alice Jeon", sabun: "1002" },
      { name: "Amber Jeon", sabun: "1003" },
      { name: "Amir Park", sabun: "1004" }
    ]);
  }
}
