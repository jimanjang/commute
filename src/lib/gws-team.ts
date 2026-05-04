import { google } from "googleapis";

function normalizePrivateKey(key?: string) {
  if (!key) return undefined;
  return key.replace(/\\n/g, "\n");
}

function getGwsAuth(scopes: string[], subject: string) {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY),
    scopes,
    subject,
  });
}

export interface GwsUserInfo {
  email: string;        // primaryEmail
  team: string | null;  // organizations[].department (customType: 'work')
  sabun: string | null; // organizations[].costCenter (세콤 사번)
}

let _cache: Map<string, GwsUserInfo> | null = null;
let _cacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5분 캐시

/**
 * GWS 전체 사용자 조회 (다중 키 기반 Map 반환)
 * Key: email (e.g. kaya.choi@daangnservice.com), firstName (e.g. kaya), costCenter
 * Value: { email, team, sabun }
 *
 * 성능을 위해 5분간 인메모리 캐싱을 적용합니다.
 */
export async function getGwsUserMap(): Promise<Map<string, GwsUserInfo>> {
  const now = Date.now();
  if (_cache && now - _cacheTime < CACHE_TTL_MS) {
    return _cache;
  }

  const result = new Map<string, GwsUserInfo>();

  try {
    const adminEmail = process.env.GOOGLE_ADMIN_EMAIL;
    if (!adminEmail) return result;

    const auth = getGwsAuth(
      ["https://www.googleapis.com/auth/admin.directory.user.readonly"],
      adminEmail
    );
    const admin = google.admin({ version: "directory_v1", auth: auth as any });

    let pageToken: string | undefined;

    do {
      const res: any = await admin.users.list({
        customer: "my_customer",
        projection: "full",
        maxResults: 500,
        pageToken,
      });

      const users = res.data.users || [];
      for (const u of users) {
        const email = u.primaryEmail;
        if (!email) continue;

        const orgs = u.organizations;
        if (!orgs || orgs.length === 0) continue;

        const workOrg = orgs.find((o: any) => o.customType === "work") || orgs[0];
        const team = (workOrg as any)?.department || null;
        const sabun = (workOrg as any)?.costCenter || null;

        const info: GwsUserInfo = { email, team, sabun };

        // Key by full email
        result.set(email.toLowerCase(), info);

        // Key by firstName (e.g., kaya.choi@... -> kaya)
        const firstName = email.split('@')[0].split('.')[0].toLowerCase();
        if (firstName) {
          result.set(firstName, info);
        }

        // Key by costCenter(sabun)
        if (sabun) {
          result.set(sabun, info);
        }
      }

      pageToken = res.data.nextPageToken || undefined;
    } while (pageToken);

    _cache = result;
    _cacheTime = now;
    console.log(`[GWS] Loaded ${result.size} users with sabun mapping`);

  } catch (e: any) {
    console.warn("[GWS] getGwsUserMap failed:", e.message);
  }

  return result;
}

/**
 * 이메일 배열 기준으로 팀 정보 Map 반환 (하위 호환용)
 * Key: email (lowercase)
 */
export async function getTeamsByEmails(emails: string[]): Promise<Map<string, string>> {
  const emailResult = new Map<string, string>();
  const gwsMap = await getGwsUserMap();

  for (const info of gwsMap.values()) {
    if (emails.includes(info.email) && info.team) {
      emailResult.set(info.email.toLowerCase(), info.team);
    }
  }

  return emailResult;
}

/**
 * 단일 이메일로 팀 조회 (개별 확인용)
 */
export async function getTeamByEmail(email: string): Promise<string | null> {
  const map = await getTeamsByEmails([email]);
  return map.get(email.toLowerCase()) || null;
}
