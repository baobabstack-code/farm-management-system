import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isFeatureEnabled } from "@/lib/feature-flags";
import {
  CropRecommendationService,
  RecommendationFactors,
} from "@/lib/services/crop-recommendations";

/**
 * Crop Recommendations API
 * Provides intelligent crop suggestions based on user factors
 */
export async function POST(request: NextRequest) {
  try {
    // Check if crop recommendations feature is enabled
    if (!isFeatureEnabled("aiCropRecommendations")) {
      return NextResponse.json(
        { error: "Crop recommendations feature is not enabled" },
        { status: 403 }
      );
    }

    const authResult = await auth();
    const userId = authResult.userId;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const factors: RecommendationFactors = {
      currentSeason: body.currentSeason || getCurrentSeason(),
      soilType: body.soilType,
      experience: body.experience || "beginner",
      spaceAvailable: body.spaceAvailable || "medium",
      budget: body.budget || "medium",
      location: body.location,
      preferences: body.preferences,
      previousCrops: body.previousCrops,
    };

    // Validate required factors
    if (
      !factors.currentSeason ||
      !factors.experience ||
      !factors.spaceAvailable
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required factors: currentSeason, experience, spaceAvailable",
        },
        { status: 400 }
      );
    }

    // Get recommendations
    const result = await CropRecommendationService.getRecommendations(
      userId,
      factors
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to generate recommendations" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      recommendations: result.data,
      timestamp: new Date().toISOString(),
      factors: factors,
    });
  } catch (error) {
    console.error("Crop recommendations API error:", error);
    return NextResponse.json(
      { error: "Failed to process recommendation request" },
      { status: 500 }
    );
  }
}

/**
 * Get current season based on date
 */
function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

/**
 * GET endpoint for getting recommendation form options
 */
export async function GET() {
  try {
    const authResult = await auth();
    const userId = authResult.userId;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isFeatureEnabled("aiCropRecommendations")) {
      return NextResponse.json(
        { error: "Crop recommendations feature is not enabled" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      options: {
        seasons: ["spring", "summer", "fall", "winter"],
        soilTypes: ["clay", "sandy", "loamy", "silty"],
        experienceLevels: ["beginner", "intermediate", "advanced"],
        spaceOptions: ["small", "medium", "large"],
        budgetOptions: ["low", "medium", "high"],
        currentSeason: getCurrentSeason(),
      },
    });
  } catch (error) {
    console.error("Crop recommendations options API error:", error);
    return NextResponse.json(
      { error: "Failed to get recommendation options" },
      { status: 500 }
    );
  }
}
