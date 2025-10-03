import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { AIDataBridge } from "@/lib/ai-bridge/data-access";
import { createGoogleAIService } from "@/lib/ai/google-ai-service";

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

    // Try to get AI-enhanced insights from Google AI first
    let insights = null;
    const googleAI = createGoogleAIService();

    if (
      googleAI &&
      (process.env.AI_ADK_ENABLED === "true" || process.env.GOOGLE_AI_API_KEY)
    ) {
      try {
        const aiResult = await googleAI.generateInsights(
          {
            userId,
            crops: cropData.data || [],
            activities: financialData.data || [],
            weather: null, // Weather data not available in this context
          },
          "general"
        );

        if (aiResult.success) {
          // Parse AI response into insights format
          insights = parseAIInsights(
            aiResult.content,
            aiResult.model || "gemini-1.5-flash"
          );
        }
      } catch (error) {
        console.warn(
          "Google AI insights failed, falling back to rule-based:",
          error
        );
      }
    }

    // Fallback to rule-based insights if AI is not available
    if (!insights || insights.length === 0) {
      insights = generateAdvancedInsights(
        cropData.data || [],
        financialData.data || []
      );
    }

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

interface CropData {
  id: string;
  name: string;
  variety?: string | null;
  plantingDate: Date;
  expectedHarvestDate: Date;
  actualHarvestDate?: Date | null;
  status: string;
  area?: number | null;
  tasks?: any[];
  irrigationLogs?: any[];
  fertilizerLogs?: any[];
  pestDiseaseLogs?: any[];
  harvestLogs?: any[];
}

interface ActivityData {
  type: string;
  cost: number;
  createdAt: Date;
  crop: { name: string; id: string };
}

function generateAdvancedInsights(
  crops: CropData[],
  activities: ActivityData[]
) {
  const insights: any[] = [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 1. Crop Health and Status Analysis
  if (crops.length > 0) {
    const cropsByStatus = crops.reduce((acc: any, crop) => {
      acc[crop.status] = (acc[crop.status] || 0) + 1;
      return acc;
    }, {});

    const overdueCrops = crops.filter((crop) => {
      const harvestDate = new Date(crop.expectedHarvestDate);
      return (
        harvestDate < now &&
        !crop.actualHarvestDate &&
        crop.status !== "HARVESTED"
      );
    });

    if (overdueCrops.length > 0) {
      insights.push({
        title: `${overdueCrops.length} Crop${overdueCrops.length > 1 ? "s" : ""} Ready for Harvest`,
        description: `${overdueCrops.map((c) => c.name).join(", ")} ${overdueCrops.length > 1 ? "have" : "has"} passed the expected harvest date. Consider harvesting soon to maintain quality.`,
        confidence: 0.95,
        actionable: true,
        priority: "High",
        category: "harvest",
      });
    }

    // Crop diversity analysis
    const cropTypes = new Set(crops.map((crop) => crop.name));
    if (cropTypes.size === 1 && crops.length > 1) {
      insights.push({
        title: "Monoculture Risk Detected",
        description: `All ${crops.length} crops are ${Array.from(cropTypes)[0]}. Consider diversifying to reduce pest, disease, and market risks.`,
        confidence: 0.85,
        actionable: true,
        priority: "Medium",
        category: "planning",
      });
    } else if (cropTypes.size >= 3) {
      insights.push({
        title: "Excellent Crop Diversity",
        description: `You're growing ${cropTypes.size} different crop types, which helps reduce risks and improve soil health through crop rotation.`,
        confidence: 0.8,
        actionable: false,
        priority: "Low",
        category: "planning",
      });
    }
  }

  // 2. Activity Pattern Analysis
  if (activities.length > 0) {
    const recentActivities = activities.filter(
      (activity) => new Date(activity.createdAt) > thirtyDaysAgo
    );

    const weeklyActivities = activities.filter(
      (activity) => new Date(activity.createdAt) > sevenDaysAgo
    );

    // Activity frequency insights
    if (recentActivities.length < 3) {
      insights.push({
        title: "Low Recent Activity",
        description: `Only ${recentActivities.length} activities recorded in the past month. Regular monitoring and maintenance are crucial for optimal crop growth.`,
        confidence: 0.9,
        actionable: true,
        priority: "High",
        category: "monitoring",
      });
    } else if (weeklyActivities.length > 10) {
      insights.push({
        title: "High Activity Period",
        description: `${weeklyActivities.length} activities this week suggests intensive farming period. Ensure proper resource management and worker coordination.`,
        confidence: 0.75,
        actionable: true,
        priority: "Medium",
        category: "management",
      });
    }

    // Activity type distribution
    const activityTypes = recentActivities.reduce((acc: any, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {});

    if (activityTypes.IRRIGATION && activityTypes.IRRIGATION < 2) {
      insights.push({
        title: "Irrigation Monitoring Needed",
        description:
          "Low irrigation activity recorded recently. Ensure crops are receiving adequate water, especially during dry periods.",
        confidence: 0.8,
        actionable: true,
        priority: "High",
        category: "irrigation",
      });
    }

    if (activityTypes.FERTILIZER && activityTypes.FERTILIZER > 5) {
      insights.push({
        title: "High Fertilizer Usage",
        description:
          "Multiple fertilizer applications this month. Monitor soil nutrients to avoid over-fertilization and environmental impact.",
        confidence: 0.85,
        actionable: true,
        priority: "Medium",
        category: "fertilizer",
      });
    }
  }

  // 3. Financial Optimization Analysis
  if (activities.length > 5) {
    const totalCosts = activities.reduce(
      (sum, activity) => sum + (activity.cost || 0),
      0
    );
    const avgCostPerActivity = totalCosts / activities.length;

    const costsByType = activities.reduce((acc: any, activity) => {
      if (!acc[activity.type]) acc[activity.type] = { total: 0, count: 0 };
      acc[activity.type].total += activity.cost || 0;
      acc[activity.type].count += 1;
      return acc;
    }, {});

    // Identify highest cost activity types
    const highestCostType = Object.entries(costsByType).sort(
      ([, a]: any, [, b]: any) => b.total - a.total
    )[0];

    if (
      highestCostType &&
      (highestCostType[1] as any).total > totalCosts * 0.4
    ) {
      insights.push({
        title: `${highestCostType[0]} Dominates Farm Costs`,
        description: `${highestCostType[0]} activities account for ${Math.round(
          ((highestCostType[1] as any).total / totalCosts) * 100
        )}% of your total costs. Consider optimizing these operations for better profitability.`,
        confidence: 0.8,
        actionable: true,
        priority: "Medium",
        category: "financial",
      });
    }

    // Cost efficiency analysis
    const recentCosts = activities
      .filter((activity) => new Date(activity.createdAt) > thirtyDaysAgo)
      .reduce((sum, activity) => sum + (activity.cost || 0), 0);

    if (recentCosts > avgCostPerActivity * activities.length * 0.3) {
      insights.push({
        title: "Rising Operational Costs",
        description: `Recent monthly costs are trending higher than average. Review pricing and consider bulk purchasing or alternative suppliers.`,
        confidence: 0.75,
        actionable: true,
        priority: "Medium",
        category: "financial",
      });
    }
  }

  // 4. Seasonal and Timing Insights
  const currentMonth = now.getMonth();
  const currentSeason = getCurrentSeason(currentMonth);

  if (crops.length > 0) {
    const upcomingHarvests = crops.filter((crop) => {
      const harvestDate = new Date(crop.expectedHarvestDate);
      const daysUntilHarvest = Math.ceil(
        (harvestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilHarvest > 0 && daysUntilHarvest <= 14;
    });

    if (upcomingHarvests.length > 0) {
      insights.push({
        title: "Harvests Approaching",
        description: `${upcomingHarvests.length} crop${upcomingHarvests.length > 1 ? "s" : ""} (${upcomingHarvests.map((c) => c.name).join(", ")}) will be ready for harvest within 2 weeks. Prepare storage and processing facilities.`,
        confidence: 0.9,
        actionable: true,
        priority: "High",
        category: "harvest",
      });
    }
  }

  // 5. Productivity Insights
  if (crops.length >= 2 && activities.length >= 5) {
    const cropProductivity = crops.map((crop) => {
      const cropActivities = activities.filter(
        (activity) => activity.crop.id === crop.id
      );
      const totalCropCost = cropActivities.reduce(
        (sum, activity) => sum + (activity.cost || 0),
        0
      );
      const cropArea = crop.area || 1;

      return {
        name: crop.name,
        costPerArea: totalCropCost / cropArea,
        activityCount: cropActivities.length,
        status: crop.status,
      };
    });

    const avgCostPerArea =
      cropProductivity.reduce((sum, crop) => sum + crop.costPerArea, 0) /
      cropProductivity.length;
    const highCostCrops = cropProductivity.filter(
      (crop) => crop.costPerArea > avgCostPerArea * 1.5
    );

    if (highCostCrops.length > 0) {
      insights.push({
        title: "Cost Efficiency Opportunity",
        description: `${highCostCrops.map((c) => c.name).join(", ")} ${highCostCrops.length > 1 ? "have" : "has"} higher costs per area. Review inputs and methods for these crops to improve profitability.`,
        confidence: 0.7,
        actionable: true,
        priority: "Medium",
        category: "optimization",
      });
    }
  }

  // Default insight if no specific patterns found
  if (insights.length === 0) {
    insights.push({
      title: "Farm Operations Analysis Complete",
      description:
        "Your farm operations show good patterns. Continue monitoring for optimization opportunities as more data becomes available.",
      confidence: 0.6,
      actionable: false,
      priority: "Low",
      category: "general",
    });
  }

  // Limit to top 5 insights, prioritized by actionable items first, then by priority
  return insights
    .sort((a, b) => {
      if (a.actionable !== b.actionable) return b.actionable ? 1 : -1;
      const priorityOrder: { [key: string]: number } = {
        High: 3,
        Medium: 2,
        Low: 1,
      };
      return (
        (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
      );
    })
    .slice(0, 5);
}

/**
 * Parse AI-generated insights into structured format
 */
function parseAIInsights(aiContent: string, model: string): any[] {
  try {
    const insights: any[] = [];
    const lines = aiContent.split("\n").filter((line) => line.trim());

    let currentInsight: any = null;
    let section = "none";

    for (const line of lines) {
      const cleanLine = line.trim();

      // Detect section headers
      if (cleanLine.match(/^\d+\./)) {
        // Save previous insight
        if (currentInsight) {
          insights.push(currentInsight);
        }

        // Start new insight
        const title = cleanLine
          .replace(/^\d+\.\s*/, "")
          .replace(/[*#]/g, "")
          .trim();
        currentInsight = {
          title,
          description: "",
          confidence: 0.85,
          actionable: true,
          priority: "Medium",
          category: "ai-generated",
          source: "google-ai",
          model,
        };
        section = "description";
      } else if (cleanLine.toLowerCase().includes("key observations")) {
        section = "observations";
      } else if (cleanLine.toLowerCase().includes("recommendations")) {
        section = "recommendations";
      } else if (
        cleanLine.toLowerCase().includes("potential issues") ||
        cleanLine.toLowerCase().includes("watch for")
      ) {
        section = "issues";
      } else if (cleanLine.toLowerCase().includes("next steps")) {
        section = "next_steps";
      } else if (cleanLine.startsWith("•") || cleanLine.startsWith("-")) {
        // Handle bullet points
        const point = cleanLine.replace(/^[•-]\s*/, "").trim();
        if (currentInsight && point) {
          if (section === "description" && !currentInsight.description) {
            currentInsight.description = point;
          } else {
            currentInsight.description +=
              (currentInsight.description ? " " : "") + point;
          }

          // Determine priority and actionability based on keywords
          if (
            point.toLowerCase().includes("urgent") ||
            point.toLowerCase().includes("immediate")
          ) {
            currentInsight.priority = "High";
          } else if (
            point.toLowerCase().includes("consider") ||
            point.toLowerCase().includes("monitor")
          ) {
            currentInsight.priority = "Medium";
          } else if (
            point.toLowerCase().includes("excellent") ||
            point.toLowerCase().includes("good")
          ) {
            currentInsight.priority = "Low";
            currentInsight.actionable = false;
          }

          // Categorize based on keywords
          if (point.toLowerCase().includes("harvest")) {
            currentInsight.category = "harvest";
          } else if (
            point.toLowerCase().includes("water") ||
            point.toLowerCase().includes("irrigation")
          ) {
            currentInsight.category = "irrigation";
          } else if (
            point.toLowerCase().includes("cost") ||
            point.toLowerCase().includes("financial")
          ) {
            currentInsight.category = "financial";
          } else if (
            point.toLowerCase().includes("pest") ||
            point.toLowerCase().includes("disease")
          ) {
            currentInsight.category = "pest-disease";
          } else if (
            point.toLowerCase().includes("soil") ||
            point.toLowerCase().includes("fertilizer")
          ) {
            currentInsight.category = "soil-nutrition";
          }
        }
      } else if (currentInsight && cleanLine && section === "description") {
        // Add to description if it's a continuation
        currentInsight.description +=
          (currentInsight.description ? " " : "") + cleanLine;
      }
    }

    // Save the last insight
    if (currentInsight) {
      insights.push(currentInsight);
    }

    // If no structured insights found, create a general one
    if (insights.length === 0 && aiContent.trim()) {
      insights.push({
        title: "AI Farm Analysis",
        description:
          aiContent.substring(0, 200) + (aiContent.length > 200 ? "..." : ""),
        confidence: 0.8,
        actionable: true,
        priority: "Medium",
        category: "ai-generated",
        source: "google-ai",
        model,
      });
    }

    return insights.slice(0, 5); // Limit to top 5 insights
  } catch (error) {
    console.error("Error parsing AI insights:", error);
    // Return a fallback insight
    return [
      {
        title: "AI Analysis Available",
        description:
          "Advanced AI analysis completed. Review detailed recommendations in the AI chat for more insights.",
        confidence: 0.75,
        actionable: true,
        priority: "Medium",
        category: "ai-generated",
        source: "google-ai",
        model,
      },
    ];
  }
}

function getCurrentSeason(month: number): string {
  if (month >= 2 && month <= 4) return "Spring";
  if (month >= 5 && month <= 7) return "Summer";
  if (month >= 8 && month <= 10) return "Fall";
  return "Winter";
}
