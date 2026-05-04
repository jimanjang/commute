require('dotenv').config({ path: 'C:/Users/당근서비스/.antigravity/sass-admin/.env.local' });

// sass-admin 쪽의 googleapis 패키지를 직접 사용
const { google } = require('C:/Users/당근서비스/.antigravity/sass-admin/node_modules/googleapis');

function normalizePrivateKey(key) {
  if (!key) return undefined;
  // Handle both \\n (escaped) and actual newlines
  return key.replace(/\\n/g, '\n').replace(/\n\n/g, '\n');
}

async function main() {
  const adminEmail = process.env.GOOGLE_ADMIN_EMAIL;
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY);

  console.log(`Admin: ${adminEmail}`);
  console.log(`SA: ${serviceAccountEmail}`);
  console.log(`Private Key starts with: ${privateKey?.substring(0, 40)}...`);

  const auth = new google.auth.JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: [
      'https://www.googleapis.com/auth/admin.directory.user.readonly',
      'https://www.googleapis.com/auth/admin.directory.userschema.readonly',
    ],
    subject: adminEmail,
  });

  // Test auth
  try {
    const token = await auth.getAccessToken();
    console.log(`\n✅ Auth Success! Token starts with: ${token.token?.substring(0, 20)}...`);
  } catch (e) {
    console.error(`\n❌ Auth Failed: ${e.message}`);
    return;
  }

  const admin = google.admin({ version: 'directory_v1', auth });

  // 1. 커스텀 스키마 목록
  console.log('\n=== [1] Custom User Schemas ===');
  try {
    const res = await admin.schemas.list({ customerId: 'my_customer' });
    const schemas = res.data.schemas || [];
    if (schemas.length === 0) {
      console.log('  ❌ 커스텀 스키마 없음');
    } else {
      schemas.forEach(s => {
        console.log(`  Schema: "${s.schemaName}" (${s.displayName})`);
        (s.fields || []).forEach(f => {
          console.log(`    - fieldName: "${f.fieldName}", displayName: "${f.displayName}"`);
        });
      });
    }
  } catch (e) {
    console.error('  ❌ Schema 조회 실패:', e.message);
  }

  // 2. Laika 사용자 정보
  console.log('\n=== [2] Laika 사용자 상세 (projection=full) ===');
  try {
    const res = await admin.users.get({
      userKey: adminEmail,
      projection: 'full',
    });
    const u = res.data;
    console.log(`  Name: ${u.name?.fullName}`);
    console.log(`  OrgUnitPath: ${u.orgUnitPath}`);
    console.log(`  Organizations: ${JSON.stringify(u.organizations)}`);
    console.log(`  CustomSchemas: ${JSON.stringify(u.customSchemas, null, 2)}`);
  } catch (e) {
    console.error('  ❌ User 조회 실패:', e.message);
  }
}

main().catch(console.error);
