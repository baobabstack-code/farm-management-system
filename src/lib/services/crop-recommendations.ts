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

interface CropData {
  cropName: string;
  variety: string;
  seasons: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  spaceNeeded: "small" | "medium" | "large";
  preferredSoil: string[];
  tempRange: { min: number; max: number };
  costLevel: "low" | "medium" | "high";
  expectedYield: string;
  growingTime: string;
  marketPotential: "Low" | "Medium" | "High";
  tags: string[];
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
    const { currentSeason, soilType, experience, spaceAvailable, budget } =
      factors;

    // Get base crop database
    const cropDatabase = this.getCropDatabase();

    // Filter by season suitability
    let suitableCrops = cropDatabase.filter((crop) =>
      crop.seasons.includes(currentSeason.toLowerCase())
    );

    // Filter by experience level
    if (experience === "beginner") {
      suitableCrops = suitableCrops.filter(
        (crop) =>
          crop.difficulty === "Beginner" || crop.difficulty === "Intermediate"
      );
    }

    // Filter by space requirements
    suitableCrops = suitableCrops.filter((crop) => {
      if (spaceAvailable === "small") return crop.spaceNeeded === "small";
      if (spaceAvailable === "medium")
        return ["small", "medium"].includes(crop.spaceNeeded);
      return true; // large space can grow anything
    });

    // Score and rank recommendations
    const scoredRecommendations = suitableCrops.map((crop) => {
      let confidence = 70; // Base confidence
      const reasoning = [];

      // Season fit bonus
      const currentSeasonLower = currentSeason.toLowerCase();
      if (crop.seasons.includes(currentSeasonLower)) {
        confidence += 10;
        reasoning.push(`Perfect for ${currentSeason} growing`);
      }

      // Experience level match
      if (crop.difficulty.toLowerCase() === experience) {
        confidence += 10;
        reasoning.push(`Matches your ${experience} experience level`);
      } else if (
        experience === "advanced" &&
        crop.difficulty === "Intermediate"
      ) {
        confidence += 5;
        reasoning.push("Good challenge for experienced grower");
      }

      // Soil type bonus (if provided)
      if (soilType && crop.preferredSoil.includes(soilType)) {
        confidence += 8;
        reasoning.push(`Thrives in ${soilType} soil`);
      }

      // Budget consideration
      if (budget === "low" && crop.costLevel === "low") {
        confidence += 5;
        reasoning.push("Budget-friendly option");
      } else if (budget === "high" && crop.costLevel === "high") {
        confidence += 3;
        reasoning.push("Premium crop with high returns");
      }

      // Weather integration bonus
      if (weatherData) {
        if (
          weatherData.temperature >= crop.tempRange.min &&
          weatherData.temperature <= crop.tempRange.max
        ) {
          confidence += 8;
          reasoning.push("Current weather conditions are ideal");
        }
      }

      // Avoid recently grown crops (crop rotation)
      const recentlyGrown = historicalCrops.some(
        (hc) => hc.name.toLowerCase() === crop.cropName.toLowerCase()
      );
      if (recentlyGrown) {
        confidence -= 10;
        reasoning.push("Consider crop rotation - grown recently");
      } else {
        confidence += 5;
        reasoning.push("Good for crop rotation");
      }

      // Market potential bonus
      if (crop.marketPotential === "High") {
        confidence += 8;
        reasoning.push("High market demand and profitability");
      }

      // Cap confidence at 95%
      confidence = Math.min(confidence, 95);

      return {
        cropName: crop.cropName,
        variety: crop.variety,
        confidence,
        reasoning,
        expectedYield: crop.expectedYield,
        growingTime: crop.growingTime,
        difficulty: crop.difficulty,
        seasonalFit: this.calculateSeasonalFit(crop.seasons, currentSeason),
        marketPotential: crop.marketPotential,
        tags: crop.tags,
      };
    });

    // Sort by confidence and return top recommendations
    return scoredRecommendations
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 8); // Return top 8 recommendations
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

  /**
   * Get comprehensive crop database
   */
  private static getCropDatabase(): CropData[] {
    return [
      // Spring/Summer Vegetables
      {
        cropName: "Tomatoes",
        variety: "Cherry tomatoes",
        seasons: ["spring", "summer"],
        difficulty: "Intermediate",
        spaceNeeded: "medium",
        preferredSoil: ["loamy", "sandy"],
        tempRange: { min: 15, max: 30 },
        costLevel: "medium",
        expectedYield: "2-4 kg per plant",
        growingTime: "70-85 days",
        marketPotential: "High",
        tags: ["popular", "versatile", "high-yield"],
      },
      {
        cropName: "Lettuce",
        variety: "Butterhead",
        seasons: ["spring", "fall"],
        difficulty: "Beginner",
        spaceNeeded: "small",
        preferredSoil: ["loamy", "silty"],
        tempRange: { min: 10, max: 25 },
        costLevel: "low",
        expectedYield: "0.5-1 kg per plant",
        growingTime: "45-60 days",
        marketPotential: "Medium",
        tags: ["quick-growing", "cool-season", "salad"],
      },
      {
        cropName: "Basil",
        variety: "Sweet basil",
        seasons: ["spring", "summer"],
        difficulty: "Beginner",
        spaceNeeded: "small",
        preferredSoil: ["loamy", "sandy"],
        tempRange: { min: 20, max: 30 },
        costLevel: "low",
        expectedYield: "100-200g per plant",
        growingTime: "60-90 days",
        marketPotential: "High",
        tags: ["herb", "aromatic", "culinary"],
      },
      {
        cropName: "Peppers",
        variety: "Bell peppers",
        seasons: ["spring", "summer"],
        difficulty: "Intermediate",
        spaceNeeded: "medium",
        preferredSoil: ["loamy", "sandy"],
        tempRange: { min: 18, max: 32 },
        costLevel: "medium",
        expectedYield: "1-2 kg per plant",
        growingTime: "75-90 days",
        marketPotential: "High",
        tags: ["colorful", "nutritious", "versatile"],
      },
      {
        cropName: "Carrots",
        variety: "Nantes variety",
        seasons: ["spring", "fall"],
        difficulty: "Beginner",
        spaceNeeded: "small",
        preferredSoil: ["sandy", "loamy"],
        tempRange: { min: 12, max: 24 },
        costLevel: "low",
        expectedYield: "2-3 kg per sq meter",
        growingTime: "70-80 days",
        marketPotential: "Medium",
        tags: ["root-vegetable", "storage-friendly", "nutritious"],
      },
      {
        cropName: "Spinach",
        variety: "Space spinach",
        seasons: ["spring", "fall", "winter"],
        difficulty: "Beginner",
        spaceNeeded: "small",
        preferredSoil: ["loamy", "silty"],
        tempRange: { min: 5, max: 20 },
        costLevel: "low",
        expectedYield: "1-2 kg per sq meter",
        growingTime: "40-50 days",
        marketPotential: "Medium",
        tags: ["leafy-green", "cool-season", "quick-growing"],
      },
      {
        cropName: "Cucumber",
        variety: "Burpless variety",
        seasons: ["spring", "summer"],
        difficulty: "Intermediate",
        spaceNeeded: "large",
        preferredSoil: ["loamy", "sandy"],
        tempRange: { min: 20, max: 30 },
        costLevel: "medium",
        expectedYield: "4-6 kg per plant",
        growingTime: "55-65 days",
        marketPotential: "Medium",
        tags: ["climbing", "high-water", "refreshing"],
      },
      {
        cropName: "Kale",
        variety: "Curly kale",
        seasons: ["fall", "winter", "spring"],
        difficulty: "Beginner",
        spaceNeeded: "medium",
        preferredSoil: ["loamy", "clay"],
        tempRange: { min: 2, max: 25 },
        costLevel: "low",
        expectedYield: "1-2 kg per plant",
        growingTime: "55-75 days",
        marketPotential: "High",
        tags: ["superfood", "cold-hardy", "nutritious"],
      },
      {
        cropName: "Zucchini",
        variety: "Black beauty",
        seasons: ["spring", "summer"],
        difficulty: "Beginner",
        spaceNeeded: "large",
        preferredSoil: ["loamy", "sandy"],
        tempRange: { min: 18, max: 28 },
        costLevel: "low",
        expectedYield: "3-5 kg per plant",
        growingTime: "50-60 days",
        marketPotential: "Medium",
        tags: ["prolific", "easy-growing", "summer-squash"],
      },
      {
        cropName: "Green Beans",
        variety: "Bush beans",
        seasons: ["spring", "summer"],
        difficulty: "Beginner",
        spaceNeeded: "small",
        preferredSoil: ["loamy", "sandy"],
        tempRange: { min: 16, max: 28 },
        costLevel: "low",
        expectedYield: "1-2 kg per sq meter",
        growingTime: "50-60 days",
        marketPotential: "Medium",
        tags: ["nitrogen-fixing", "productive", "protein-rich"],
      },
      {
        cropName: "Radishes",
        variety: "Cherry Belle",
        seasons: ["spring", "fall"],
        difficulty: "Beginner",
        spaceNeeded: "small",
        preferredSoil: ["sandy", "loamy"],
        tempRange: { min: 10, max: 22 },
        costLevel: "low",
        expectedYield: "1-2 kg per sq meter",
        growingTime: "25-35 days",
        marketPotential: "Low",
        tags: ["fast-growing", "space-efficient", "crunchy"],
      },
      {
        cropName: "Strawberries",
        variety: "Everbearing",
        seasons: ["spring", "summer"],
        difficulty: "Intermediate",
        spaceNeeded: "medium",
        preferredSoil: ["sandy", "loamy"],
        tempRange: { min: 12, max: 25 },
        costLevel: "medium",
        expectedYield: "0.5-1 kg per plant",
        growingTime: "90-120 days",
        marketPotential: "High",
        tags: ["perennial", "fruit", "sweet"],
      },
    ];
  }
}
