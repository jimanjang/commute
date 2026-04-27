import { NextResponse } from "next/server";
import pool from "@/lib/mysql";

export async function GET() {
  try {
    // 1. Get Triggers
    const [triggers]: any = await pool.query(
      "SELECT * FROM t_secom_trigger ORDER BY created_at DESC"
    );

    // 2. Get Targets for all triggers
    const [targets]: any = await pool.query("SELECT trigger_id, sabun FROM t_secom_trigger_target");
    
    // 3. Map targets to triggers
    const targetMap = new Map();
    for (const t of targets) {
      if (!targetMap.has(t.trigger_id)) targetMap.set(t.trigger_id, []);
      targetMap.get(t.trigger_id).push(t.sabun);
    }

    const result = triggers.map((tg: any) => ({
      ...tg,
      targets: targetMap.get(tg.id) || []
    }));

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[Triggers] GET Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, function_name, event_source, time_type, time_value, is_active, targets, days_of_week } = body;

    let triggerId = id;

    if (id) {
      // Update Trigger
      await pool.query(
        "UPDATE t_secom_trigger SET function_name = ?, event_source = ?, time_type = ?, time_value = ?, is_active = ?, days_of_week = ? WHERE id = ?",
        [function_name, event_source, time_type, time_value, is_active, days_of_week || '1,2,3,4,5', id]
      );
      // Delete old targets
      await pool.query("DELETE FROM t_secom_trigger_target WHERE trigger_id = ?", [id]);
    } else {
      // Create Trigger
      const [res]: any = await pool.query(
        "INSERT INTO t_secom_trigger (function_name, event_source, time_type, time_value, is_active, days_of_week) VALUES (?, ?, ?, ?, ?, ?)",
        [function_name, event_source || 'TIME_DRIVEN', time_type || 'DAY_TIMER', time_value, is_active ?? true, days_of_week || '1,2,3,4,5']
      );
      triggerId = res.insertId;
    }

    // Insert Targets
    if (targets && Array.isArray(targets) && targets.length > 0) {
      const values = targets.map((sabun: string) => [triggerId, sabun]);
      await pool.query(
        "INSERT INTO t_secom_trigger_target (trigger_id, sabun) VALUES ?",
        [values]
      );
    }

    return NextResponse.json({ success: true, id: triggerId });
  } catch (err: any) {
    console.error("[Triggers] POST Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    await pool.query("DELETE FROM t_secom_trigger WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Triggers] DELETE Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
