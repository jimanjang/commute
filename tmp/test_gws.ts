import { config } from 'dotenv';
config({ path: 'C:/Users/당근서비스/.antigravity/sass-admin/.env.local' });
import { getGwsUsersBySabun } from '../src/lib/gws-team';

async function main() {
  const res = await getGwsUsersBySabun();
  console.log('Size:', res.size);
  console.log('Sample:', Array.from(res.entries()).slice(0, 5));
}
main().catch(console.error);
