const { BigQuery } = require('@google-cloud/bigquery');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');
const mysql = require('mysql2/promise');

async function run() {
  const tokens = JSON.parse(fs.readFileSync('token.json', 'utf8'));
  const oauth2Client = new OAuth2Client('32555940559.apps.googleusercontent.com', 'ZmssLNjJy2998hD4CTg2ejr2');
  oauth2Client.setCredentials(tokens);
  const bq = new BigQuery({ projectId: 'karrotmarket', authClient: oauth2Client });
  const pool = mysql.createPool({ host: "172.17.3.206", user: "secom", password: "secom123", database: "secom" });

  try {
    // 1. Get Secom Names
    const [bqRows] = await bq.query({ 
      query: "SELECT Name FROM `secom-data.secom.person` WHERE WorkGroup IN ('002', '006', '007')",
      location: 'asia-northeast3'
    });
    const secomNames = bqRows.map(r => r.Name);

    // 2. Get Bridge Emails
    const [personRows] = await pool.execute("SELECT Name, Email FROM t_secom_person");
    const nameToEmail = new Map();
    personRows.forEach(p => nameToEmail.set(p.Name, p.Email));

    console.log(`Total Secom Persons: ${secomNames.length}`);
    const missingEmails = secomNames.filter(name => !nameToEmail.has(name) || !nameToEmail.get(name));
    console.log(`Persons without Email: ${missingEmails.length}`);
    console.log("Samples without Email:", missingEmails.slice(0, 10));

  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
