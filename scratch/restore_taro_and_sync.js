const { BigQuery } = require('@google-cloud/bigquery');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function getKarrotmarketBq() {
  const tokenPath = path.join(process.cwd(), 'token.json');
  if (!fs.existsSync(tokenPath)) {
    throw new Error('token.json not found!');
  }
  const tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const oauth2Client = new OAuth2Client(
    '32555940559.apps.googleusercontent.com',
    'ZmssLNjJy2998hD4CTg2ejr2'
  );
  oauth2Client.setCredentials(tokens);
  return new BigQuery({ projectId: 'karrotmarket', authClient: oauth2Client });
}

async function getSecomDataBq() {
  const keyPath = path.join(process.cwd(), 'service-account.json');
  if (!fs.existsSync(keyPath)) {
    throw new Error('service-account.json not found!');
  }
  return new BigQuery({ projectId: 'secom-data', keyFilename: keyPath });
}

async function main() {
  console.log('--- 1. MySQL: Restoring Taro\'s WCTime in t_secom_workhistory ---');
  const pool = mysql.createPool({
    host: '172.17.3.206', user: 'secom', password: 'secom123', database: 'secom',
    waitForConnections: true, connectionLimit: 1
  });
  
  let rows = [];
  try {
    // A. Update Taro's record
    const [res] = await pool.query(
      "UPDATE t_secom_workhistory SET WCTime = '20260518141535', bWC = 1 WHERE Sabun = 'KS2203002' AND WorkDate = '20260518'"
    );
    console.log(`✅ MySQL: Updated Taro's record (${res.affectedRows} row)!`);
    
    // B. Query the updated rows for BQ load
    const [mysqlRows] = await pool.query("SELECT * FROM t_secom_workhistory WHERE WorkDate = '20260518'");
    rows = mysqlRows;
    console.log(`✅ MySQL: Queried ${rows.length} rows to upload!`);
  } catch (err) {
    console.error('❌ MySQL Operation Error:', err.message);
    await pool.end();
    return;
  } finally {
    await pool.end();
  }

  if (rows.length === 0) {
    console.log('⚠️ No rows to upload to BigQuery!');
    return;
  }

  // Convert columns to strings (matching pandas_gbq.to_gbq astype(str) which turns null into 'None')
  const formattedRows = rows.map(r => {
    const formatted = {};
    for (const key of Object.keys(r)) {
      const val = r[key];
      if (val === null || val === undefined) {
        formatted[key] = 'None';
      } else if (val instanceof Date) {
        // Format date to local KST string
        const kst = new Date(val.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
        const yyyy = kst.getFullYear();
        const mm = String(kst.getMonth() + 1).padStart(2, '0');
        const dd = String(kst.getDate()).padStart(2, '0');
        const hh = String(kst.getHours()).padStart(2, '0');
        const min = String(kst.getMinutes()).padStart(2, '0');
        const ss = String(kst.getSeconds()).padStart(2, '0');
        formatted[key] = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
      } else {
        formatted[key] = String(val);
      }
    }
    return formatted;
  });

  // Create newline delimited JSON
  const ndJson = formattedRows.map(r => JSON.stringify(r)).join('\n');
  const tempFilePath = path.join(process.cwd(), 'scratch', 'temp_bq_upload.json');
  fs.writeFileSync(tempFilePath, ndJson);
  console.log(`✅ Created NDJSON temp file at ${tempFilePath}`);

  console.log('\n--- 2. BigQuery: Uploading restored records via Load Truncate Job ---');
  try {
    const kmBq = await getKarrotmarketBq();
    const sdBq = await getSecomDataBq();

    const loadMetadata = {
      sourceFormat: 'NEWLINE_DELIMITED_JSON',
      writeDisposition: 'WRITE_TRUNCATE',
    };

    // A. Load to secom-data.secom.workhistory_today (location: asia-northeast3)
    console.log('Uploading to secom-data.secom.workhistory_today...');
    const sdTable = sdBq.dataset('secom').table('workhistory_today');
    const [sdJob] = await sdTable.load(tempFilePath, {
      ...loadMetadata,
      location: 'asia-northeast3'
    });
    console.log(`Job status: ${sdJob.status?.state || 'DONE'}`);
    console.log('✅ secom-data.secom.workhistory_today replaced successfully!');

    // B. Load to karrotmarket.team_operation.karrotservice_workhistory_today (location: US)
    console.log('Uploading to karrotmarket.team_operation.karrotservice_workhistory_today...');
    const kmTable = kmBq.dataset('team_operation').table('karrotservice_workhistory_today');
    const [kmJob] = await kmTable.load(tempFilePath, {
      ...loadMetadata,
      location: 'US'
    });
    console.log(`Job status: ${kmJob.status?.state || 'DONE'}`);
    console.log('✅ karrotmarket.team_operation.karrotservice_workhistory_today replaced successfully!');

  } catch (err) {
    console.error('❌ BQ Load Job Error:', err.stack || err.message);
  } finally {
    // Cleanup temp file
    try {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (e) {}
  }
}

main();
