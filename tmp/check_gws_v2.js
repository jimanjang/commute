// sass-admin 프로젝트의 서비스 계정 설정을 그대로 사용
require('dotenv').config({ path: 'C:/Users/당근서비스/.antigravity/sass-admin/.env.local' });
const { google } = require('googleapis');

function normalizePrivateKey(key) {
  if (!key) return undefined;
  return key.replace(/\\n/g, '\n');
}

async function getGoogleAuth(scopes, subject) {
  return new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    undefined,
    normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY),
    scopes,
    subject
  );
}

async function main() {
  const adminEmail = process.env.GOOGLE_ADMIN_EMAIL;
  console.log(`Admin: ${adminEmail}`);
  console.log(`Service Account: ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}`);

  const auth = await getGoogleAuth(
    ['https://www.googleapis.com/auth/admin.directory.user.readonly',
     'https://www.googleapis.com/auth/admin.directory.userschema.readonly'],
    adminEmail
  );
  const admin = google.admin({ version: 'directory_v1', auth });

  // 1. 커스텀 스키마 목록 확인
  console.log('\n=== [1] Custom User Schemas ===');
  try {
    const res = await admin.schemas.list({ customerId: 'my_customer' });
    const schemas = res.data.schemas || [];
    if (schemas.length === 0) {
      console.log('  ❌ 커스텀 스키마 없음');
    } else {
      schemas.forEach(s => {
        console.log(`\n  Schema: ${s.schemaName} (${s.displayName})`);
        (s.fields || []).forEach(f => {
          console.log(`    - fieldName: "${f.fieldName}", displayName: "${f.displayName}", type: ${f.fieldType}`);
        });
      });
    }
  } catch (e) {
    console.error('  ❌ Schema 조회 실패:', e.message);
  }

  // 2. Laika 사용자 전체 정보 (customSchemas 포함)
  console.log('\n=== [2] Laika 사용자 Custom Schema 값 확인 ===');
  try {
    const res = await admin.users.get({
      userKey: adminEmail, // laika@daangnservice.com
      projection: 'full',
    });
    const u = res.data;
    console.log(`  Name: ${u.name?.fullName}`);
    console.log(`  OrgUnitPath: ${u.orgUnitPath}`);
    console.log(`  Organizations: ${JSON.stringify(u.organizations)}`);
    console.log(`  Custom Schemas: ${JSON.stringify(u.customSchemas, null, 2)}`);
  } catch (e) {
    console.error('  ❌ User 조회 실패:', e.message);
  }
}

main().catch(console.error);
