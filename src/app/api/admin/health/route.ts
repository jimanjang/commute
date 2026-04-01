import { NextResponse } from "next/server";
import pool from "@/lib/mysql";
import { BigQuery } from "@google-cloud/bigquery";
import path from "path";

export async function GET() {
  const result: any = {
    mysql: false,
    bigquery: false,
    lastSync: null
  };

  try {
    // 1. MySQL Health Check
    const [rows]: any = await pool.query("SELECT 1 as health");
    if (rows && rows[0].health === 1) {
      result.mysql = true;
    }
  } catch (err: any) {
    console.error("MySQL health check error:", err);
    result.mysqlError = err.code || "UNKNOWN";
  }

  try {
    // 2. BigQuery Health Check
    const keyFilename = path.join(process.cwd(), "service-account.json");
    const bigquery = new BigQuery({ keyFilename });
    
    // Check latest sync time in workhistory
    const [bqRows]: any = await bigquery.query({
      query: `SELECT InsertTime FROM \`secom-data.secom.workhistory\` ORDER BY InsertTime DESC LIMIT 1`
    });
    
    if (bqRows && bqRows.length > 0) {
      result.bigquery = true;
      result.lastSync = bqRows[0].InsertTime;
    }

  } catch (err) {
    console.error("Health check error:", err);
  }

  return NextResponse.json(result);
}
