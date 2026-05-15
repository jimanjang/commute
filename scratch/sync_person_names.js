const { BigQuery } = require('@google-cloud/bigquery');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

const CLIENT_ID = '32555940559.apps.googleusercontent.com';
const CLIENT_SECRET = 'ZmssLNjJy2998hD4CTg2ejr2';

async function getBigQueryClient() {
  const tokenPath = path.join(process.cwd(), 'token.json');
  const tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET);
  oauth2Client.setCredentials(tokens);
  return new BigQuery({
    projectId: 'karrotmarket',
    authClient: oauth2Client
  });
}

async function main() {
  const bigquery = await getBigQueryClient();

  // 1. Read from Source (US)
  console.log('Reading Google Workspace data from karrotmarket.team_operation.vw_admin_user_info (US)...');
  const sourceQuery = `
    SELECT 
      employee_number as sabun,
      team,
      department,
      part
    FROM \`karrotmarket.team_operation.vw_admin_user_info\`
    WHERE employee_number IS NOT NULL AND employee_number != ''
  `;
  const [sourceRows] = await bigquery.query({ query: sourceQuery, location: 'US' });
  console.log(`Successfully read ${sourceRows.length} users.`);

  // 2. Prepare for Update (asia-northeast3)
  // Since we can't do cross-region merge, we'll create a temporary list of values
  // Or just run batches of updates. For 112 users, we can use a single large MERGE with a VALUES clause.
  
  const values = sourceRows
    .filter(r => r.sabun)
    .map(r => `('${r.sabun}', '${(r.team || '').replace(/'/g, "''")}', '${(r.department || '').replace(/'/g, "''")}', '${(r.part || '').replace(/'/g, "''")}')`)
    .join(', ');

  const mergeQuery = `
    MERGE \`secom-data.secom.person\` t
    USING (
      SELECT * FROM UNNEST([
        STRUCT<sabun STRING, team STRING, department STRING, part STRING>
        ${sourceRows.filter(r => r.sabun).map(r => `('${r.sabun}', '${(r.team || '').replace(/'/g, "''")}', '${(r.department || '').replace(/'/g, "''")}', '${(r.part || '').replace(/'/g, "''")}')`).join(', ')}
      ])
    ) s
    ON t.Sabun = s.sabun
    WHEN MATCHED THEN
      UPDATE SET 
        t.Team = s.team,
        t.Department = s.department,
        t.Part = s.part,
        t.UpdateTime = CURRENT_TIMESTAMP()
  `;

  console.log('Updating secom-data.secom.person (asia-northeast3)...');
  const [job] = await bigquery.createQueryJob({ query: mergeQuery, location: 'asia-northeast3' });
  await job.getQueryResults();
  
  console.log('Sync complete! Team/Department data updated.');
}

main().catch(console.error);
