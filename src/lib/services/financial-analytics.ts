import { AIDataBridge } from "@/lib/ai-bridge/data-access";

export interface FinancialForecast {
  period: string; // 'next_month' | 'next_quarter' | 'next_year'
  projectedRevenue: number;
  projectedCosts: number;
  projectedProfit: number;
  confidence: number; // 0-100
  factors: string[];
}

export interface ROIAnalysis {
  cropName: string;
  investmentCost: number;
  actualRevenue: number;
  projectedRevenue: number;
  actualROI: number;
  projectedROI: number;
  recommendation: string;
  performance: "Excellent" | "Good" | "Average" | "Below Average" | "Poor";
}

export interface CostOptimization {
  category: string;
  currentCost: number;
  optimizedCost: number;
  potentialSavings: number;
  recommendations: string[];
  implementation: "Easy" | "Moderate" | "Complex";
  priority: "High" | "Medium" | "Low";
}

export interface FinancialInsights {
  summary: {
    totalRevenue: number;
    totalCosts: number;
    netProfit: number;
    profitMargin: number;
  };
  forecasts: FinancialForecast[];
  roiAnalysis: ROIAnalysis[];
  costOptimizations: CostOptimization[];
  trends: {
    revenueGrowth: number;
    costTrend: number;
    profitTrend: number;
  };
  recommendations: string[];
}

/**
 * Enhanced Financial Analytics Service
 * Provides advanced financial analysis with AI-powered insights
 */
export class FinancialAnalyticsService {
  /**
   * Get comprehensive financial insights for a user
   */
  static async getFinancialInsights(userId: string): Promise<{
    success: boolean;
    data?: FinancialInsights;
    error?: string;
  }> {
    try {
      // Get financial data
      const financialResult = await AIDataBridge.getFinancialSummary(userId);
      const cropResult = await AIDataBridge.getCropData(userId);

      if (!financialResult.success) {
        return {
          success: false,
          error: "Failed to fetch financial data",
        };
      }

      const activities = financialResult.data || [];
      const crops = cropResult.success ? cropResult.data : [];

      // Generate comprehensive insights
      const insights = this.generateFinancialInsights(activities, crops || []);

      return {
        success: true,
        data: insights,
      };
    } catch (error) {
      console.error("Financial insights error:", error);
      return {
        success: false,
        error: "Failed to generate financial insights",
      };
    }
  }

  /**
   * Generate comprehensive financial insights
   */
  private static generateFinancialInsights(
    activities: any[],
    crops: any[]
  ): FinancialInsights {
    const summary = this.calculateSummary(activities);
    const forecasts = this.generateForecasts(activities, summary);
    const roiAnalysis = this.analyzeROI(activities, crops);
    const costOptimizations = this.identifyCostOptimizations(activities);
    const trends = this.calculateTrends(activities);
    const recommendations = this.generateRecommendations(
      summary,
      trends,
      roiAnalysis,
      costOptimizations
    );

    return {
      summary,
      forecasts,
      roiAnalysis,
      costOptimizations,
      trends,
      recommendations,
    };
  }

  /**
   * Calculate financial summary
   */
  private static calculateSummary(activities: any[]) {
    const totalCosts = activities.reduce(
      (sum, activity) => sum + (activity.cost || 0),
      0
    );
    const totalRevenue = activities
      .filter((activity) => activity.type === "HARVEST")
      .reduce((sum, activity) => {
        // Estimate revenue based on yield and market prices
        const estimatedPrice = this.getEstimatedPrice(activity.notes);
        return sum + (activity.yield * estimatedPrice || 0);
      }, 0);

    const netProfit = totalRevenue - totalCosts;
    const profitMargin =
      totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalCosts,
      netProfit,
      profitMargin,
    };
  }

  /**
   * Generate profit forecasts
   */
  private static generateForecasts(
    activities: any[],
    summary: any
  ): FinancialForecast[] {
    const monthlyActivities = this.groupActivitiesByMonth(activities);
    const averageMonthlyRevenue =
      summary.totalRevenue / Math.max(monthlyActivities.length, 1);
    const averageMonthlyCosts =
      summary.totalCosts / Math.max(monthlyActivities.length, 1);

    // Apply seasonal and growth factors
    const seasonalFactor = this.getSeasonalFactor();
    const growthFactor = this.calculateGrowthFactor(monthlyActivities);

    return [
      {
        period: "next_month",
        projectedRevenue: averageMonthlyRevenue * seasonalFactor * growthFactor,
        projectedCosts: averageMonthlyCosts * 1.05, // Slight cost inflation
        projectedProfit:
          averageMonthlyRevenue * seasonalFactor * growthFactor -
          averageMonthlyCosts * 1.05,
        confidence: this.calculateConfidence(activities.length, "month"),
        factors: [
          "Based on historical performance",
          "Seasonal adjustments applied",
          "Growth trend factored in",
        ],
      },
      {
        period: "next_quarter",
        projectedRevenue:
          averageMonthlyRevenue * 3 * seasonalFactor * growthFactor,
        projectedCosts: averageMonthlyCosts * 3 * 1.03,
        projectedProfit:
          averageMonthlyRevenue * 3 * seasonalFactor * growthFactor -
          averageMonthlyCosts * 3 * 1.03,
        confidence: this.calculateConfidence(activities.length, "quarter"),
        factors: [
          "Quarterly seasonal patterns",
          "Market demand projections",
          "Operational efficiency gains",
        ],
      },
      {
        period: "next_year",
        projectedRevenue: averageMonthlyRevenue * 12 * growthFactor * 1.1, // 10% improvement
        projectedCosts: averageMonthlyCosts * 12 * 1.08, // 8% cost increase
        projectedProfit:
          averageMonthlyRevenue * 12 * growthFactor * 1.1 -
          averageMonthlyCosts * 12 * 1.08,
        confidence: this.calculateConfidence(activities.length, "year"),
        factors: [
          "Annual growth projections",
          "Infrastructure improvements",
          "Market expansion opportunities",
        ],
      },
    ];
  }

  /**
   * Analyze ROI for different crops
   */
  private static analyzeROI(activities: any[], crops: any[]): ROIAnalysis[] {
    const cropROI = crops.map((crop) => {
      // Calculate costs for this crop
      const cropActivities = activities.filter(
        (activity) =>
          activity.cropId === crop.id ||
          activity.notes?.toLowerCase().includes(crop.name.toLowerCase())
      );

      const investmentCost = cropActivities
        .filter((activity) => activity.type !== "HARVEST")
        .reduce((sum, activity) => sum + (activity.cost || 0), 0);

      const harvestActivities = cropActivities.filter(
        (activity) => activity.type === "HARVEST"
      );
      const actualRevenue = harvestActivities.reduce((sum, activity) => {
        const estimatedPrice = this.getEstimatedPrice(activity.notes);
        return sum + (activity.yield * estimatedPrice || 0);
      }, 0);

      const actualROI =
        investmentCost > 0
          ? ((actualRevenue - investmentCost) / investmentCost) * 100
          : 0;

      // Project future ROI based on expected harvest
      const projectedYield = this.getExpectedYield(crop);
      const marketPrice = this.getEstimatedPrice(crop.name);
      const projectedRevenue = projectedYield * marketPrice;
      const projectedROI =
        investmentCost > 0
          ? ((projectedRevenue - investmentCost) / investmentCost) * 100
          : 0;

      return {
        cropName: crop.name,
        investmentCost,
        actualRevenue,
        projectedRevenue,
        actualROI,
        projectedROI,
        recommendation: this.generateROIRecommendation(actualROI, projectedROI),
        performance: this.categorizePerformance(actualROI),
      };
    });

    return cropROI.sort((a, b) => b.projectedROI - a.projectedROI);
  }

  /**
   * Identify cost optimization opportunities
   */
  private static identifyCostOptimizations(
    activities: any[]
  ): CostOptimization[] {
    const costsByCategory = this.groupCostsByCategory(activities);
    const optimizations: CostOptimization[] = [];

    Object.entries(costsByCategory).forEach(([category, costs]) => {
      const totalCosts = costs as number;
      const optimization = this.analyzeCategoryOptimization(
        category,
        totalCosts
      );
      if (optimization) {
        optimizations.push(optimization);
      }
    });

    return optimizations.sort(
      (a, b) => b.potentialSavings - a.potentialSavings
    );
  }

  /**
   * Calculate financial trends
   */
  private static calculateTrends(activities: any[]) {
    const monthlyData = this.groupActivitiesByMonth(activities);

    // Calculate growth trends
    const revenueGrowth = this.calculateGrowthRate(
      monthlyData.map((month) => month.revenue)
    );
    const costTrend = this.calculateGrowthRate(
      monthlyData.map((month) => month.costs)
    );
    const profitTrend = this.calculateGrowthRate(
      monthlyData.map((month) => month.revenue - month.costs)
    );

    return {
      revenueGrowth,
      costTrend,
      profitTrend,
    };
  }

  /**
   * Generate actionable recommendations
   */
  private static generateRecommendations(
    summary: any,
    trends: any,
    roiAnalysis: ROIAnalysis[],
    costOptimizations: CostOptimization[]
  ): string[] {
    const recommendations: string[] = [];

    // Profit margin recommendations
    if (summary.profitMargin < 20) {
      recommendations.push(
        "Consider increasing prices or reducing costs to improve profit margin"
      );
    } else if (summary.profitMargin > 40) {
      recommendations.push(
        "Excellent profit margins - consider reinvesting in expansion"
      );
    }

    // Growth trend recommendations
    if (trends.revenueGrowth < 0) {
      recommendations.push(
        "Focus on revenue growth through new crops or market expansion"
      );
    }
    if (trends.costTrend > 10) {
      recommendations.push(
        "Cost control measures needed - review high-cost categories"
      );
    }

    // ROI recommendations
    const topPerformingCrop = roiAnalysis.find(
      (r) => r.performance === "Excellent"
    );
    if (topPerformingCrop) {
      recommendations.push(
        `Consider expanding ${topPerformingCrop.cropName} production - highest ROI crop`
      );
    }

    const poorPerformingCrops = roiAnalysis.filter(
      (r) => r.performance === "Poor"
    );
    if (poorPerformingCrops.length > 0) {
      recommendations.push(
        `Review ${poorPerformingCrops[0].cropName} - consider alternative crops or optimization`
      );
    }

    // Cost optimization recommendations
    const highPrioritySavings = costOptimizations.filter(
      (opt) => opt.priority === "High"
    );
    if (highPrioritySavings.length > 0) {
      recommendations.push(
        `Immediate cost savings available in ${highPrioritySavings[0].category}`
      );
    }

    return recommendations.slice(0, 5); // Return top 5 recommendations
  }

  // Helper methods
  private static getEstimatedPrice(cropOrNotes: string): number {
    const priceMap: Record<string, number> = {
      tomato: 3.5,
      tomatoes: 3.5,
      lettuce: 2.0,
      basil: 15.0,
      pepper: 4.0,
      peppers: 4.0,
      carrot: 1.5,
      carrots: 1.5,
      spinach: 2.5,
      cucumber: 2.0,
      cucumbers: 2.0,
      kale: 3.0,
      zucchini: 1.5,
      bean: 2.5,
      beans: 2.5,
      radish: 2.0,
      radishes: 2.0,
      strawberry: 8.0,
      strawberries: 8.0,
    };

    const searchText = cropOrNotes?.toLowerCase() || "";
    for (const [crop, price] of Object.entries(priceMap)) {
      if (searchText.includes(crop)) {
        return price;
      }
    }
    return 2.5; // Default price per kg
  }

  private static getExpectedYield(crop: any): number {
    // Estimate yield based on crop size and type
    const yieldMap: Record<string, number> = {
      tomatoes: 3.0,
      lettuce: 0.75,
      basil: 0.15,
      peppers: 1.5,
      carrots: 2.5,
      spinach: 1.5,
      cucumber: 5.0,
      kale: 1.5,
      zucchini: 4.0,
      beans: 1.5,
      radishes: 1.5,
      strawberries: 0.75,
    };

    return yieldMap[crop.name.toLowerCase()] || 2.0;
  }

  private static groupActivitiesByMonth(activities: any[]) {
    const monthlyData: any[] = [];
    const monthMap = new Map();

    activities.forEach((activity) => {
      const month = new Date(activity.createdAt).toISOString().substring(0, 7);
      if (!monthMap.has(month)) {
        monthMap.set(month, { revenue: 0, costs: 0 });
      }

      const data = monthMap.get(month);
      if (activity.type === "HARVEST") {
        const price = this.getEstimatedPrice(activity.notes);
        data.revenue += (activity.yield || 0) * price;
      }
      data.costs += activity.cost || 0;
    });

    monthMap.forEach((data) => monthlyData.push(data));
    return monthlyData;
  }

  private static getSeasonalFactor(): number {
    const month = new Date().getMonth();
    // Spring/Summer generally better for farming
    if (month >= 3 && month <= 8) return 1.2;
    return 0.9;
  }

  private static calculateGrowthFactor(monthlyData: any[]): number {
    if (monthlyData.length < 2) return 1.0;
    const recentRevenue = monthlyData
      .slice(-3)
      .reduce((sum, m) => sum + m.revenue, 0);
    const earlierRevenue = monthlyData
      .slice(0, 3)
      .reduce((sum, m) => sum + m.revenue, 0);

    if (earlierRevenue === 0) return 1.05;
    return Math.max(0.8, Math.min(1.3, recentRevenue / earlierRevenue));
  }

  private static calculateConfidence(
    dataPoints: number,
    period: string
  ): number {
    let base = Math.min(90, 30 + dataPoints * 2);
    if (period === "year") base -= 20;
    if (period === "quarter") base -= 10;
    return Math.max(40, base);
  }

  private static generateROIRecommendation(
    actualROI: number,
    projectedROI: number
  ): string {
    if (projectedROI > 50) return "Excellent investment - consider expanding";
    if (projectedROI > 25) return "Good returns - maintain current strategy";
    if (projectedROI > 0)
      return "Modest returns - look for optimization opportunities";
    return "Consider alternative crops or cost reduction";
  }

  private static categorizePerformance(
    roi: number
  ): "Excellent" | "Good" | "Average" | "Below Average" | "Poor" {
    if (roi > 50) return "Excellent";
    if (roi > 25) return "Good";
    if (roi > 10) return "Average";
    if (roi > 0) return "Below Average";
    return "Poor";
  }

  private static groupCostsByCategory(activities: any[]) {
    const categories = {
      IRRIGATION: 0,
      FERTILIZER: 0,
      PEST_CONTROL: 0,
      PLANTING: 0,
      HARVESTING: 0,
      OTHER: 0,
    };

    activities.forEach((activity) => {
      const category = activity.type || "OTHER";
      categories[category as keyof typeof categories] =
        (categories[category as keyof typeof categories] || 0) +
        (activity.cost || 0);
    });

    return categories;
  }

  private static analyzeCategoryOptimization(
    category: string,
    totalCosts: number
  ): CostOptimization | null {
    if (totalCosts < 50) return null; // Skip small cost categories

    const optimizations: Record<string, any> = {
      IRRIGATION: {
        optimizedCost: totalCosts * 0.8,
        recommendations: [
          "Install drip irrigation system",
          "Use water-efficient scheduling",
          "Consider rainwater harvesting",
        ],
        implementation: "Moderate",
        priority: "High",
      },
      FERTILIZER: {
        optimizedCost: totalCosts * 0.85,
        recommendations: [
          "Implement composting program",
          "Use organic fertilizers",
          "Soil testing for precise application",
        ],
        implementation: "Easy",
        priority: "Medium",
      },
      PEST_CONTROL: {
        optimizedCost: totalCosts * 0.75,
        recommendations: [
          "Integrated pest management",
          "Companion planting",
          "Beneficial insect habitats",
        ],
        implementation: "Moderate",
        priority: "High",
      },
    };

    const optimization = optimizations[category];
    if (!optimization) return null;

    return {
      category,
      currentCost: totalCosts,
      optimizedCost: optimization.optimizedCost,
      potentialSavings: totalCosts - optimization.optimizedCost,
      recommendations: optimization.recommendations,
      implementation: optimization.implementation,
      priority: optimization.priority,
    };
  }

  private static calculateGrowthRate(values: number[]): number {
    if (values.length < 2) return 0;
    const recent = values.slice(-3).reduce((sum, v) => sum + v, 0) / 3;
    const earlier = values.slice(0, 3).reduce((sum, v) => sum + v, 0) / 3;

    if (earlier === 0) return 0;
    return ((recent - earlier) / earlier) * 100;
  }
}
