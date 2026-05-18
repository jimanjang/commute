const http = require('http');

const PORT = process.env.PORT || 3005;
const SYNC_URL = `http://localhost:${PORT}/api/admin/users/sync`;

console.log(`Triggering GWS Sync at ${SYNC_URL}...`);

http.get(SYNC_URL, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Response: ${data}`);
  });
}).on('error', (err) => {
  console.error(`Error: ${err.message}`);
});
