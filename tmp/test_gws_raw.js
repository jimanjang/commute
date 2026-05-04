const { google } = require('googleapis');
require('dotenv').config({ path: 'C:/Users/당근서비스/.antigravity/sass-admin/.env.local' });

function normalizePrivateKey(key) {
  if (!key) return undefined;
  return key.replace(/\\n/g, "\n");
}

function getGwsAuth(scopes, subject) {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY),
    scopes,
    subject,
  });
}

async function test() {
  try {
    const adminEmail = process.env.GOOGLE_ADMIN_EMAIL;
    const auth = getGwsAuth(
      ["https://www.googleapis.com/auth/admin.directory.user.readonly"],
      adminEmail
    );
    const admin = google.admin({ version: "directory_v1", auth: auth });

    const res = await admin.users.list({
      customer: "my_customer",
      projection: "full",
      maxResults: 10,
    });

    const users = res.data.users || [];
    console.log("Found", users.length, "users.");
    for (const u of users) {
      if (u.primaryEmail.includes("laika") || u.primaryEmail.includes("aiden")) {
         console.log("Email:", u.primaryEmail);
         console.log("Organizations:", JSON.stringify(u.organizations, null, 2));
      }
    }
  } catch (e) {
    console.error(e.message);
  }
}
test();
