const pool = require('./src/lib/mysql.ts').default;

async function migrate() {
  try {
    await pool.query('ALTER TABLE t_secom_workhistory ADD COLUMN ModifyReason VARCHAR(255) AFTER ModifyTime');
    console.log('Successfully added ModifyReason column');
  } catch (err) {
    if (err.code === 'ER_DUP_COLUMN_NAME') {
      console.log('Column already exists');
    } else {
      console.error('Migration failed:', err);
    }
  } finally {
    process.exit(0);
  }
}

migrate();
