import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import pool from "@/lib/mysql";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).isAdmin) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    if (!startDateParam || !endDateParam) {
      return new Response("startDate and endDate parameters are required", { status: 400 });
    }

    const startFormatted = startDateParam.replace(/-/g, '');
    const endFormatted = endDateParam.replace(/-/g, '');

    // MySQL의 t_secom_workhistory 테이블은 실시간 동기화로 오늘 데이터도 포함합니다.
    const [rows]: any = await pool.query(
      `SELECT * FROM t_secom_workhistory WHERE WorkDate >= ? AND WorkDate <= ?`,
      [startFormatted, endFormatted]
    );

    if (!rows || rows.length === 0) {
      return new Response("No data found for the selected date", { status: 404 });
    }

    // Extract headers from the first row
    const headers = Object.keys(rows[0]);
    
    // Create CSV content
    const csvRows = [];
    csvRows.push(headers.join(',')); // Header row
    
    for (const row of rows) {
      const values = headers.map(header => {
        const val = row[header];
        // Escape quotes and enclose in quotes if contains comma
        if (val === null || val === undefined) return '';
        const strVal = String(val);
        if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
          return `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
      });
      csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    
    // UTF-8 BOM for Excel compatibility
    const bom = '\uFEFF';
    const csvContent = bom + csvString;

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="workhistory_${startFormatted}_to_${endFormatted}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("CSV Download Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// Force recompile to clear Next.js cache
