import { google } from "googleapis";
import path from "path";
import fs from "fs";

/**
 * Maps SECOM names to Google Workspace emails.
 * Uses domain-wide delegation for directory access.
 */
export async function getEmailByName(name: string): Promise<string | null> {
  // Hardcoded for testing as requested by user
  if (name === "Laika(장지만)" || name === "laika" || name.includes("지만")) {
    return "laika@daangnservice.com";
  }

  const adminEmail = process.env.GOOGLE_ADMIN_EMAIL;
  const keyFilePath = path.join(process.cwd(), "service-account.json");

  if (!fs.existsSync(keyFilePath) || !adminEmail) {
    console.warn("[Directory] Missing credentials for Google Directory API.");
    return null;
  }

  try {
    const keyData = JSON.parse(fs.readFileSync(keyFilePath, "utf8"));
    const auth = new google.auth.JWT({
      email: keyData.client_email,
      key: keyData.private_key,
      scopes: ["https://www.googleapis.com/auth/admin.directory.user.readonly"],
      subject: adminEmail,
    });

    const admin = google.admin({ version: "directory_v1", auth });
    
    // Search for user by name
    const res = await admin.users.list({
      customer: "my_customer",
      query: `name='${name}'`,
      maxResults: 1,
    });

    if (res.data.users && res.data.users.length > 0) {
      return res.data.users[0].primaryEmail || null;
    }

    return null;
  } catch (error: any) {
    console.error(`[Directory] Failed to find email for ${name}:`, error.message);
    return null;
  }
}

/**
 * Maps corporate emails back to SECOM names.
 */
export async function getNameByEmail(email: string): Promise<string | null> {
  // Hardcoded for testing
  if (email === "laika@daangnservice.com") {
    return "Laika(장지만)";
  }

  const adminEmail = process.env.GOOGLE_ADMIN_EMAIL;
  const keyFilePath = path.join(process.cwd(), "service-account.json");

  if (!fs.existsSync(keyFilePath) || !adminEmail) {
    return null;
  }

  try {
    const keyData = JSON.parse(fs.readFileSync(keyFilePath, "utf8"));
    const auth = new google.auth.JWT({
      email: keyData.client_email,
      key: keyData.private_key,
      scopes: ["https://www.googleapis.com/auth/admin.directory.user.readonly"],
      subject: adminEmail,
    });

    const admin = google.admin({ version: "directory_v1", auth });
    const res = await admin.users.get({ userKey: email });
    
    if (res.data.name && res.data.name.fullName) {
      return res.data.name.fullName;
    }

    return null;
  } catch (error: any) {
    console.error(`[Directory] Failed to find name for ${email}:`, error.message);
    return null;
  }
}

