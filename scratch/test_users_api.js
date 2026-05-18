const http = require('http');

const PORT = process.env.PORT || 3005;
const USERS_URL = `http://localhost:${PORT}/api/users?date=2026-05-18`;

console.log(`Fetching Users list from ${USERS_URL}...`);

http.get(USERS_URL, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const obj = JSON.parse(data);
      console.log(`Total users: ${obj.users?.length}`);
      const withTeams = obj.users?.filter(u => u.team);
      console.log(`Users with team populated: ${withTeams?.length}`);
      console.log("Samples with team:");
      console.log(withTeams?.slice(0, 5).map(u => ({ name: u.name, email: u.email, team: u.team })));
    } catch (e) {
      console.error("Parse error:", e, data);
    }
  });
}).on('error', (err) => {
  console.error(`Error: ${err.message}`);
});
