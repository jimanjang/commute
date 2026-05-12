const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    host: '172.17.3.206',
    user: 'secom',
    password: 'secom123',
    database: 'secom',
  });

  try {
    const [personRows] = await pool.query("SELECT Name, Sabun, Email FROM t_secom_person");
    const personMap = new Map();
    
    // The actual logic from route.ts
    for (const p of personRows) {
      if (p.Sabun) personMap.set(p.Sabun, p);
      if (p.Name) personMap.set(p.Name, p);
    }

    const key = 'Emily(에밀리)';
    const mapped = personMap.get(key);
    
    console.log(`\n--- Production Logic Test for '${key}' ---`);
    console.log(`Result: `, mapped);
    console.log(`Valid Sabun Present?`, mapped && mapped.Sabun ? 'Yes' : 'No');
    console.log(`Valid Email Present?`, mapped && mapped.Email ? 'Yes' : 'No');

  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

run();
