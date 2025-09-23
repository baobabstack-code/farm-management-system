import { NextResponse } from "next/server";
import { testDatabaseConnection } from "@/lib/db/connection";

export async function GET() {
  try {
    const dbConnected = await testDatabaseConnection();

    return NextResponse.json({
      success: true,
      status: "healthy",
      database: dbConnected ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        success: false,
        status: "unhealthy",
        error: "Health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
