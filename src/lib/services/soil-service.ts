import { prisma } from "@/lib/prisma";
import { SoilTest, SoilAmendment, SoilTestType } from "@/types";

export interface SoilAnalysis {
  pH: {
    value: number;
    rating: "Very Low" | "Low" | "Optimal" | "High" | "Very High";
    recommendation: string;
  };
  organicMatter: {
    value: number;
    rating: "Very Low" | "Low" | "Moderate" | "Good" | "Very Good";
    recommendation: string;
  };
  nutrients: {
    nitrogen: { value: number; rating: string; recommendation: string };
    phosphorus: { value: number; rating: string; recommendation: string };
    potassium: { value: number; rating: string; recommendation: string };
  };
  overallHealth: {
    score: number; // 0-100
    rating: "Poor" | "Fair" | "Good" | "Excellent";
    primaryIssues: string[];
  };
}

export interface SoilRecommendation {
  amendments: Array<{
    type: string;
    rate: number;
    unit: string;
    timing: string;
    purpose: string;
  }>;
  practices: Array<{
    practice: string;
    description: string;
    timeline: string;
  }>;
  cropSuitability: Array<{
    cropType: string;
    suitability: "Excellent" | "Good" | "Fair" | "Poor";
    notes: string;
  }>;
}

export class SoilService {
  // Soil Test Management
  static async createSoilTest(
    data: Omit<SoilTest, "id" | "createdAt" | "updatedAt">
  ): Promise<SoilTest> {
    try {
      const soilTest = await prisma.soilTest.create({
        data: {
          userId: data.userId,
          cropId: data.cropId,
          fieldId: data.fieldId,
          sampleDate: new Date(data.sampleDate),
          labName: data.labName,
          testType: data.testType,
          pH: data.pH,
          organicMatter: data.organicMatter,
          nitrogen: data.nitrogen,
          phosphorus: data.phosphorus,
          potassium: data.potassium,
          calcium: data.calcium,
          magnesium: data.magnesium,
          sulfur: data.sulfur,
          cationExchangeCapacity: data.cationExchangeCapacity,
          soilTexture: data.soilTexture,
          recommendations: data.recommendations,
          cost: data.cost,
          notes: data.notes,
        },
        include: {
          crop: true,
          field: true,
        },
      });

      return soilTest as SoilTest;
    } catch (error) {
      console.error("Error creating soil test:", error);
      throw new Error("Failed to create soil test");
    }
  }

  static async getSoilTestsForUser(
    userId: string,
    filters?: {
      cropId?: string;
      fieldId?: string;
      testType?: SoilTestType;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<SoilTest[]> {
    try {
      const where: any = { userId };

      if (filters?.cropId) where.cropId = filters.cropId;
      if (filters?.fieldId) where.fieldId = filters.fieldId;
      if (filters?.testType) where.testType = filters.testType;
      if (filters?.startDate || filters?.endDate) {
        where.sampleDate = {};
        if (filters.startDate) where.sampleDate.gte = filters.startDate;
        if (filters.endDate) where.sampleDate.lte = filters.endDate;
      }

      const soilTests = await prisma.soilTest.findMany({
        where,
        include: {
          crop: true,
          field: true,
        },
        orderBy: { sampleDate: "desc" },
      });

      return soilTests as SoilTest[];
    } catch (error) {
      console.error("Error fetching soil tests:", error);
      throw new Error("Failed to fetch soil tests");
    }
  }

  // Soil Amendment Management
  static async createSoilAmendment(
    data: Omit<SoilAmendment, "id" | "createdAt">
  ): Promise<SoilAmendment> {
    try {
      const amendment = await prisma.soilAmendment.create({
        data: {
          userId: data.userId,
          cropId: data.cropId,
          fieldId: data.fieldId,
          amendmentType: data.amendmentType,
          applicationDate: new Date(data.applicationDate),
          rate: data.rate,
          unit: data.unit,
          cost: data.cost,
          supplierName: data.supplier,
          method: data.method,
          notes: data.notes,
        },
        include: {
          crop: true,
          field: true,
        },
      });

      return amendment as SoilAmendment;
    } catch (error) {
      console.error("Error creating soil amendment:", error);
      throw new Error("Failed to create soil amendment");
    }
  }

  static async getSoilAmendmentsForUser(
    userId: string,
    filters?: {
      cropId?: string;
      fieldId?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<SoilAmendment[]> {
    try {
      const where: any = { userId };

      if (filters?.cropId) where.cropId = filters.cropId;
      if (filters?.fieldId) where.fieldId = filters.fieldId;
      if (filters?.startDate || filters?.endDate) {
        where.applicationDate = {};
        if (filters.startDate) where.applicationDate.gte = filters.startDate;
        if (filters.endDate) where.applicationDate.lte = filters.endDate;
      }

      const amendments = await prisma.soilAmendment.findMany({
        where,
        include: {
          crop: true,
          field: true,
        },
        orderBy: { applicationDate: "desc" },
      });

      return amendments as SoilAmendment[];
    } catch (error) {
      console.error("Error fetching soil amendments:", error);
      throw new Error("Failed to fetch soil amendments");
    }
  }

  // Soil Analysis and Recommendations
  static analyzeSoilTest(soilTest: SoilTest): SoilAnalysis {
    const analysis: SoilAnalysis = {
      pH: this.analyzePH(soilTest.pH),
      organicMatter: this.analyzeOrganicMatter(soilTest.organicMatter),
      nutrients: {
        nitrogen: this.analyzeNitrogen(soilTest.nitrogen),
        phosphorus: this.analyzePhosphorus(soilTest.phosphorus),
        potassium: this.analyzePotassium(soilTest.potassium),
      },
      overallHealth: this.calculateOverallHealth(soilTest),
    };

    return analysis;
  }

  private static analyzePH(pH: number) {
    let rating: "Very Low" | "Low" | "Optimal" | "High" | "Very High";
    let recommendation: string;

    if (pH < 5.0) {
      rating = "Very Low";
      recommendation =
        "Apply lime to raise pH. Very acidic soil limits nutrient availability.";
    } else if (pH < 6.0) {
      rating = "Low";
      recommendation =
        "Consider liming to raise pH for better nutrient availability.";
    } else if (pH <= 7.0) {
      rating = "Optimal";
      recommendation =
        "pH is in optimal range for most crops. Maintain current levels.";
    } else if (pH <= 8.0) {
      rating = "High";
      recommendation =
        "Slightly alkaline. Monitor for nutrient deficiencies, especially iron.";
    } else {
      rating = "Very High";
      recommendation =
        "Very alkaline. Apply sulfur or acidifying amendments to lower pH.";
    }

    return { value: pH, rating, recommendation };
  }

  private static analyzeOrganicMatter(om: number) {
    let rating: "Very Low" | "Low" | "Moderate" | "Good" | "Very Good";
    let recommendation: string;

    if (om < 2.0) {
      rating = "Very Low";
      recommendation =
        "Critical need for organic matter. Add compost, manure, or cover crops.";
    } else if (om < 3.0) {
      rating = "Low";
      recommendation =
        "Increase organic matter through compost, manure, or green manures.";
    } else if (om < 4.0) {
      rating = "Moderate";
      recommendation =
        "Continue building organic matter with regular additions of organic materials.";
    } else if (om < 6.0) {
      rating = "Good";
      recommendation =
        "Good organic matter levels. Maintain with regular organic additions.";
    } else {
      rating = "Very Good";
      recommendation =
        "Excellent organic matter levels. Continue current management practices.";
    }

    return { value: om, rating, recommendation };
  }

  private static analyzeNitrogen(n: number) {
    let rating: string;
    let recommendation: string;

    if (n < 20) {
      rating = "Low";
      recommendation =
        "Apply nitrogen fertilizer or organic nitrogen sources like compost or manure.";
    } else if (n < 40) {
      rating = "Moderate";
      recommendation =
        "Adequate nitrogen for most crops. Monitor based on crop requirements.";
    } else if (n < 60) {
      rating = "Good";
      recommendation =
        "Good nitrogen levels. Adjust applications based on specific crop needs.";
    } else {
      rating = "High";
      recommendation =
        "High nitrogen levels. Reduce applications to prevent environmental issues.";
    }

    return { value: n, rating, recommendation };
  }

  private static analyzePhosphorus(p: number) {
    let rating: string;
    let recommendation: string;

    if (p < 15) {
      rating = "Low";
      recommendation =
        "Apply phosphorus fertilizer. Rock phosphate or bone meal for organic systems.";
    } else if (p < 30) {
      rating = "Moderate";
      recommendation =
        "Adequate phosphorus for most crops. Monitor young plant development.";
    } else if (p < 50) {
      rating = "Good";
      recommendation =
        "Good phosphorus levels. Minimal additional applications needed.";
    } else {
      rating = "High";
      recommendation =
        "High phosphorus levels. Avoid additional applications to prevent runoff.";
    }

    return { value: p, rating, recommendation };
  }

  private static analyzePotassium(k: number) {
    let rating: string;
    let recommendation: string;

    if (k < 150) {
      rating = "Low";
      recommendation =
        "Apply potassium fertilizer. Potash or wood ash for organic systems.";
    } else if (k < 300) {
      rating = "Moderate";
      recommendation =
        "Adequate potassium for most crops. Monitor for stress symptoms.";
    } else if (k < 500) {
      rating = "Good";
      recommendation =
        "Good potassium levels. Minimal additional applications needed.";
    } else {
      rating = "High";
      recommendation =
        "High potassium levels. Reduce applications and monitor crop quality.";
    }

    return { value: k, rating, recommendation };
  }

  private static calculateOverallHealth(soilTest: SoilTest) {
    let score = 0;
    const issues: string[] = [];

    // pH score (25% of total)
    if (soilTest.pH >= 6.0 && soilTest.pH <= 7.0) {
      score += 25;
    } else if (soilTest.pH >= 5.5 && soilTest.pH <= 7.5) {
      score += 20;
    } else if (soilTest.pH >= 5.0 && soilTest.pH <= 8.0) {
      score += 15;
    } else {
      score += 5;
      issues.push(soilTest.pH < 5.5 ? "Soil too acidic" : "Soil too alkaline");
    }

    // Organic matter score (30% of total)
    if (soilTest.organicMatter >= 4.0) {
      score += 30;
    } else if (soilTest.organicMatter >= 3.0) {
      score += 25;
    } else if (soilTest.organicMatter >= 2.0) {
      score += 15;
    } else {
      score += 5;
      issues.push("Low organic matter");
    }

    // Nutrient balance score (45% of total)
    let nutrientScore = 0;

    // Nitrogen (15% of total)
    if (soilTest.nitrogen >= 20 && soilTest.nitrogen <= 60) {
      nutrientScore += 15;
    } else if (soilTest.nitrogen >= 15 || soilTest.nitrogen <= 80) {
      nutrientScore += 10;
    } else {
      nutrientScore += 5;
      issues.push(
        soilTest.nitrogen < 15 ? "Low nitrogen" : "Excessive nitrogen"
      );
    }

    // Phosphorus (15% of total)
    if (soilTest.phosphorus >= 15 && soilTest.phosphorus <= 50) {
      nutrientScore += 15;
    } else if (soilTest.phosphorus >= 10 || soilTest.phosphorus <= 70) {
      nutrientScore += 10;
    } else {
      nutrientScore += 5;
      issues.push(
        soilTest.phosphorus < 10 ? "Low phosphorus" : "Excessive phosphorus"
      );
    }

    // Potassium (15% of total)
    if (soilTest.potassium >= 150 && soilTest.potassium <= 500) {
      nutrientScore += 15;
    } else if (soilTest.potassium >= 100 || soilTest.potassium <= 600) {
      nutrientScore += 10;
    } else {
      nutrientScore += 5;
      issues.push(
        soilTest.potassium < 100 ? "Low potassium" : "Excessive potassium"
      );
    }

    score += nutrientScore;

    let rating: "Poor" | "Fair" | "Good" | "Excellent";
    if (score >= 85) rating = "Excellent";
    else if (score >= 70) rating = "Good";
    else if (score >= 50) rating = "Fair";
    else rating = "Poor";

    return { score, rating, primaryIssues: issues };
  }

  static generateSoilRecommendations(soilTest: SoilTest): SoilRecommendation {
    const analysis = this.analyzeSoilTest(soilTest);
    const recommendations: SoilRecommendation = {
      amendments: [],
      practices: [],
      cropSuitability: [],
    };

    // Amendment recommendations based on analysis
    if (analysis.pH.rating === "Very Low" || analysis.pH.rating === "Low") {
      recommendations.amendments.push({
        type: "Agricultural Lime",
        rate: soilTest.pH < 5.5 ? 2000 : 1000,
        unit: "lbs/acre",
        timing: "Fall application, 3-6 months before planting",
        purpose: "Raise soil pH and improve nutrient availability",
      });
    }

    if (analysis.pH.rating === "Very High") {
      recommendations.amendments.push({
        type: "Sulfur",
        rate: 300,
        unit: "lbs/acre",
        timing: "Fall application",
        purpose: "Lower soil pH to improve nutrient availability",
      });
    }

    if (
      analysis.organicMatter.rating === "Very Low" ||
      analysis.organicMatter.rating === "Low"
    ) {
      recommendations.amendments.push({
        type: "Compost",
        rate: 2,
        unit: "tons/acre",
        timing: "Spring or fall application",
        purpose: "Increase organic matter and improve soil structure",
      });
    }

    if (analysis.nutrients.nitrogen.rating === "Low") {
      recommendations.amendments.push({
        type: "Nitrogen Fertilizer (Urea)",
        rate: 100,
        unit: "lbs/acre",
        timing: "Split application: at planting and side-dress",
        purpose: "Meet crop nitrogen requirements",
      });
    }

    if (analysis.nutrients.phosphorus.rating === "Low") {
      recommendations.amendments.push({
        type: "Phosphate Fertilizer",
        rate: 80,
        unit: "lbs P2O5/acre",
        timing: "Pre-plant application",
        purpose: "Support root development and energy transfer",
      });
    }

    if (analysis.nutrients.potassium.rating === "Low") {
      recommendations.amendments.push({
        type: "Potash Fertilizer",
        rate: 100,
        unit: "lbs K2O/acre",
        timing: "Pre-plant or split application",
        purpose: "Improve disease resistance and crop quality",
      });
    }

    // Management practice recommendations
    if (analysis.organicMatter.value < 3.0) {
      recommendations.practices.push({
        practice: "Cover Cropping",
        description:
          "Plant cover crops in fallow periods to add organic matter and prevent erosion",
        timeline: "Fall seeding, spring termination",
      });
    }

    if (analysis.overallHealth.score < 70) {
      recommendations.practices.push({
        practice: "Reduced Tillage",
        description:
          "Minimize soil disturbance to preserve soil structure and organic matter",
        timeline: "Ongoing management practice",
      });
    }

    recommendations.practices.push({
      practice: "Regular Soil Testing",
      description:
        "Test soil every 2-3 years to monitor changes and adjust management",
      timeline: "Bi-annual or tri-annual",
    });

    // Crop suitability recommendations
    const cropSuitability = this.assessCropSuitability(soilTest);
    recommendations.cropSuitability = cropSuitability;

    return recommendations;
  }

  private static assessCropSuitability(soilTest: SoilTest) {
    const suitability = [];

    // Corn
    let cornSuitability: "Excellent" | "Good" | "Fair" | "Poor" = "Good";
    let cornNotes = "";
    if (soilTest.pH < 6.0 || soilTest.pH > 7.0) {
      cornSuitability = "Fair";
      cornNotes = "pH not optimal for corn production";
    }
    if (soilTest.nitrogen < 25) {
      cornSuitability = "Fair";
      cornNotes += cornNotes ? "; Low nitrogen" : "Low nitrogen";
    }
    suitability.push({
      cropType: "Corn",
      suitability: cornSuitability,
      notes: cornNotes || "Good conditions for corn production",
    });

    // Soybeans
    let soybeanSuitability: "Excellent" | "Good" | "Fair" | "Poor" = "Good";
    let soybeanNotes = "";
    if (soilTest.pH < 6.0 || soilTest.pH > 7.0) {
      soybeanSuitability = "Fair";
      soybeanNotes = "pH not optimal for soybeans";
    }
    suitability.push({
      cropType: "Soybeans",
      suitability: soybeanSuitability,
      notes: soybeanNotes || "Good conditions for soybean production",
    });

    // Tomatoes
    let tomatoSuitability: "Excellent" | "Good" | "Fair" | "Poor" = "Good";
    let tomatoNotes = "";
    if (soilTest.pH < 6.0 || soilTest.pH > 7.0) {
      tomatoSuitability = "Fair";
      tomatoNotes = "pH should be 6.0-7.0 for tomatoes";
    }
    if (soilTest.organicMatter < 3.0) {
      tomatoSuitability = "Fair";
      tomatoNotes += tomatoNotes
        ? "; Low organic matter"
        : "Low organic matter";
    }
    suitability.push({
      cropType: "Tomatoes",
      suitability: tomatoSuitability,
      notes: tomatoNotes || "Good conditions for tomato production",
    });

    return suitability;
  }

  // Soil Health Trends
  static async getSoilHealthTrends(
    userId: string,
    fieldId?: string,
    timeframe: "year" | "two-years" | "five-years" = "year"
  ) {
    try {
      const endDate = new Date();
      const startDate = new Date();

      switch (timeframe) {
        case "year":
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        case "two-years":
          startDate.setFullYear(endDate.getFullYear() - 2);
          break;
        case "five-years":
          startDate.setFullYear(endDate.getFullYear() - 5);
          break;
      }

      const where: any = {
        userId,
        sampleDate: {
          gte: startDate,
          lte: endDate,
        },
      };

      if (fieldId) where.fieldId = fieldId;

      const soilTests = await prisma.soilTest.findMany({
        where,
        orderBy: { sampleDate: "asc" },
        include: {
          field: true,
        },
      });

      return soilTests.map((test) => ({
        date: test.sampleDate,
        pH: test.pH,
        organicMatter: test.organicMatter,
        nitrogen: test.nitrogen,
        phosphorus: test.phosphorus,
        potassium: test.potassium,
        fieldName: test.field?.name || "Unknown Field",
        overallHealth: this.calculateOverallHealth(test as SoilTest).score,
      }));
    } catch (error) {
      console.error("Error fetching soil health trends:", error);
      throw new Error("Failed to fetch soil health trends");
    }
  }
}
