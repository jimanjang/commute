const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = "C:\\(주)에스원\\세콤매니저(근태·식당) v9.0.1\\DB\\WorkManager.DB";

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error("Failed to open SQLite database:", err.message);
    process.exit(1);
  }
  console.log("Successfully connected to WorkManager.DB!");
});

db.serialize(() => {
  // Get all table names
  db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return;
    }
    console.log("\n=== Tables in WorkManager.DB ===");
    console.log(rows.map(r => r.name).join(', '));
    
    // Look for tables containing 'ERP', 'Link', 'Query', 'Schedule', 'Time', 'Send'
    const interestingTables = rows
      .map(r => r.name)
      .filter(name => /erp|link|query|schedule|time|send/i.test(name));
      
    console.log("\n=== Interesting Tables ===");
    console.log(interestingTables);
    
    // If there is an ERP or SecomLink related table, dump its schema and content
    if (rows.some(r => r.name === 't_SecomLinkQuery')) {
      queryTable('t_SecomLinkQuery');
    }
    if (rows.some(r => r.name === 't_SecomLinkOption')) {
      queryTable('t_SecomLinkOption');
    }
    if (rows.some(r => r.name === 't_ErpSetting')) {
      queryTable('t_ErpSetting');
    }
    if (rows.some(r => r.name === 't_Scheduler')) {
      queryTable('t_Scheduler');
    }
    
    // Fallback: search for schemas of tables that look interesting
    interestingTables.forEach(tbl => {
      queryTable(tbl);
    });
  });
});

function queryTable(tableName) {
  db.all(`PRAGMA table_info(${tableName})`, [], (err, columns) => {
    if (err) {
      console.error(`Error reading schema for ${tableName}:`, err.message);
      return;
    }
    console.log(`\n--- Schema of ${tableName} ---`);
    console.table(columns.map(c => ({ Column: c.name, Type: c.type })));
    
    db.all(`SELECT * FROM ${tableName} LIMIT 10`, [], (err, rows) => {
      if (err) {
        console.error(`Error querying ${tableName}:`, err.message);
        return;
      }
      console.log(`--- Content of ${tableName} (max 10 rows) ---`);
      console.log(rows);
    });
  });
}
