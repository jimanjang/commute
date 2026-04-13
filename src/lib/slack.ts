import { WebClient } from "@slack/web-api";

const token = process.env.SLACK_TOKEN;
const client = new WebClient(token);

export async function sendSlackDMByEmail(email: string, message: string) {
  try {
    if (!token) {
      throw new Error("SLACK_TOKEN is not configured in .env.local");
    }

    // 1. Find User ID by Email
    const result = await client.users.lookupByEmail({ email });
    const userId = result.user?.id;

    if (!userId) {
      throw new Error(`Slack user not found for email: ${email}`);
    }

    // 2. Send Message to the User's DM channel
    const response = await client.chat.postMessage({
      channel: userId,
      text: message,
      // You can also use blocks for rich formatting
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: message
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
