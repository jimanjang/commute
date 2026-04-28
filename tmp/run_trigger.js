const http = require('http');
const data = JSON.stringify({ id: 4 });
const options = {
  hostname: 'localhost', port: 3000,
  path: '/api/admin/bot/triggers/run',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
};
const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => { console.log('Status:', res.statusCode); console.log('Body:', body); });
});
req.write(data);
req.end();
