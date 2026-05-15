const { getGwsUserMap } = require('./src/lib/gws-team');
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

async function test() {
  console.log('Fetching GWS User Map...');
  const gwsMap = await getGwsUserMap();
  
  const sampleUsers = Array.from(gwsMap.values()).slice(0, 5);
  console.log('Sample GWS Users found:');
  sampleUsers.forEach(u => {
    console.log(`Email: ${u.email}, Team: "${u.team}", Sabun: "${u.sabun}"`);
  });

  // Specifically check for one of the users in the screenshot if possible
  // Aiden(에이든) -> aiden.kim@daangnservice.com
  const aiden = gwsMap.get('aiden.kim@daangnservice.com');
  if (aiden) {
    console.log('\nTarget User (Aiden):');
    console.log(`Email: ${aiden.email}, Team: "${aiden.team}", Sabun: "${aiden.sabun}"`);
  } else {
    console.log('\nAiden not found by email.');
  }
}

test().catch(console.error);
