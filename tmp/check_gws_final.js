require('dotenv').config({ path: 'C:/Users/당근서비스/.antigravity/sass-admin/.env.local' });
const { google } = require('C:/Users/당근서비스/.antigravity/sass-admin/node_modules/googleapis');

function normalizePrivateKey(key) {
  if (!key) return undefined;
  return key.replace(/\\n/g, '\n');
}

async function main() {
  const adminEmail = process.env.GOOGLE_ADMIN_EMAIL;
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY),
    scopes: ['https://www.googleapis.com/auth/admin.directory.user.readonly'],
    subject: adminEmail,
  });

  const admin = google.admin({ version: 'directory_v1', auth });

  // Laika 사용자 - projection: full로 customSchemas 포함해서 조회
  console.log('=== Laika 사용자 Custom Schema 조회 ===');
  const res = await admin.users.get({
    userKey: adminEmail,
    projection: 'full',
  });
  const u = res.data;
  console.log('Name:', u.name?.fullName);
  console.log('OrgUnitPath:', u.orgUnitPath);
  console.log('Organizations:', JSON.stringify(u.organizations, null, 2));
  console.log('Custom Schemas:', JSON.stringify(u.customSchemas, null, 2));
  console.log('\n--- 전체 필드 목록 ---');
  console.log(Object.keys(u).join(', '));
}

main().catch(e => console.error('Error:', e.message));
