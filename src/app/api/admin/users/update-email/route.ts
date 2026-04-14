import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/**
 * Updates a single user's email in the t_secom_person table.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sabun, name, email } = await request.json();

    if (!sabun && !name) {
      return NextResponse.json({ error: "Sabun or Name is required for matching." }, { status: 400 });
    }

    const pool = (await import("@/lib/mysql")).default;
    
    // Update by Sabun (primary) or Name (fallback)
    let query = "";
    let params = [];

    if (sabun) {
      query = "UPDATE t_secom_person SET Email = ? WHERE Sabun = ?";
      params = [email, sabun];
    } else {
      query = "UPDATE t_secom_person SET Email = ? WHERE Name = ?";
      params = [email, name];
    }

    const [result]: any = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "User not found in SECOM database." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Email updated successfully." });
  } catch (error: any) {
    console.error("[API] Update Email Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
