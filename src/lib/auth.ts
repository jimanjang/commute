import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { google } from "googleapis";
import path from "path";
import fs from "fs";

/**
 * Checks if a user email has Super Admin privileges in Google Workspace.
 * Uses service-account.json with domain-wide delegation (DWD).
 */
async function isSuperAdmin(email: string): Promise<boolean> {
  const adminEmail = process.env.GOOGLE_ADMIN_EMAIL;
  const keyFilePath = path.join(process.cwd(), "service-account.json");

  if (!fs.existsSync(keyFilePath)) {
    console.warn(`[Auth] service-account.json not found at ${keyFilePath}. Falling back to domain check.`);
    return email.endsWith("@daangnservice.com");
  }

  if (!adminEmail) {
    console.warn("[Auth] GOOGLE_ADMIN_EMAIL missing in env. Falling back to domain check.");
    return email.endsWith("@daangnservice.com"); 
  }

  try {
    // Load key from file manually to be safe with JWT constructor signatures
    const keyData = JSON.parse(fs.readFileSync(keyFilePath, "utf8"));
    
    const auth = new google.auth.JWT({
      email: keyData.client_email,
      key: keyData.private_key,
      scopes: [
        "https://www.googleapis.com/auth/admin.directory.user.readonly",
        "https://www.googleapis.com/auth/admin.directory.group.readonly"
      ],
      subject: adminEmail,
    });


    const admin = google.admin({ version: "directory_v1", auth });
    
    // 1. Check Super Admin
    const res = await admin.users.get({ userKey: email });
    const isAdmin = res.data.isAdmin || false;
    
    if (isAdmin) {
      console.log(`[Auth] Admin check success: ${email} -> isAdmin: true`);
      return true;
    }

    // 2. Check Group Membership
    try {
      const groupRes = await admin.members.hasMember({
        groupKey: "attendance-management@daangnservice.com",
        memberKey: email
      });
      if (groupRes.data.isMember) {
        console.log(`[Auth] Admin check success: ${email} is in attendance-management group.`);
        return true;
      }
    } catch (groupError: any) {
      console.warn(`[Auth] Group check failed for ${email}:`, groupError.message);
    }
    
    return false;
  } catch (error: any) {
    console.error(`[Auth] Admin check failed for ${email}:`, error.message);
    
    // Safety fallback for corporate domain while setting up DWD
    if (email.endsWith("@daangnservice.com")) {
      console.warn(`[Auth] Admin check API failed but domain matches. Allowing access for ${email}.`);
      return true;
    }
    return false;
  }
}


export const authOptions: NextAuthOptions = {

  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user?.email) return false;
      try {
        const isAdmin = await isSuperAdmin(user.email);
        if (!isAdmin) {
          console.warn(`[Auth] Access Denied: ${user.email} is not a Super Admin.`);
          return "/auth/signin?error=AccessDenied";
        }
        return true;
      } catch (error) {
        console.error("[Auth] Sign-in check failed:", error);
        return false;
      }
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).isAdmin = token.isAdmin;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.isAdmin = await isSuperAdmin(user.email!);
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
};
