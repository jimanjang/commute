import { NextResponse } from "next/server";
import pool from "@/lib/mysql";

// GET: 팀→채널 매핑 전체 조회
export async function GET() {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM t_secom_slack_channel ORDER BY team_name ASC"
    );
    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: 팀→채널 매핑 추가 또는 수정 (upsert)
export async function POST(request: Request) {
  try {
    const { team_name, channel_id, channel_name } = await request.json();
    if (!team_name || !channel_id) {
      return NextResponse.json({ error: "team_name and channel_id are required" }, { status: 400 });
    }

    await pool.query(
      `INSERT INTO t_secom_slack_channel (team_name, channel_id, channel_name)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE channel_id = VALUES(channel_id), channel_name = VALUES(channel_name), updated_at = NOW()`,
      [team_name, channel_id, channel_name || null]
    );

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH: 활성화/비활성화 토글
export async function PATCH(request: Request) {
  try {
    const { id, is_active } = await request.json();
    await pool.query(
      "UPDATE t_secom_slack_channel SET is_active = ?, updated_at = NOW() WHERE id = ?",
      [is_active ? 1 : 0, id]
    );
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE: 매핑 삭제
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await pool.query("DELETE FROM t_secom_slack_channel WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
