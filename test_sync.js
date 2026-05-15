const { getBigQueryClient } = require('./dist/lib/bigquery-oauth');
const pool = require('./dist/lib/mysql').default;

async function testSync() {
  try {
    const bigquery = await getBigQueryClient();
    
    const query = `
      SELECT 
        ts.date, 
        u.email, 
        ts.sheet_type, 
        tssti.description as sheet_type_description
      FROM \`karrotmarket.db_karrot_cs_kr.time_sheets\` ts
      JOIN \`karrotmarket.db_karrot_cs_kr.admin_users\` u ON ts.admin_user_id = u.id
      LEFT JOIN \`karrotmarket.team_operation.utility_time_sheets_sheet_type\` tssti ON ts.sheet_type = tssti.sheet_type
      WHERE ts.date >= CURRENT_DATE('+09:00') 
        AND ts.date <= DATE_ADD(CURRENT_DATE('+09:00'), INTERVAL 1 DAY)
    `;

    console.log('Querying BigQuery...');
    const [rows] = await bigquery.query({ query });
    console.log(`Found ${rows.length} rows.`);

    if (rows.length > 0) {
      console.log('Clearing old data...');
      await pool.query("DELETE FROM t_secom_schedule WHERE date >= CURRENT_DATE() AND date <= DATE_ADD(CURRENT_DATE(), INTERVAL 1 DAY)");
      
      console.log('Inserting new data...');
      const values = rows.map(r => [r.email, r.date.value, r.sheet_type, r.sheet_type_description]);
      await pool.query("INSERT INTO t_secom_schedule (email, date, sheet_type, sheet_type_description) VALUES ?", [values]);
    }

    console.log('✅ Sync completed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

testSync();
