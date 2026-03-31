const {BigQuery} = require('@google-cloud/bigquery');
const bq = new BigQuery({ keyFilename: 'service-account.json' });

async function test() {
  const pQuery = 'SELECT Name, Sabun, CardNo FROM `secom-data.secom.person` WHERE Name != "미등록사용자" LIMIT 5';
  const tQuery = 'SELECT Name, Sabun, CardNo, WSTime FROM `secom-data.secom.workhistory_today` LIMIT 5';
  
  try {
    const [pRows] = await bq.query(pQuery);
    const [tRows] = await bq.query(tQuery);
    
    console.log('Person Sample:', JSON.stringify(pRows, null, 2));
    console.log('Today History Sample:', JSON.stringify(tRows, null, 2));
    
    // Check if WSTime values are actually present
    const checkInCount = await bq.query('SELECT COUNT(*) as c FROM `secom-data.secom.workhistory_today` WHERE WSTime IS NOT NULL AND WSTime != ""');
    console.log('Total check-ins in workhistory_today:', checkInCount[0][0].c);
    
    // Check if Name has "Marcel(마르셀)" format in both
    const nameCheck = await bq.query('SELECT Name FROM `secom-data.secom.workhistory_today` WHERE Name LIKE "%(%" LIMIT 3');
    console.log('Names with brackets in history:', JSON.stringify(nameCheck[0], null, 2));
    
  } catch (e) {
    console.error('Error:', e.message);
  }
}
test();
