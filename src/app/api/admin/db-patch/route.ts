import { NextResponse } from "next/server";
import pool from "@/lib/mysql";

export async function GET() {
  try {
    await pool.query("ALTER TABLE t_secom_trigger ADD COLUMN receivers TEXT NULL");
    return NextResponse.json({ success: true, message: "receivers column added successfully" });
  } catch (err: any) {
    if (err.message.includes("Duplicate column name")) {
      return NextResponse.json({ success: true, message: "Column already exists" });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
