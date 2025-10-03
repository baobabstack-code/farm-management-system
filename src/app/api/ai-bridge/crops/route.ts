import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { AIDataBridge } from "@/lib/ai-bridge/data-access";

/**
 * AI Bridge API for ADK Agents - Crop Data Access
 * This endpoint provides structured access to crop data for AI agents
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
    const limit = parseInt(searchParams.get("limit") || "50");
    const includeHistory = searchParams.get("includeHistory") === "true";

    // Use the data bridge for safe access
    const cropData = await AIDataBridge.getCropData(userId);

    if (!cropData.success) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch crop data" },
        { status: 500 }
      );
    }

    // Format data for AI agents with consistent structure
    const formattedData = {
      success: true,
      data: {
        crops: (cropData.data || []).slice(0, limit).map((crop: any) => ({
          id: crop.id,
          name: crop.name,
          variety: crop.variety,
          plantingDate: crop.plantingDate,
          expectedHarvestDate: crop.expectedHarvestDate,
          actualHarvestDate: crop.actualHarvestDate,
          status: crop.status,
          area: crop.area,
          ...(includeHistory && {
            recentTasks: crop.tasks || [],
            recentIrrigation: crop.irrigationLogs || [],
            recentFertilizer: crop.fertilizerLogs || [],
            pestDiseaseHistory: crop.pestDiseaseLogs || [],
            harvestHistory: crop.harvestLogs || [],
          }),
        })),
        summary: {
          totalCrops: (cropData.data || []).length,
          cropTypes: [
            ...new Set((cropData.data || []).map((c: any) => c.name)),
          ],
          statusDistribution: (cropData.data || []).reduce(
            (acc: any, crop: any) => {
              acc[crop.status] = (acc[crop.status] || 0) + 1;
              return acc;
            },
            {}
          ),
          totalArea: (cropData.data || []).reduce(
            (sum: number, crop: any) => sum + (crop.area || 0),
            0
          ),
        },
      },
      timestamp: new Date().toISOString(),
      source: "ai-bridge-crops",
    };

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("AI Bridge Crops API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for AI agents to request specific crop analysis
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

    const { cropIds, analysisType, parameters } = await request.json();

    // Validate input
    if (!Array.isArray(cropIds) || cropIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid crop IDs provided" },
        { status: 400 }
      );
    }

    // Get detailed crop data for analysis
    const cropData = await AIDataBridge.getCropData(userId);

    if (!cropData.success) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch crop data" },
        { status: 500 }
      );
    }

    // Filter to requested crops
    const requestedCrops = (cropData.data || []).filter((crop: any) =>
      cropIds.includes(crop.id)
    );

    // Perform analysis based on type
    let analysisResult;
    switch (analysisType) {
      case "health_assessment":
        analysisResult = performHealthAssessment(requestedCrops);
        break;
      case "productivity_analysis":
        analysisResult = performProductivityAnalysis(requestedCrops);
        break;
      case "cost_efficiency":
        analysisResult = performCostEfficiencyAnalysis(requestedCrops);
        break;
      default:
        analysisResult = performGeneralAnalysis(requestedCrops);
    }

    return NextResponse.json({
      success: true,
      data: {
        analysis: analysisResult,
        crops: requestedCrops.length,
        analysisType,
        parameters,
      },
      timestamp: new Date().toISOString(),
      source: "ai-bridge-crops-analysis",
    });
  } catch (error) {
    console.error("AI Bridge Crops Analysis error:", error);
    return NextResponse.json(
      { success: false, error: "Analysis failed" },
      { status: 500 }
    );
  }
}

// Analysis helper functions
function performHealthAssessment(crops: any[]) {
  return crops.map((crop) => {
    const daysSincePlanting = Math.floor(
      (new Date().getTime() - new Date(crop.plantingDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const healthScore = calculateHealthScore(crop);

    return {
      cropId: crop.id,
      name: crop.name,
      healthScore,
      daysSincePlanting,
      status: crop.status,
      concerns: identifyHealthConcerns(crop),
      recommendations: generateHealthRecommendations(crop, healthScore),
    };
  });
}

function performProductivityAnalysis(crops: any[]) {
  return crops.map((crop) => {
    const activitiesPerSqM = (crop.tasks?.length || 0) / (crop.area || 1);
    const irrigationFrequency = crop.irrigationLogs?.length || 0;

    return {
      cropId: crop.id,
      name: crop.name,
      activitiesPerSqM,
      irrigationFrequency,
      expectedYield: estimateYield(crop),
      productivityScore: calculateProductivityScore(crop),
    };
  });
}

function performCostEfficiencyAnalysis(crops: any[]) {
  return crops.map((crop) => {
    const totalCost = (crop.fertilizerLogs || []).reduce(
      (sum: number, log: any) => sum + log.amount * 10,
      0
    );
    const costPerSqM = totalCost / (crop.area || 1);

    return {
      cropId: crop.id,
      name: crop.name,
      totalCost,
      costPerSqM,
      efficiencyRating: calculateEfficiencyRating(totalCost, crop.area),
      optimizationOpportunities: identifyOptimizations(crop),
    };
  });
}

function performGeneralAnalysis(crops: any[]) {
  return {
    totalCrops: crops.length,
    averageArea:
      crops.reduce((sum, crop) => sum + (crop.area || 0), 0) / crops.length,
    statusBreakdown: crops.reduce((acc: any, crop) => {
      acc[crop.status] = (acc[crop.status] || 0) + 1;
      return acc;
    }, {}),
    varieties: [
      ...new Set(
        crops.map((crop) => `${crop.name} - ${crop.variety || "Unknown"}`)
      ),
    ],
    totalActivities: crops.reduce(
      (sum, crop) => sum + (crop.tasks?.length || 0),
      0
    ),
  };
}

// Helper calculation functions
function calculateHealthScore(crop: any): number {
  let score = 0.7; // Base score

  // Adjust based on activities
  if (crop.irrigationLogs?.length > 0) score += 0.1;
  if (crop.fertilizerLogs?.length > 0) score += 0.1;
  if (crop.pestDiseaseLogs?.length === 0) score += 0.1;

  return Math.min(1.0, score);
}

function identifyHealthConcerns(crop: any): string[] {
  const concerns = [];

  if (!crop.irrigationLogs?.length) concerns.push("No irrigation records");
  if (crop.pestDiseaseLogs?.length > 0) concerns.push("Pest/disease history");
  if (crop.status === "PLANTED" && isOverdue(crop.expectedHarvestDate)) {
    concerns.push("Overdue for harvest");
  }

  return concerns;
}

function generateHealthRecommendations(
  crop: any,
  healthScore: number
): string[] {
  const recommendations = [];

  if (healthScore < 0.6) {
    recommendations.push("Increase monitoring frequency");
    recommendations.push("Review irrigation schedule");
  }

  if (!crop.irrigationLogs?.length) {
    recommendations.push("Begin regular irrigation logging");
  }

  return recommendations;
}

function calculateProductivityScore(crop: any): number {
  const baseScore = 0.5;
  const activityBonus = Math.min(0.3, (crop.tasks?.length || 0) * 0.05);
  const irrigationBonus = Math.min(
    0.2,
    (crop.irrigationLogs?.length || 0) * 0.02
  );

  return Math.min(1.0, baseScore + activityBonus + irrigationBonus);
}

function estimateYield(crop: any): number {
  // Simple yield estimation based on area and care level
  const baseYield = crop.area || 1;
  const careMultiplier = 1 + (crop.tasks?.length || 0) * 0.1;

  return baseYield * careMultiplier;
}

function calculateEfficiencyRating(totalCost: number, area: number): string {
  const costPerSqM = totalCost / (area || 1);

  if (costPerSqM < 50) return "Excellent";
  if (costPerSqM < 100) return "Good";
  if (costPerSqM < 200) return "Fair";
  return "Needs Improvement";
}

function identifyOptimizations(crop: any): string[] {
  const optimizations = [];

  if ((crop.fertilizerLogs?.length || 0) > 5) {
    optimizations.push("Consider reducing fertilizer frequency");
  }

  if ((crop.irrigationLogs?.length || 0) < 2) {
    optimizations.push("Increase irrigation efficiency monitoring");
  }

  return optimizations;
}

function isOverdue(expectedDate: string): boolean {
  return new Date(expectedDate) < new Date();
}
