import { NextResponse } from "next/server";
import { getBigQueryClient } from "@/lib/bigquery-oauth";
import { getGwsUserMap } from "@/lib/gws-team";
import pool from "@/lib/mysql";

function getCleanName(name: string) {
  if (!name) return "";
  let clean = name.split('(')[0].trim().toLowerCase();
  return clean.split(' ')[0].trim();
}

export async function GET() {
  try {
    console.log("[Sync GWS] Fetching all bridge records from MySQL...");
    const [personRows]: any = await pool.query("SELECT Name, Email, Sabun, Team FROM t_secom_person");
    
    console.log("[Sync GWS] Fetching data from Google Workspace Admin SDK...");
    const gwsMap = await getGwsUserMap();
    
    const emailUpdatesBySabun: { sabun: string; email: string }[] = [];
    const emailUpdatesByName: { name: string; email: string }[] = [];
    
    const teamUpdatesBySabun: { sabun: string; team: string }[] = [];
    const teamUpdatesByName: { name: string; team: string }[] = [];
    
    let matchedCount = 0;

    for (const p of personRows) {
      const mysqlEmail = p.Email?.toLowerCase().trim() || "";
      const mysqlId = mysqlEmail.split('@')[0];
      const cleanName = getCleanName(p.Name);
      
      // Try to find GWS info by email, clean name, or email prefix
      const gwsInfo = gwsMap.get(mysqlEmail) || gwsMap.get(cleanName) || gwsMap.get(mysqlId);

      if (gwsInfo) {
        matchedCount++;
        
        // 1. Check if Email needs update
        if (gwsInfo.email && mysqlEmail !== gwsInfo.email.toLowerCase().trim()) {
          if (p.Sabun && p.Sabun.trim() !== "") {
            emailUpdatesBySabun.push({ sabun: p.Sabun, email: gwsInfo.email });
          } else if (p.Name) {
            emailUpdatesByName.push({ name: p.Name, email: gwsInfo.email });
          }
        }

        // 2. Check if Team needs update
        if (gwsInfo.team && p.Team !== gwsInfo.team) {
          if (p.Sabun && p.Sabun.trim() !== "") {
            teamUpdatesBySabun.push({ sabun: p.Sabun, team: gwsInfo.team });
          } else if (p.Name) {
            teamUpdatesByName.push({ name: p.Name, team: gwsInfo.team });
          }
        }
      }
    }

    console.log(`[Sync GWS] Matched ${matchedCount} users.`);
    console.log(`[Sync GWS] Queued email updates: ${emailUpdatesBySabun.length + emailUpdatesByName.length}`);
    console.log(`[Sync GWS] Queued team updates: ${teamUpdatesBySabun.length + teamUpdatesByName.length}`);

    const bigquery = await getBigQueryClient();

    // 1. Sync Emails to BigQuery & Local MySQL
    if (emailUpdatesBySabun.length > 0) {
      const mergeEmailBySabun = `
        MERGE \`secom-data.secom.person\` t
        USING (
          SELECT DISTINCT sabun, email FROM UNNEST([
            STRUCT<sabun STRING, email STRING>
            ${emailUpdatesBySabun.map(u => `('${u.sabun}', '${u.email}')`).join(', ')}
          ])
        ) s
        ON t.Sabun = s.sabun
        WHEN MATCHED THEN
          UPDATE SET t.Email = s.email, t.UpdateTime = FORMAT_TIMESTAMP('%Y-%m-%d %H:%M:%S', CURRENT_TIMESTAMP())
      `;
      try {
        const [job1] = await bigquery.createQueryJob({ query: mergeEmailBySabun, location: 'asia-northeast3' });
        await job1.getQueryResults();
      } catch (bqErr: any) {
        console.warn("[Sync GWS] BigQuery MERGE email by Sabun failed (free-tier billing limit):", bqErr.message);
      }

      for (const u of emailUpdatesBySabun) {
        const timeStr = new Date().toISOString().slice(0, 19).replace(/[-T:]/g, "");
        await pool.query(
          "UPDATE t_secom_person SET Email = ?, UpdateTime = ? WHERE Sabun = ?",
          [u.email, timeStr, u.sabun]
        );
      }
    }

    if (emailUpdatesByName.length > 0) {
      const mergeEmailByName = `
        MERGE \`secom-data.secom.person\` t
        USING (
          SELECT DISTINCT name, email FROM UNNEST([
            STRUCT<name STRING, email STRING>
            ${emailUpdatesByName.map(u => `('${u.name.replace(/'/g, "''")}', '${u.email}')`).join(', ')}
          ])
        ) s
        ON t.Name = s.name
        WHEN MATCHED THEN
          UPDATE SET t.Email = s.email, t.UpdateTime = FORMAT_TIMESTAMP('%Y-%m-%d %H:%M:%S', CURRENT_TIMESTAMP())
      `;
      try {
        const [job2] = await bigquery.createQueryJob({ query: mergeEmailByName, location: 'asia-northeast3' });
        await job2.getQueryResults();
      } catch (bqErr: any) {
        console.warn("[Sync GWS] BigQuery MERGE email by Name failed (free-tier billing limit):", bqErr.message);
      }

      for (const u of emailUpdatesByName) {
        const timeStr = new Date().toISOString().slice(0, 19).replace(/[-T:]/g, "");
        await pool.query(
          "UPDATE t_secom_person SET Email = ?, UpdateTime = ? WHERE Name = ?",
          [u.email, timeStr, u.name]
        );
      }
    }

    // 2. Sync Team Names to BigQuery & Local MySQL
    if (teamUpdatesBySabun.length > 0) {
      const mergeTeamBySabun = `
        MERGE \`secom-data.secom.person\` t
        USING (
          SELECT DISTINCT sabun, team FROM UNNEST([
            STRUCT<sabun STRING, team STRING>
            ${teamUpdatesBySabun.map(u => `('${u.sabun}', '${(u.team || '').replace(/'/g, "''")}')`).join(', ')}
          ])
        ) s
        ON t.Sabun = s.sabun
        WHEN MATCHED THEN
          UPDATE SET t.Team = s.team, t.UpdateTime = FORMAT_TIMESTAMP('%Y-%m-%d %H:%M:%S', CURRENT_TIMESTAMP())
      `;
      try {
        const [job3] = await bigquery.createQueryJob({ query: mergeTeamBySabun, location: 'asia-northeast3' });
        await job3.getQueryResults();
      } catch (bqErr: any) {
        console.warn("[Sync GWS] BigQuery MERGE team by Sabun failed (free-tier billing limit):", bqErr.message);
      }

      for (const u of teamUpdatesBySabun) {
        await pool.query(
          "UPDATE t_secom_person SET Team = ? WHERE Sabun = ?",
          [u.team, u.sabun]
        );
      }
    }

    if (teamUpdatesByName.length > 0) {
      const mergeTeamByName = `
        MERGE \`secom-data.secom.person\` t
        USING (
          SELECT DISTINCT name, team FROM UNNEST([
            STRUCT<name STRING, team STRING>
            ${teamUpdatesByName.map(u => `('${u.name.replace(/'/g, "''")}', '${(u.team || '').replace(/'/g, "''")}')`).join(', ')}
          ])
        ) s
        ON t.Name = s.name
        WHEN MATCHED AND (t.Team IS NULL OR t.Team = "") THEN
          UPDATE SET t.Team = s.team, t.UpdateTime = FORMAT_TIMESTAMP('%Y-%m-%d %H:%M:%S', CURRENT_TIMESTAMP())
      `;
      try {
        const [job4] = await bigquery.createQueryJob({ query: mergeTeamByName, location: 'asia-northeast3' });
        await job4.getQueryResults();
      } catch (bqErr: any) {
        console.warn("[Sync GWS] BigQuery MERGE team by Name failed (free-tier billing limit):", bqErr.message);
      }

      for (const u of teamUpdatesByName) {
        await pool.query(
          "UPDATE t_secom_person SET Team = ? WHERE Name = ? AND (Team IS NULL OR Team = '')",
          [u.team, u.name]
        );
      }
    }

    return NextResponse.json({
      success: true,
      emails_synced: emailUpdatesBySabun.length + emailUpdatesByName.length,
      teams_synced: teamUpdatesBySabun.length + teamUpdatesByName.length,
      synced_at: new Date().toISOString()
    });

  } catch (err: any) {
    console.error("[Sync GWS] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
