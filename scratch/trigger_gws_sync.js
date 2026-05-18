const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function main() {
  try {
    console.log("Triggering GWS sync via local API...");
    // Let's call the API via fetch since our dev server is running on localhost:3005!
    const res = await fetch('http://localhost:3005/api/admin/users/sync');
    const json = await res.json();
    console.log("Sync response:", json);
  } catch (err) {
    console.error("Error triggering GWS sync:", err);
  } finally {
    process.exit();
  }
}

main();
