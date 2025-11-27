import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/db/connection";
import { testSupabaseConnection } from "@/lib/supabase-client";

/**
 * GET /api/health/db
 *
 * Database health check endpoint
 * Tests both Prisma (direct PostgreSQL) and Supabase (REST API) connections
 */
export async function GET() {
  try {
    const startTime = Date.now();

    // Test Prisma connection
    const prismaHealth = await checkDatabaseHealth();
    const prismaLatency = Date.now() - startTime;

    // Test Supabase connection
    const supabaseStart = Date.now();
    const supabaseHealth = await testSupabaseConnection();
    const supabaseLatency = Date.now() - supabaseStart;

    const response = {
      prisma: {
        connected: prismaHealth.connected,
        latency: prismaLatency,
        error: prismaHealth.error,
      },
      supabase: {
        connected: supabaseHealth.success,
        latency: supabaseLatency,
        message: supabaseHealth.message,
      },
      timestamp: new Date().toISOString(),
    };

    // If either connection works, we're good
    if (prismaHealth.connected || supabaseHealth.success) {
      return NextResponse.json({
        success: true,
        status: "connected",
        ...response,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          status: "disconnected",
          ...response,
        },
        { status: 503 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
