import { NextResponse } from "next/server";
import { sendSlackBotNotification } from "@/lib/slack";

/**
 * Manually trigger a 9:55 AM Reminder for testing.
 * Targets a specific email.
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email || !email.endsWith("@daangnservice.com")) {
      return NextResponse.json({ error: "회사 도메인 이메일을 입력해주세요." }, { status: 400 });
    }

    await sendSlackBotNotification(email, 'reminder');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Bot] Remind Missing API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
