import { NextResponse } from "next/server";
import { sendSlackBotNotification } from "@/lib/slack";

export async function POST(request: Request) {
  try {
    const { users } = await request.json(); // Array of { name, sabun, email }

    if (!users || !Array.isArray(users)) {
      return NextResponse.json({ error: "Invalid user list" }, { status: 400 });
    }

    const results = {
      success: [] as string[],
      failed: [] as string[]
    };

    for (const user of users) {
      if (!user.email) {
        results.failed.push(`${user.name} (No Email)`);
        continue;
      }

      try {
        await sendSlackBotNotification(user.email, 'reminder');
        results.success.push(user.name);
      } catch (err: any) {
        console.error(`Failed to notify ${user.name}:`, err.message);
        results.failed.push(`${user.name} (${err.message})`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      results 
    });

  } catch (error: any) {
    console.error("[SendReminder] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
