import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { AIDataBridge } from "@/lib/ai-bridge/data-access";

/**
 * AI Bridge API for ADK Agents - Financial Data Access
 * This endpoint provides structured access to financial and cost data for AI agents
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("timeRange") || "30"; // days
    const includeBreakdown = searchParams.get("includeBreakdown") === "true";

    // Use the data bridge for safe access
    const financialData = await AIDataBridge.getFinancialSummary(userId);

    if (!financialData.success) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch financial data" },
        { status: 500 }
      );
    }

    const activities = financialData.data || [];
    const timeRangeMs = parseInt(timeRange) * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - timeRangeMs);

    // Filter activities by time range
    const recentActivities = activities.filter(
      (activity: { createdAt: Date }) =>
        new Date(activity.createdAt) > cutoffDate
    );

    // Calculate financial metrics
    const metrics = calculateFinancialMetrics(recentActivities);

    const formattedData = {
      success: true,
      data: {
        summary: metrics,
        timeRange: `${timeRange} days`,
        totalActivities: recentActivities.length,
        ...(includeBreakdown && {
          breakdown: {
            byType: getBreakdownByType(recentActivities),
            byCrop: getBreakdownByCrop(recentActivities),
            daily: getDailyBreakdown(recentActivities, parseInt(timeRange)),
            trends: calculateTrends(activities, parseInt(timeRange)),
          },
        }),
        recentActivities: recentActivities.slice(0, 20), // Latest 20 for context
      },
      timestamp: new Date().toISOString(),
      source: "ai-bridge-financial",
    };

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("AI Bridge Financial API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for AI agents to request financial analysis and recommendations
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      analysisType,
      timeRange,
      targetMetrics,
    }: { analysisType: string; timeRange: number; targetMetrics: any } =
      await request.json();

    const financialData = await AIDataBridge.getFinancialSummary(userId);

    if (!financialData.success) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch financial data" },
        { status: 500 }
      );
    }

    const activities = financialData.data || [];
    const timeRangeMs = (timeRange || 30) * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - timeRangeMs);
    const recentActivities = activities.filter(
      (activity: { createdAt: Date }) =>
        new Date(activity.createdAt) > cutoffDate
    );

    let analysisResult;
    switch (analysisType) {
      case "cost_optimization":
        analysisResult = performCostOptimizationAnalysis(recentActivities);
        break;
      case "budget_forecast":
        analysisResult = performBudgetForecast(activities, timeRange);
        break;
      case "roi_analysis":
        analysisResult = performROIAnalysis(recentActivities);
        break;
      case "expense_patterns":
        analysisResult = performExpensePatternAnalysis(recentActivities);
        break;
      default:
        analysisResult = performGeneralFinancialAnalysis(recentActivities);
    }

    return NextResponse.json({
      success: true,
      data: {
        analysis: analysisResult,
        summary: calculateFinancialMetrics(recentActivities),
        recommendations: generateFinancialRecommendations(
          recentActivities,
          analysisType
        ),
        timeRange: `${timeRange || 30} days`,
        totalActivities: recentActivities.length,
      },
      timestamp: new Date().toISOString(),
      source: "ai-bridge-financial-analysis",
    });
  } catch (error) {
    console.error("AI Bridge Financial Analysis error:", error);
    return NextResponse.json(
      { success: false, error: "Financial analysis failed" },
      { status: 500 }
    );
  }
}

// Financial calculation functions
function calculateFinancialMetrics(
  activities: { cost?: number; type: string }[]
) {
  const totalCost = activities.reduce(
    (sum, activity) => sum + (activity.cost || 0),
    0
  );
  const activityCount = activities.length;
  const averageCost = activityCount > 0 ? totalCost / activityCount : 0;

  const costsByType = activities.reduce(
    (acc: Record<string, number>, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + (activity.cost || 0);
      return acc;
    },
    {}
  );

  const highestCostType = Object.entries(costsByType).sort(
    ([, a], [, b]) => b - a
  )[0];

  return {
    totalCost: Math.round(totalCost * 100) / 100,
    averageCost: Math.round(averageCost * 100) / 100,
    activityCount,
    costsByType,
    highestCostType: highestCostType
      ? {
          type: highestCostType[0],
          amount: Math.round(highestCostType[1] * 100) / 100,
          percentage: Math.round((highestCostType[1] / totalCost) * 100),
        }
      : null,
    costEfficiency: calculateCostEfficiencyRating(totalCost, activityCount),
  };
}

function getBreakdownByType(activities: any[]) {
  return activities.reduce((acc: any, activity) => {
    if (!acc[activity.type]) {
      acc[activity.type] = {
        count: 0,
        totalCost: 0,
        averageCost: 0,
      };
    }
    acc[activity.type].count += 1;
    acc[activity.type].totalCost += activity.cost || 0;
    acc[activity.type].averageCost =
      acc[activity.type].totalCost / acc[activity.type].count;
    return acc;
  }, {});
}

function getBreakdownByCrop(activities: any[]) {
  return activities.reduce((acc: any, activity) => {
    const cropName = activity.crop?.name || "Unknown";
    if (!acc[cropName]) {
      acc[cropName] = {
        count: 0,
        totalCost: 0,
        activities: [],
      };
    }
    acc[cropName].count += 1;
    acc[cropName].totalCost += activity.cost || 0;
    acc[cropName].activities.push(activity.type);
    return acc;
  }, {});
}

function getDailyBreakdown(activities: any[], timeRange: number) {
  const dailyData: any = {};
  const endDate = new Date();

  for (let i = 0; i < timeRange; i++) {
    const date = new Date(endDate.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = date.toISOString().split("T")[0];
    dailyData[dateKey] = { cost: 0, count: 0 };
  }

  activities.forEach((activity) => {
    const dateKey = new Date(activity.createdAt).toISOString().split("T")[0];
    if (dailyData[dateKey]) {
      dailyData[dateKey].cost += activity.cost || 0;
      dailyData[dateKey].count += 1;
    }
  });

  return Object.entries(dailyData)
    .map(([date, data]: any) => ({
      date,
      cost: Math.round(data.cost * 100) / 100,
      count: data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function calculateTrends(allActivities: any[], recentDays: number) {
  const cutoffDate = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000);
  const previousCutoffDate = new Date(
    Date.now() - recentDays * 2 * 24 * 60 * 60 * 1000
  );

  const recentActivities = allActivities.filter(
    (a) => new Date(a.createdAt) > cutoffDate
  );
  const previousActivities = allActivities.filter(
    (a) =>
      new Date(a.createdAt) > previousCutoffDate &&
      new Date(a.createdAt) <= cutoffDate
  );

  const recentCost = recentActivities.reduce(
    (sum, a) => sum + (a.cost || 0),
    0
  );
  const previousCost = previousActivities.reduce(
    (sum, a) => sum + (a.cost || 0),
    0
  );

  const costTrend =
    previousCost > 0 ? ((recentCost - previousCost) / previousCost) * 100 : 0;
  const activityTrend =
    previousActivities.length > 0
      ? ((recentActivities.length - previousActivities.length) /
          previousActivities.length) *
        100
      : 0;

  return {
    costTrend: Math.round(costTrend * 100) / 100,
    activityTrend: Math.round(activityTrend * 100) / 100,
    trendDirection:
      costTrend > 0 ? "increasing" : costTrend < 0 ? "decreasing" : "stable",
  };
}

// Analysis functions
function performCostOptimizationAnalysis(activities: any[]) {
  const costsByType = getBreakdownByType(activities);
  const optimizations: any[] = [];

  Object.entries(costsByType).forEach(([type, data]: any) => {
    if (data.averageCost > 100) {
      optimizations.push({
        activityType: type,
        currentAverageCost: data.averageCost,
        recommendedReduction: Math.round(data.averageCost * 0.2), // 20% reduction target
        potentialSavings: Math.round(data.totalCost * 0.2),
        suggestions: getCostReductionSuggestions(type),
      });
    }
  });

  return {
    optimizationOpportunities: optimizations,
    totalPotentialSavings: optimizations.reduce(
      (sum, opt) => sum + opt.potentialSavings,
      0
    ),
    highestImpact: optimizations.sort(
      (a, b) => b.potentialSavings - a.potentialSavings
    )[0],
  };
}

function performBudgetForecast(
  allActivities: { createdAt: string | number | Date; cost?: number }[],
  timeRange: number
) {
  const recentCosts = allActivities
    .filter(
      (a) =>
        new Date(a.createdAt) >
        new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000)
    )
    .reduce((sum, a) => sum + (a.cost || 0), 0);

  const dailyAverage = recentCosts / timeRange;
  const monthlyForecast = dailyAverage * 30;
  const yearlyForecast = dailyAverage * 365;

  return {
    dailyAverage: Math.round(dailyAverage * 100) / 100,
    monthlyForecast: Math.round(monthlyForecast * 100) / 100,
    yearlyForecast: Math.round(yearlyForecast * 100) / 100,
    basedOnDays: timeRange,
    seasonalAdjustment: calculateSeasonalAdjustment(),
    confidenceLevel: Math.min(90, Math.max(50, timeRange * 2)), // Higher confidence with more data
  };
}

function performROIAnalysis(activities: any[]) {
  // Simplified ROI calculation based on harvest vs costs
  const costs = activities
    .filter((a) => a.type !== "HARVEST")
    .reduce((sum, a) => sum + (a.cost || 0), 0);
  const harvests = activities.filter((a) => a.type === "HARVEST");

  // Estimate revenue from harvests (simplified)
  const estimatedRevenue = harvests.length * 200; // $200 average per harvest record

  const roi = costs > 0 ? ((estimatedRevenue - costs) / costs) * 100 : 0;

  return {
    totalCosts: Math.round(costs * 100) / 100,
    estimatedRevenue: estimatedRevenue,
    netProfit: Math.round((estimatedRevenue - costs) * 100) / 100,
    roiPercentage: Math.round(roi * 100) / 100,
    profitMargin:
      estimatedRevenue > 0
        ? Math.round(((estimatedRevenue - costs) / estimatedRevenue) * 100)
        : 0,
    breakEvenPoint: costs / (estimatedRevenue / (harvests.length || 1)),
  };
}

function performExpensePatternAnalysis(activities: any[]) {
  const patterns = {
    peakSpendingDays: findPeakSpendingDays(activities),
    regularExpenses: identifyRegularExpenses(activities),
    seasonalPatterns: identifySeasonalPatterns(activities),
    unusualExpenses: identifyUnusualExpenses(activities),
  };

  return patterns;
}

function performGeneralFinancialAnalysis(
  activities: {
    cost?: number;
    type: string;
    createdAt: string | number | Date;
  }[]
) {
  const metrics = calculateFinancialMetrics(activities);
  const trends = calculateTrends(activities, 30);

  return {
    overview: metrics,
    trends,
    insights: [
      `Total expenses: $${metrics.totalCost}`,
      `Average cost per activity: $${metrics.averageCost}`,
      `Highest expense category: ${metrics.highestCostType?.type || "N/A"}`,
      `Cost trend: ${trends.trendDirection}`,
    ],
  };
}

// Helper functions
function getCostReductionSuggestions(activityType: string): string[] {
  const suggestions: any = {
    FERTILIZER: [
      "Consider bulk purchasing",
      "Explore organic alternatives",
      "Test soil before applying",
    ],
    IRRIGATION: [
      "Upgrade to drip irrigation",
      "Install moisture sensors",
      "Schedule during off-peak hours",
    ],
    PEST_CONTROL: [
      "Implement IPM strategies",
      "Use beneficial insects",
      "Regular monitoring to catch early",
    ],
  };

  return (
    suggestions[activityType] || [
      "Review supplier contracts",
      "Consider alternative methods",
      "Monitor usage patterns",
    ]
  );
}

function calculateCostEfficiencyRating(
  totalCost: number,
  activityCount: number
): string {
  const avgCost = totalCost / (activityCount || 1);

  if (avgCost < 50) return "Excellent";
  if (avgCost < 100) return "Good";
  if (avgCost < 200) return "Fair";
  return "Needs Improvement";
}

function calculateSeasonalAdjustment(): number {
  const currentMonth = new Date().getMonth();
  // Higher costs in spring/summer growing season
  if (currentMonth >= 3 && currentMonth <= 8) return 1.2;
  return 0.8;
}

function findPeakSpendingDays(activities: any[]): string[] {
  const dailyTotals = getDailyBreakdown(activities, 30);
  return dailyTotals
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 3)
    .map((day) => day.date);
}

function identifyRegularExpenses(
  activities: { type: string }[]
): { type: string; frequency: number }[] {
  const typeFrequency = activities.reduce(
    (acc: Record<string, number>, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    },
    {}
  );

  return Object.entries(typeFrequency)
    .filter(([, count]) => count >= 3)
    .map(([type, count]) => ({ type, frequency: count }));
}

function identifySeasonalPatterns(
  activities: { createdAt: string | number | Date; cost?: number }[]
): string {
  const monthlyBreakdown = activities.reduce(
    (acc: Record<number, number>, activity) => {
      const month = new Date(activity.createdAt).getMonth();
      acc[month] = (acc[month] || 0) + (activity.cost || 0);
      return acc;
    },
    {}
  );

  const highestMonth = Object.entries(monthlyBreakdown).sort(
    ([, a], [, b]) => b - a
  )[0];

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return highestMonth
    ? `Highest spending in ${monthNames[parseInt(highestMonth[0])]}`
    : "No clear seasonal pattern";
}

function identifyUnusualExpenses(
  activities: {
    cost?: number;
    createdAt: Date;
    type: string;
    crop?: { name: string };
  }[]
): {
  date: Date;
  type: string;
  cost: number;
  cropName: string | undefined;
  unusualFactor: number;
}[] {
  const avgCost =
    activities.reduce((sum, a) => sum + (a.cost || 0), 0) /
    (activities.length || 1);
  const threshold = avgCost * 3;

  return activities
    .filter((activity) => (activity.cost || 0) > threshold)
    .map((activity) => ({
      date: activity.createdAt,
      type: activity.type,
      cost: activity.cost || 0,
      cropName: activity.crop?.name,
      unusualFactor: Math.round(((activity.cost || 0) / avgCost) * 10) / 10,
    }));
}

function generateFinancialRecommendations(
  activities: {
    cost?: number;
    type: string;
    createdAt: string | number | Date;
  }[],
  analysisType: string
): string[] {
  const recommendations = [];
  const metrics = calculateFinancialMetrics(activities);

  if (metrics.totalCost > 1000) {
    recommendations.push(
      "Consider implementing cost tracking by crop to identify the most expensive operations"
    );
  }

  if (metrics.averageCost > 150) {
    recommendations.push(
      "Review high-cost activities for potential optimization opportunities"
    );
  }

  if (analysisType === "cost_optimization") {
    recommendations.push(
      "Focus on the three highest-cost activity types for immediate savings"
    );
    recommendations.push("Set up monthly budget alerts for expense categories");
  }

  if (activities.length < 5) {
    recommendations.push(
      "Increase activity logging frequency for better financial insights"
    );
  }

  return recommendations;
}
