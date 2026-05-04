require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');

async function main() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const adminEmail = process.env.GOOGLE_ADMIN_EMAIL;

  console.log(`Service Account: ${clientEmail}`);
  console.log(`Admin Email: ${adminEmail}`);

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [
      'https://www.googleapis.com/auth/admin.directory.user.readonly',
      'https://www.googleapis.com/auth/admin.directory.userschema.readonly',
    ],
    subject: adminEmail, // Domain-wide delegation
  });

  const admin = google.admin({ version: 'directory_v1', auth });

  // 1. 사용자 스키마(Custom Attributes) 목록 확인
  console.log('\n=== [1] Google Workspace Custom User Schema 목록 ===');
  try {
    const domain = adminEmail.split('@')[1];
    const schemaRes = await admin.schemas.list({ customerId: 'my_customer' });
    const schemas = schemaRes.data.schemas || [];
    if (schemas.length === 0) {
      console.log('  ❌ 커스텀 스키마 없음');
    } else {
      schemas.forEach(s => {
        console.log(`\n  Schema: ${s.schemaName} (${s.displayName})`);
        (s.fields || []).forEach(f => {
          console.log(`    - ${f.fieldName} (${f.fieldType}) displayName: "${f.displayName}"`);
        });
      });
    }
  } catch (e) {
    console.error('  ❌ Schema 조회 실패:', e.message);
  }

  // 2. Laika 사용자의 전체 정보 (custom attributes 포함)
  console.log('\n=== [2] Laika 사용자 Custom Attributes 확인 ===');
  try {
    const userRes = await admin.users.get({
      userKey: 'laika@daangnservice.com',
      projection: 'full', // custom attributes 포함
    });
    const user = userRes.data;
    console.log(`  Name: ${user.name?.fullName}`);
    console.log(`  Org Unit: ${user.orgUnitPath}`);
    console.log(`  Organizations:`, JSON.stringify(user.organizations, null, 2));
    console.log(`  Custom Schemas:`, JSON.stringify(user.customSchemas, null, 2));
    console.log(`  Custom Attributes (externalIds, relations etc.):`, JSON.stringify({
      externalIds: user.externalIds,
      relations: user.relations,
      locations: user.locations,
    }, null, 2));
  } catch (e) {
    console.error('  ❌ User 조회 실패:', e.message);
  }
}

main().catch(console.error);
