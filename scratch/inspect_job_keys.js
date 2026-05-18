const { BigQuery } = require('@google-cloud/bigquery');
const fs = require('fs');
const path = require('path');

async function main() {
  const keyPath = path.join(process.cwd(), 'service-account.json');
  const bq = new BigQuery({ projectId: 'secom-data', keyFilename: keyPath });
  const table = bq.dataset('secom').table('workhistory_today');
  
  const tempFile = path.join(process.cwd(), 'scratch', 'temp_bq_upload.json');
  // Just write an empty array NDJSON for inspection
  fs.writeFileSync(tempFile, JSON.stringify({ WorkDate: '20260518', WSTime: '20260518092600', WCTime: 'None', bWC: '0' }) + '\n');
  
  const result = await table.load(tempFile, {
    sourceFormat: 'NEWLINE_DELIMITED_JSON',
    writeDisposition: 'WRITE_TRUNCATE',
    location: 'asia-northeast3'
  });
  
  console.log('Result type:', typeof result, Array.isArray(result));
  console.log('Result array length:', result.length);
  const job = result[0];
  console.log('Job prototype keys:', Object.getOwnPropertyNames(Object.getPrototypeOf(job)));
  console.log('Job instance keys:', Object.keys(job));
  
  // Cleanup
  fs.unlinkSync(tempFile);
}
main().catch(console.error);
