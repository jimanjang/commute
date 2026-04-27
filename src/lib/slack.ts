import { WebClient } from "@slack/web-api";

const token = process.env.SLACK_TOKEN;
const client = new WebClient(token);

export async function sendSlackDMByEmail(email: string, message: string) {
  try {
    if (process.env.DRY_RUN === 'true') {
      console.log(`\x1b[33m[DRY RUN]\x1b[0m Would send DM to ${email}: ${message.replace(/\n/g, ' ')}`);
      return { success: true, dryRun: true };
    }

    if (!token) {
      throw new Error("SLACK_TOKEN is not configured in .env.local");
    }

    // 1. Find User ID by Email
    const result = await client.users.lookupByEmail({ email });
    const userId = result.user?.id;

    if (!userId) {
      throw new Error(`Slack user not found for email: ${email}`);
    }

    // 2. Prepare Message (Replace {{mention}} if present)
    const finalMessage = message.includes('{{mention}}')
      ? message.replace('{{mention}}', `<@${userId}>`)
      : message;

    // 3. Send Message to the User's DM channel
    const response = await client.chat.postMessage({
      channel: userId,
      text: finalMessage,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: finalMessage
          }
        }
      ]
    });

    return { success: true, ts: response.ts };
  } catch (error: any) {
    console.error("[Slack] Failed to send DM:", error.message);
    throw error;
  }
}

export async function sendSlackBotNotification(email: string, type: 'checkin' | 'reminder', data?: any) {
  let message = '';
  if (type === 'checkin') {
    let timeDisplay = data?.time || '-';
    // Format YYYYMMDDHHmmss to MM-DD HH:mm
    if (timeDisplay && timeDisplay.length >= 12 && /^\d+$/.test(timeDisplay)) {
      const mm = timeDisplay.substring(4, 6);
      const dd = timeDisplay.substring(6, 8);
      const hh = timeDisplay.substring(8, 10);
      const min = timeDisplay.substring(10, 12);
      timeDisplay = `${mm}-${dd} ${hh}:${min}`;
    }
    message = `✅ *출근 확인 완료*\n안녕하세요! 오늘 출근 기록이 정상적으로 등록되었어요.\n• *출근 시간:* ${timeDisplay}\n오늘도 즐거운 하루 되세요! 🥕`;
  } else if (type === 'reminder') {
    message = `{{mention}} 안녕하세요! 아직 출근 기록이 확인되지 않아 연락드려요.\n혹시 지문을 찍으셨는데 기록이 누락되었다면 #people에 말씀해주세요!\n건강한 근태 문화를 위해 힘써주셔서 감사해요. :sparkles:`;
  }

  return sendSlackDMByEmail(email, message);
}

