import { AIDataBridge } from "@/lib/ai-bridge/data-access";
import { weatherService } from "./weather";

export interface CropRecommendation {
  cropName: string;
  variety?: string;
  confidence: number; // 0-100
  reasoning: string[];
  expectedYield: string;
  growingTime: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  seasonalFit: number; // 0-100
  marketPotential: "Low" | "Medium" | "High";
  tags: string[];
}

export interface RecommendationFactors {
  location?: string;
  currentSeason: string;
  soilType?: "clay" | "sandy" | "loamy" | "silty";
  experience: "beginner" | "intermediate" | "advanced";
  spaceAvailable: "small" | "medium" | "large";
  budget: "low" | "medium" | "high";
  preferences?: string[];
  previousCrops?: string[];
}

/**
 * Crop Recommendation Service
 * Provides intelligent crop suggestions based on various factors
 */
export class CropRecommendationService {
  /**
   * Get crop recommendations based on user factors
   */
  static async getRecommendations(
    userId: string,
    factors: RecommendationFactors
  ): Promise<{
    success: boolean;
    data?: CropRecommendation[];
    error?: string;
  }> {
    try {
      // Get user's historical crop data for context
      const cropDataResult = await AIDataBridge.getCropData(userId);
      const historicalCrops = cropDataResult.success ? cropDataResult.data : [];

      // Get weather context (TODO: use real coordinates from factors.location)
      const weatherData = await weatherService.getCurrentWeather(0, 0);

      // Generate recommendations using our intelligent algorithm
      const recommendations = this.generateSmartRecommendations(
        factors,
        historicalCrops || [],
        weatherData
      );

      return {
        success: true,
        data: recommendations,
      };
    } catch (error) {
      console.error("Crop recommendation error:", error);
      return {
        success: false,
        error: "Failed to generate crop recommendations",
      };
    }
  }

  /**
   * Generate intelligent crop recommendations
   */
  private static generateSmartRecommendations(
    factors: RecommendationFactors,
    historicalCrops: any[],
    weatherData: any
  ): CropRecommendation[] {
    // Without a crop database, we can only provide basic seasonal recommendations
    // based on general agricultural knowledge
    return this.getBasicSeasonalRecommendations(
      factors,
      historicalCrops,
      weatherData
    );
  }

  /**
   * Provide basic seasonal crop recommendations without static database
   */
  private static getBasicSeasonalRecommendations(
    factors: RecommendationFactors,
    _historicalCrops: any[],
    _weatherData: any
  ): CropRecommendation[] {
    const { currentSeason, experience } = factors;
    const recommendations: CropRecommendation[] = [];

    // General seasonal recommendations based on agricultural knowledge
    if (currentSeason.toLowerCase() === "spring") {
      recommendations.push({
        cropName: "Lettuce",
        confidence: 80,
        reasoning: [
          "Cool weather crop perfect for spring",
          "Quick growing for beginners",
        ],
        expectedYield: "Based on your growing conditions",
        growingTime: "45-65 days",
        difficulty: "Beginner",
        seasonalFit: 100,
        marketPotential: "Medium",
        tags: ["cool-season", "leafy-green"],
      });
    }

    if (currentSeason.toLowerCase() === "summer") {
      recommendations.push({
        cropName: "Tomatoes",
        confidence: 85,
        reasoning: ["Warm weather crop ideal for summer", "High market value"],
        expectedYield: "Based on your growing conditions",
        growingTime: "70-90 days",
        difficulty: experience === "beginner" ? "Intermediate" : "Beginner",
        seasonalFit: 100,
        marketPotential: "High",
        tags: ["warm-season", "fruit"],
      });
    }

    if (currentSeason.toLowerCase() === "fall") {
      recommendations.push({
        cropName: "Spinach",
        confidence: 75,
        reasoning: ["Cool weather crop suitable for fall", "Frost tolerant"],
        expectedYield: "Based on your growing conditions",
        growingTime: "40-50 days",
        difficulty: "Beginner",
        seasonalFit: 90,
        marketPotential: "Medium",
        tags: ["cool-season", "leafy-green", "nutritious"],
      });
    }

    // If no specific recommendations, suggest consulting local agricultural extension
    if (recommendations.length === 0) {
      recommendations.push({
        cropName: "Seasonal Vegetables",
        confidence: 60,
        reasoning: [
          "Consult local agricultural extension for region-specific recommendations",
        ],
        expectedYield: "Variable based on crop selection",
        growingTime: "Variable",
        difficulty: "Beginner",
        seasonalFit: 70,
        marketPotential: "Medium",
        tags: ["general", "season-appropriate"],
      });
    }

    return recommendations;
  }

  /**
   * Calculate how well a crop fits the current season
   */
  private static calculateSeasonalFit(
    cropSeasons: string[],
    currentSeason: string
  ): number {
    const seasonLower = currentSeason.toLowerCase();
    if (cropSeasons.includes(seasonLower)) return 100;

    // Check adjacent seasons for partial fit
    const seasonOrder = ["winter", "spring", "summer", "fall"];
    const currentIndex = seasonOrder.indexOf(seasonLower);
    const adjacentSeasons = [
      seasonOrder[(currentIndex - 1 + 4) % 4],
      seasonOrder[(currentIndex + 1) % 4],
    ];

    if (cropSeasons.some((s) => adjacentSeasons.includes(s))) return 60;
    return 20;
  }
}
