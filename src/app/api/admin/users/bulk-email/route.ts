import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/**
 * Bulk updates user emails in the t_secom_person table.
 * Receives an array of { sabun, name, email }.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { updates } = await request.json(); // Array of { sabun, name, email }

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: "Invalid updates format. Expected an array." }, { status: 400 });
    }

    const pool = (await import("@/lib/mysql")).default;
    const connection = await pool.getConnection();

    let successCount = 0;
    let failCount = 0;

    try {
      await connection.beginTransaction();

      for (const update of updates) {
        const { sabun, name, email } = update;
        if (!email) continue;

        let query = "";
        let params = [];

        if (sabun) {
          query = "UPDATE t_secom_person SET Email = ? WHERE Sabun = ?";
          params = [email, sabun];
        } else if (name) {
          query = "UPDATE t_secom_person SET Email = ? WHERE Name = ?";
          params = [email, name];
        } else {
          failCount++;
          continue;
        }

        const [result]: any = await connection.query(query, params);
        if (result.affectedRows > 0) {
          successCount++;
        } else {
          failCount++;
        }
      }

      await connection.commit();
    } catch (innerError) {
      await connection.rollback();
      throw innerError;
    } finally {
      connection.release();
    }

    return NextResponse.json({ 
      success: true, 
      message: `Bulk update finished. Success: ${successCount}, Fail: ${failCount}` 
    });
  } catch (error: any) {
    console.error("[API] Bulk Update Email Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
