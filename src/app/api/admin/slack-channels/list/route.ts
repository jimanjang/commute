import { NextResponse } from "next/server";
import { WebClient } from "@slack/web-api";

// GET: Slack 워크스페이스의 기존 채널 목록 조회 (드롭다운용)
export async function GET() {
  try {
    const client = new WebClient(process.env.SLACK_TOKEN);
    const allChannels: any[] = [];
    let cursor: string | undefined;

    do {
      const res = await client.conversations.list({
        exclude_archived: true,
        types: "public_channel,private_channel",
        limit: 200,
        cursor,
      });

      const channels = (res.channels as any[]) || [];
      allChannels.push(...channels);
      cursor = (res.response_metadata as any)?.next_cursor || undefined;
    } while (cursor);

    // 필요한 정보만 추려서 반환
    const result = allChannels
      .map((c) => ({
        id: c.id,
        name: c.name,
        is_private: c.is_private,
        num_members: c.num_members,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(result);
  } catch (e: any) {
    console.error("[Slack Channels List]", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
