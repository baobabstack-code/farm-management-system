import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { FinancialAnalyticsService } from "@/lib/services/financial-analytics";

/**
 * Enhanced Financial Analytics API
 * Provides comprehensive financial insights with AI-powered analysis
 */
export async function POST() {
  try {
    // Check if financial insights feature is enabled
    if (!isFeatureEnabled("aiFinancialInsights")) {
      return NextResponse.json(
        { error: "Financial insights feature is not enabled" },
        { status: 403 }
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get comprehensive financial insights
    const result = await FinancialAnalyticsService.getFinancialInsights(userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to generate financial insights" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      insights: result.data,
      timestamp: new Date().toISOString(),
      source: "financial-analytics-ai",
    });
  } catch (error) {
    console.error("Financial insights API error:", error);
    return NextResponse.json(
      { error: "Failed to process financial insights request" },
      { status: 500 }
    );
  }
}
