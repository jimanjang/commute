const mysql = require('mysql2/promise');
const { BigQuery } = require('@google-cloud/bigquery');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

const CLIENT_ID = '32555940559.apps.googleusercontent.com';
const CLIENT_SECRET = 'ZmssLNjJy2998hD4CTg2ejr2';

async function getBigQueryClient() {
  const tokenPath = path.join(__dirname, '..', 'token.json');
  const tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET);
  oauth2Client.setCredentials(tokens);
  return new BigQuery({
    projectId: 'karrotmarket',
    authClient: oauth2Client
  });
}

async function main() {
  const pool = mysql.createPool({
    host: '172.17.3.206',
    user: 'secom',
    password: 'secom123',
    database: 'secom'
  });

  try {
    const dbDateParam = "20260518";
    const bigquery = await getBigQueryClient();

    const rosterQuery = `SELECT Name as name, Sabun as sabun, Team as team, WorkGroup as workGroup FROM \`secom-data.secom.person\` WHERE Name IS NOT NULL AND Name != '' AND WorkGroup IN ('002', '006', '007')`;
    const [rosterRows] = await bigquery.query({ query: rosterQuery, location: 'asia-northeast3' });

    const heather = rosterRows.find(u => u.name.includes("Heather") || u.sabun === "KS2512012");
    console.log("Heather in roster rows:", heather);

    const [mysqlWorkRows] = await pool.query("SELECT Name, Sabun, WSTime, bLate FROM t_secom_workhistory WHERE WorkDate = ?", [dbDateParam]);
    const [mysqlAlarmRows] = await pool.query(
      `SELECT p.Sabun, p.Name, MIN(a.ATime) AS ATime
       FROM t_secom_alarm a
       INNER JOIN t_secom_person p ON a.CardNo = p.CardNo
       WHERE a.ATime LIKE ?
       GROUP BY p.Sabun, p.Name`,
      [`${dbDateParam}%`]
    );

    const workMap = new Map();
    mysqlWorkRows.forEach((w) => {
      if (w.Sabun) workMap.set(w.Sabun.trim(), w);
      if (w.Name) workMap.set(w.Name.trim(), w);
    });

    const alarmMap = new Map();
    mysqlAlarmRows.forEach((a) => {
      if (a.Sabun) alarmMap.set(a.Sabun.trim(), a);
      if (a.Name) alarmMap.set(a.Name.trim(), a);
    });

    const heatherSabun = heather.sabun?.trim();
    const heatherName = heather.name?.trim();
    
    console.log("heatherSabun:", JSON.stringify(heatherSabun));
    console.log("heatherName:", JSON.stringify(heatherName));

    console.log("workMap.get(heatherSabun):", workMap.get(heatherSabun));
    console.log("workMap.get(heatherName):", workMap.get(heatherName));

    console.log("alarmMap.get(heatherSabun):", alarmMap.get(heatherSabun));
    console.log("alarmMap.get(heatherName):", alarmMap.get(heatherName));

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

main();
