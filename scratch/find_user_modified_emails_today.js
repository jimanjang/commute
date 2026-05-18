const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: '172.17.3.206',
    user: 'secom',
    password: 'secom123',
    database: 'secom',
    port: 3306
  });

  try {
    console.log("=== Finding users whose email in t_secom_trigger_log today differs from current t_secom_person ===");
    
    const [personRows] = await pool.query("SELECT Name, Sabun, Email FROM t_secom_person");
    const personMap = new Map(personRows.map(p => [p.Sabun || p.Name, p]));

    const [todayLogs] = await pool.query(
      `SELECT DISTINCT sabun, name, email FROM t_secom_trigger_log 
       WHERE DATE(created_at) = '2026-05-18'`
    );

    const modifiedToday = [];

    for (const log of todayLogs) {
      const key = log.sabun || log.name;
      const current = personMap.get(key);
      if (current) {
        const logEmail = log.email?.toLowerCase().trim();
        const currentEmail = current.Email?.toLowerCase().trim();
        if (logEmail && currentEmail && logEmail !== currentEmail) {
          modifiedToday.push({
            name: log.name,
            sabun: log.sabun,
            oldEmailInLog: logEmail,
            newEmailInPerson: currentEmail
          });
        }
      }
    }

    console.log(`\nFound ${modifiedToday.length} users updated by you today (where log email differs from current DB email):`);
    console.log(JSON.stringify(modifiedToday, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
    process.exit();
  }
}

main();
