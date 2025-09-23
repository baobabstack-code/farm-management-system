import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { AIDataBridge } from "@/lib/ai-bridge/data-access";

export async function POST(request: NextRequest) {
  try {
    // Check if AI analytics is enabled
    if (!isFeatureEnabled("aiAnalytics")) {
      return NextResponse.json(
        { error: "AI analytics feature is not enabled" },
        { status: 403 }
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { request: aiRequest } = await request.json();
    console.log("AI request:", aiRequest); // Log for debugging

    // Get data using the bridge (no disruption to existing system)
    const cropData = await AIDataBridge.getCropData(userId);
    const financialData = await AIDataBridge.getFinancialSummary(userId);

    if (!cropData.success || !financialData.success) {
      return NextResponse.json(
        { error: "Failed to fetch farm data" },
        { status: 500 }
      );
    }

    // Simple AI insights generation (can be replaced with actual ADK agent call)
    const insights = generateSimpleInsights(
      cropData.data || [],
      financialData.data || []
    );

    return NextResponse.json({
      success: true,
      insights,
      timestamp: new Date().toISOString(),
      source: "ai-analytics-beta",
    });
  } catch (error) {
    console.error("AI Analytics API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function generateSimpleInsights(crops: any[], activities: any[]) {
  const insights = [];

  // Crop diversity insight
  if (crops.length > 0) {
    const cropTypes = new Set(crops.map((crop: any) => crop.name));
    if (cropTypes.size === 1) {
      insights.push({
        title: "Consider Crop Diversification",
        description: `You're currently growing only ${Array.from(cropTypes)[0]}. Diversifying crops can reduce risk and improve soil health.`,
        confidence: 0.8,
        actionable: true,
      });
    }
  }

  // Activity frequency insight
  if (activities.length > 0) {
    const recentActivities = activities.filter(
      (activity: any) =>
        new Date(activity.createdAt) >
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    if (recentActivities.length < 5) {
      insights.push({
        title: "Low Activity Recording",
        description:
          "You've recorded fewer than 5 activities in the past month. Regular tracking helps optimize farm management.",
        confidence: 0.9,
        actionable: true,
      });
    }
  }

  // Cost analysis insight
  if (activities.length > 10) {
    const costs = activities
      .map((a: any) => a.cost || 0)
      .filter((cost: number) => cost > 0);
    if (costs.length > 0) {
      const avgCost = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
      const highCostActivities = costs.filter(
        (cost: number) => cost > avgCost * 2
      );

      if (highCostActivities.length > 0) {
        insights.push({
          title: "High-Cost Activities Detected",
          description: `${highCostActivities.length} activities had costs significantly above average. Review these for potential savings.`,
          confidence: 0.7,
          actionable: true,
        });
      }
    }
  }

  // Default insight if no specific patterns found
  if (insights.length === 0) {
    insights.push({
      title: "Farm Data Analysis Complete",
      description:
        "Your farm operations appear to be well-managed. Continue monitoring for optimization opportunities.",
      confidence: 0.6,
      actionable: false,
    });
  }

  return insights;
}
