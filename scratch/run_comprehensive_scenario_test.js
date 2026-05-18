const { BigQuery } = require('@google-cloud/bigquery');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const http = require('http');

async function getSecomDataBq() {
  const keyPath = path.join(process.cwd(), 'service-account.json');
  if (!fs.existsSync(keyPath)) {
    throw new Error('service-account.json not found!');
  }
  return new BigQuery({ projectId: 'secom-data', keyFilename: keyPath });
}

function postRequest(url, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const postData = JSON.stringify(data);
    const options = {
      hostname: u.hostname,
      port: u.port || 80,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, error: body });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });
}

function formatDateForDb(val, isDateOnly = false) {
  if (!val) return null;
  // If it's already a string without T/Z, return as is
  if (typeof val === 'string' && !val.includes('T')) return val;
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  if (isDateOnly) return `${yyyy}-${mm}-${dd}`;
  
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

async function main() {
  console.log('=== 1. MySQL: Backing up today\'s real MySQL data ===');
  const pool = mysql.createPool({
    host: '172.17.3.206', user: 'secom', password: 'secom123', database: 'secom',
    waitForConnections: true, connectionLimit: 2
  });

  const todayStr = '2026-05-18';
  const dbDateParam = '20260518';
  const backupPath = path.join(process.cwd(), 'scratch', 'backup_today_data.json');

  let realSchedules = [];
  let realWorkHistory = [];

  try {
    const [sRows] = await pool.query("SELECT * FROM t_secom_schedule WHERE date = ?", [todayStr]);
    realSchedules = sRows;
    const [wRows] = await pool.query("SELECT * FROM t_secom_workhistory WHERE WorkDate = ?", [dbDateParam]);
    realWorkHistory = wRows;

    fs.writeFileSync(backupPath, JSON.stringify({ schedules: realSchedules, workHistory: realWorkHistory }, null, 2));
    console.log(`✅ Backed up today's data to ${backupPath}`);
    console.log(`   - Schedules count: ${realSchedules.length}`);
    console.log(`   - Work history count: ${realWorkHistory.length}`);
  } catch (err) {
    console.error('❌ Backup failed:', err.message);
    await pool.end();
    return;
  }

  console.log('\n=== 2. MySQL: Clearing today\'s data to set up mock scenario ===');
  try {
    await pool.query("DELETE FROM t_secom_schedule WHERE date = ?", [todayStr]);
    await pool.query("DELETE FROM t_secom_workhistory WHERE WorkDate = ?", [dbDateParam]);
    console.log('✅ MySQL tables cleared for today!');
  } catch (err) {
    console.error('❌ Clear failed:', err.message);
    await restoreData(pool, backupPath);
    await pool.end();
    return;
  }

  console.log('\n=== 3. BigQuery & Person: Querying Roster and setting up Mock Data ===');
  try {
    const sdBq = await getSecomDataBq();
    const rosterQuery = `
      SELECT Name as name, Sabun as sabun, Team as team, WorkGroup as workGroup 
      FROM \`secom-data.secom.person\` 
      WHERE Name IS NOT NULL AND Name != '' AND WorkGroup IN ('002', '006', '007')
    `;
    const [rosterRows] = await sdBq.query({ query: rosterQuery, location: 'asia-northeast3' });
    console.log(`✅ Fetched roster containing ${rosterRows.length} users from BigQuery.`);

    const [bridgeRows] = await pool.query("SELECT Name, Email, Sabun FROM t_secom_person WHERE Email IS NOT NULL AND Email != ''");
    const bridgeMap = new Map();
    bridgeRows.forEach(r => {
      if (r.Sabun) bridgeMap.set(r.Sabun.trim(), r.Email.trim());
      if (r.Name) bridgeMap.set(r.Name.trim(), r.Email.trim());
    });

    console.log('👉 Creating mock records for all users in the roster...');
    // We will distribute the 112 users deterministically
    // Scenario A: 출근 (60 users)
    // Scenario B: 지각 (15 users)
    // Scenario C: 미출근 (15 users)
    // Scenario D: 출근 전 (7 users)
    // Scenario E: 휴가 (10 users)
    // Scenario F: 휴무 (5 users)
    
    let scenarioCounts = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };

    for (let i = 0; i < rosterRows.length; i++) {
      const user = rosterRows[i];
      const name = user.name;
      const sabun = user.sabun ? user.sabun.trim() : `KS${String(i).padStart(7, '0')}`;
      const email = bridgeMap.get(sabun) || bridgeMap.get(name) || `${sabun.toLowerCase()}@daangnservice.com`;
      const team = user.team || '';

      let scenario = 'A';
      if (i < 60) {
        scenario = 'A';
      } else if (i < 75) {
        scenario = 'B';
      } else if (i < 90) {
        scenario = 'C';
      } else if (i < 97) {
        scenario = 'D';
      } else if (i < 107) {
        scenario = 'E';
      } else {
        scenario = 'F';
      }
      
      scenarioCounts[scenario]++;

      // 1. Insert schedule row
      let start_time = '09:00';
      let end_time = '18:00';
      let sheet_type_desc = '근무';
      
      if (scenario === 'D') {
        start_time = '11:00';
        end_time = '20:00';
      } else if (scenario === 'E') {
        sheet_type_desc = '연차휴가';
      } else if (scenario === 'F') {
        start_time = null;
        end_time = null;
        sheet_type_desc = '-';
      }

      await pool.query(
        `INSERT INTO t_secom_schedule (email, date, start_time, end_time, sheet_type, sheet_type_description)
         VALUES (?, ?, ?, ?, 4, ?)`,
        [email, todayStr, start_time, end_time, sheet_type_desc]
      );

      // 2. Insert workhistory row (Scenarios A and B have check-ins)
      if (scenario === 'A' || scenario === 'B') {
        const checkinTime = scenario === 'A' ? '20260518084500' : '20260518091500';
        const bLate = scenario === 'B' ? 1 : 0;
        
        await pool.query(
          `INSERT INTO t_secom_workhistory (
            WorkDate, CardNo, CardFullData, JuminNo, Name, Sabun,
            Company, Department, Team, Part, Grade, DetailGrade, WorkGroupCode, WorkGroupName,
            bWS, bWC, WSTime, WCTime, bLate, bAbsent, InsertTime
          ) VALUES (?, ?, ?, ?, ?, ?, '000', '007', '', '', '000', '000', '002', '근무', 1, 0, ?, NULL, ?, 0, ?)`,
          [
            dbDateParam, `CARD-${sabun}`, `FULL-${sabun}`, '123456-1234567', name, sabun,
            checkinTime, bLate, '20260518145200'
          ]
        );
      } else {
        // No checkin
        await pool.query(
          `INSERT INTO t_secom_workhistory (
            WorkDate, CardNo, CardFullData, JuminNo, Name, Sabun,
            Company, Department, Team, Part, Grade, DetailGrade, WorkGroupCode, WorkGroupName,
            bWS, bWC, WSTime, WCTime, bLate, bAbsent, InsertTime
          ) VALUES (?, ?, ?, ?, ?, ?, '000', '007', '', '', '000', '000', '002', '근무', 0, 0, NULL, NULL, 0, 0, ?)`,
          [
            dbDateParam, `CARD-${sabun}`, `FULL-${sabun}`, '123456-1234567', name, sabun,
            '20260518145200'
          ]
        );
      }
    }

    console.log('✅ Mock data populated successfully! Distribution:');
    console.log(`   - A (출근): ${scenarioCounts.A} users`);
    console.log(`   - B (지각): ${scenarioCounts.B} users`);
    console.log(`   - C (미출근): ${scenarioCounts.C} users`);
    console.log(`   - D (출근 전): ${scenarioCounts.D} users`);
    console.log(`   - E (휴가): ${scenarioCounts.E} users`);
    console.log(`   - F (휴무): ${scenarioCounts.F} users`);

  } catch (err) {
    console.error('❌ Mock data setup failed:', err.stack || err.message);
    await restoreData(pool, backupPath);
    await pool.end();
    return;
  }

  console.log('\n=== 4. Next.js API: Triggering Virtual Scenarios (Dry Run Mode) ===');
  try {
    const triggerIds = [7, 8, 11];
    for (const tid of triggerIds) {
      console.log(`\n👉 Running Trigger ID: ${tid}...`);
      const response = await postRequest('http://localhost:3005/api/admin/bot/triggers/run', { id: tid });
      console.log(`Status Code: ${response.statusCode}`);
      if (response.statusCode === 200) {
        const res = response.data;
        console.log('----------------- TRIGGER RESULT -----------------');
        console.log(`Type: ${res.type}`);
        console.log(`Targets: ${res.targets}`);
        console.log(`Sent count: ${res.sent}`);
        console.log(`Total targeted people: ${res.totalPeople}`);
        console.log(`Reference Time: ${res.refTime}`);
        console.log('Message Preview:');
        console.log(res.preview);
        console.log('--------------------------------------------------');
      } else {
        console.error('❌ Error response:', response.error || response.data);
      }
    }
  } catch (err) {
    console.error('❌ Trigger invocation failed:', err.message);
  }

  console.log('\n=== 5. MySQL: Restoring original data ===');
  await restoreData(pool, backupPath);
  await pool.end();
  console.log('\n🎉 Comprehensive Virtual Scenario Test completed successfully!');
}

async function restoreData(pool, backupPath) {
  try {
    if (!fs.existsSync(backupPath)) {
      console.warn('⚠️ Backup file not found. Skipping restore.');
      return;
    }
    const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    console.log('👉 Restoring original tables from backup...');

    // Clear today's tables first
    await pool.query("DELETE FROM t_secom_schedule WHERE date = '2026-05-18'");
    await pool.query("DELETE FROM t_secom_workhistory WHERE WorkDate = '20260518'");

    // Restore t_secom_schedule
    for (const r of data.schedules) {
      const cols = Object.keys(r);
      const vals = Object.values(r).map((v, i) => {
        if (cols[i] === 'date') return formatDateForDb(v, true);
        return v;
      });
      const marks = cols.map(() => '?').join(', ');
      await pool.query(
        `INSERT INTO t_secom_schedule (${cols.join(', ')}) VALUES (${marks})`,
        vals
      );
    }

    // Restore t_secom_workhistory
    for (const r of data.workHistory) {
      const cols = Object.keys(r);
      const vals = Object.values(r).map(v => {
        if (v instanceof Date || (typeof v === 'string' && v.includes('T'))) {
          return formatDateForDb(v, false);
        }
        return v;
      });
      const marks = cols.map(() => '?').join(', ');
      await pool.query(
        `INSERT INTO t_secom_workhistory (${cols.join(', ')}) VALUES (${marks})`,
        vals
      );
    }

    console.log('✅ Original MySQL tables restored perfectly!');
    // Delete temp backup file
    fs.unlinkSync(backupPath);
  } catch (e) {
    console.error('❌ Restore failed critically:', e.stack || e.message);
  }
}

main();
