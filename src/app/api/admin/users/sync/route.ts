import { NextResponse } from "next/server";
import { getBigQueryClient } from "@/lib/bigquery-oauth";
import { getGwsUserMap } from "@/lib/gws-team";
import pool from "@/lib/mysql";

export async function GET() {
  try {
    console.log("[Sync GWS] Fetching bridge data from MySQL...");
    const [personRows]: any = await pool.query("SELECT Name, Email, Sabun FROM t_secom_person WHERE Email IS NOT NULL AND Email != ''");
    
    console.log("[Sync GWS] Fetching data from Google Workspace Admin SDK...");
    const gwsMap = await getGwsUserMap();
    
    // Using Maps to ensure uniqueness by target key (sabun or name)
    const sabunMap = new Map<string, string>();
    const nameMap = new Map<string, string>();
    
    let matchedCount = 0;

    for (const p of personRows) {
      const mysqlEmail = p.Email.toLowerCase().trim();
      const mysqlId = mysqlEmail.split('@')[0];
      
      const gwsInfo = gwsMap.get(mysqlEmail) || gwsMap.get(mysqlId);

      if (gwsInfo && gwsInfo.team) {
        if (p.Sabun && p.Sabun.trim() !== "") {
          sabunMap.set(p.Sabun, gwsInfo.team);
        } else if (p.Name) {
          nameMap.set(p.Name, gwsInfo.team);
        }
        matchedCount++;
      }
    }

    const updateBySabun = Array.from(sabunMap.entries()).map(([sabun, team]) => ({ sabun, team }));
    const updateByName = Array.from(nameMap.entries()).map(([name, team]) => ({ name, team }));

    console.log(`[Sync GWS] Matched ${matchedCount} users. Unique updates: ${updateBySabun.length} by Sabun, ${updateByName.length} by Name.`);

    if (updateBySabun.length === 0 && updateByName.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: "No matching users found." });
    }

    const bigquery = await getBigQueryClient();

    // 1. Sync by Sabun (Primary)
    if (updateBySabun.length > 0) {
      const mergeBySabun = `
        MERGE \`secom-data.secom.person\` t
        USING (
          SELECT DISTINCT sabun, team FROM UNNEST([
            STRUCT<sabun STRING, team STRING>
            ${updateBySabun.map(u => `('${u.sabun}', '${(u.team || '').replace(/'/g, "''")}')`).join(', ')}
          ])
        ) s
        ON t.Sabun = s.sabun
        WHEN MATCHED THEN
          UPDATE SET t.Team = s.team, t.UpdateTime = FORMAT_TIMESTAMP('%Y-%m-%d %H:%M:%S', CURRENT_TIMESTAMP())
      `;
      const [job1] = await bigquery.createQueryJob({ query: mergeBySabun, location: 'asia-northeast3' });
      await job1.getQueryResults();
    }

    // 2. Sync by Name (Fallback for missing Sabuns)
    if (updateByName.length > 0) {
      const mergeByName = `
        MERGE \`secom-data.secom.person\` t
        USING (
          SELECT DISTINCT name, team FROM UNNEST([
            STRUCT<name STRING, team STRING>
            ${updateByName.map(u => `('${u.name.replace(/'/g, "''")}', '${(u.team || '').replace(/'/g, "''")}')`).join(', ')}
          ])
        ) s
        ON t.Name = s.name
        WHEN MATCHED AND (t.Team IS NULL OR t.Team = "") THEN
          UPDATE SET t.Team = s.team, t.UpdateTime = FORMAT_TIMESTAMP('%Y-%m-%d %H:%M:%S', CURRENT_TIMESTAMP())
      `;
      const [job2] = await bigquery.createQueryJob({ query: mergeByName, location: 'asia-northeast3' });
      await job2.getQueryResults();
    }

    return NextResponse.json({
      success: true,
      count: updateBySabun.length + updateByName.length,
      synced_at: new Date().toISOString()
    });

  } catch (err: any) {
    console.error("[Sync GWS] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
