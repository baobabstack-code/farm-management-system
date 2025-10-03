import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { weatherService } from "@/lib/services/weather";
import { AIDataBridge } from "@/lib/ai-bridge/data-access";

/**
 * Weather-Aware AI Insights API
 * Combines farm data with weather conditions for intelligent recommendations
 */
export async function POST(request: NextRequest) {
  try {
    // Check if weather-aware insights are enabled
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

    const { latitude, longitude, analysisType } = await request.json();

    // Validate location data
    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: "Location coordinates are required" },
        { status: 400 }
      );
    }

    // Get weather insights and farm data in parallel
    const [weatherInsights, cropData, financialData] = await Promise.all([
      weatherService.getWeatherInsights(latitude, longitude),
      AIDataBridge.getCropData(userId),
      AIDataBridge.getFinancialSummary(userId),
    ]);

    if (!cropData.success || !financialData.success) {
      return NextResponse.json(
        { error: "Failed to fetch farm data" },
        { status: 500 }
      );
    }

    // Generate weather-aware insights
    const insights = generateWeatherAwareInsights(
      weatherInsights,
      (cropData.data || []).map((crop) => ({
        name: crop.name,
        id: crop.id,
        status: crop.status,
        expectedHarvestDate:
          crop.expectedHarvestDate &&
          typeof crop.expectedHarvestDate.toISOString === "function"
            ? crop.expectedHarvestDate.toISOString()
            : typeof crop.expectedHarvestDate === "string"
              ? crop.expectedHarvestDate
              : undefined,
      })),
      financialData.data || []
    );

    return NextResponse.json({
      success: true,
      data: {
        insights,
        weather: {
          current: weatherInsights.currentConditions,
          forecast: weatherInsights.forecast.slice(0, 3), // Next 3 days
          alerts: weatherInsights.alerts,
          recommendations: weatherInsights.farmingRecommendations,
        },
        location: { latitude, longitude },
        analysisType: analysisType || "comprehensive",
      },
      timestamp: new Date().toISOString(),
      source: "ai-weather-insights",
    });
  } catch (error) {
    console.error("Weather-aware AI insights error:", error);
    return NextResponse.json(
      { error: "Failed to generate weather-aware insights" },
      { status: 500 }
    );
  }
}

interface WeatherAwareInsight {
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  priority: "High" | "Medium" | "Low";
  category: string;
  weatherFactor: string;
  urgency?: "Immediate" | "This Week" | "This Month";
}

import {
  WeatherInsights,
  WeatherForecast,
  WeatherAlert,
} from "@/lib/services/weather";
type Activity = {
  type: string;
  cost: number;
  createdAt: Date;
  crop: { name: string; id: string };
};

function generateWeatherAwareInsights(
  weather: WeatherInsights,
  crops: {
    name: string;
    id: string;
    status?: string;
    expectedHarvestDate?: string;
  }[],
  activities: Activity[]
): WeatherAwareInsight[] {
  const insights: WeatherAwareInsight[] = [];
  const current = weather.currentConditions;
  const forecast = weather.forecast;
  const alerts = weather.alerts;

  // 1. Immediate Weather-Based Actions
  if (current.temperature > 30) {
    insights.push({
      title: "Heat Stress Prevention Required",
      description: `Current temperature of ${Math.round(current.temperature)}°C requires immediate action. Increase irrigation frequency and provide shade for sensitive crops.`,
      confidence: 0.9,
      actionable: true,
      priority: "High",
      category: "irrigation",
      weatherFactor: "high_temperature",
      urgency: "Immediate",
    });
  }

  if (
    current.temperature < 5 &&
    crops.some((crop) => crop.status === "PLANTED")
  ) {
    insights.push({
      title: "Frost Protection Needed",
      description: `Temperature of ${Math.round(current.temperature)}°C threatens sensitive crops. Use row covers, cold frames, or bring container plants indoors.`,
      confidence: 0.95,
      actionable: true,
      priority: "High",
      category: "protection",
      weatherFactor: "low_temperature",
      urgency: "Immediate",
    });
  }

  // 2. Precipitation-Based Insights
  const upcomingRain = forecast.some(
    (day: WeatherForecast) => day.precipitationChance > 70
  );
  const recentIrrigation = activities.filter(
    (a) =>
      a.type === "IRRIGATION" &&
      new Date(a.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );

  if (upcomingRain && recentIrrigation.length > 2) {
    insights.push({
      title: "Adjust Irrigation Schedule",
      description: `${Math.round(Math.max(...forecast.map((d: WeatherForecast) => d.precipitationChance)))}% chance of rain expected. Skip scheduled irrigation to prevent overwatering and save resources.`,
      confidence: 0.85,
      actionable: true,
      priority: "Medium",
      category: "irrigation",
      weatherFactor: "incoming_precipitation",
      urgency: "This Week",
    });
  }

  if (
    !upcomingRain &&
    current.precipitation === 0 &&
    recentIrrigation.length === 0
  ) {
    insights.push({
      title: "Irrigation Schedule Recommended",
      description:
        "No rainfall expected in the next 5 days and no recent irrigation recorded. Establish a watering schedule to prevent drought stress.",
      confidence: 0.8,
      actionable: true,
      priority: "High",
      category: "irrigation",
      weatherFactor: "no_precipitation",
      urgency: "This Week",
    });
  }

  // 3. Humidity-Based Plant Health Insights
  if (current.humidity > 80 && crops.length > 0) {
    const susceptibleCrops = crops.filter((crop) =>
      ["tomato", "cucumber", "squash"].some((name) =>
        crop.name.toLowerCase().includes(name)
      )
    );

    if (susceptibleCrops.length > 0) {
      insights.push({
        title: "Fungal Disease Prevention",
        description: `High humidity (${Math.round(current.humidity)}%) increases fungal disease risk for ${susceptibleCrops.map((c) => c.name).join(", ")}. Improve air circulation and monitor closely.`,
        confidence: 0.8,
        actionable: true,
        priority: "Medium",
        category: "monitoring",
        weatherFactor: "high_humidity",
        urgency: "This Week",
      });
    }
  }

  // 4. Wind-Based Insights
  if (current.windSpeed > 15) {
    const tallCrops = crops.filter((crop) =>
      ["corn", "sunflower", "bean"].some((name) =>
        crop.name.toLowerCase().includes(name)
      )
    );

    if (tallCrops.length > 0) {
      insights.push({
        title: "Secure Tall Plants",
        description: `Strong winds (${Math.round(current.windSpeed)} km/h) detected. Stake or support ${tallCrops.map((c) => c.name).join(", ")} to prevent wind damage.`,
        confidence: 0.9,
        actionable: true,
        priority: "High",
        category: "protection",
        weatherFactor: "strong_winds",
        urgency: "Immediate",
      });
    }
  }

  // 5. Seasonal Planting Insights
  const season = getCurrentSeason();
  const temp = current.temperature;

  if (season === "spring" && temp > 15 && temp < 25) {
    insights.push({
      title: "Optimal Spring Planting Conditions",
      description: `Perfect temperature (${Math.round(temp)}°C) for warm-season crops. Consider planting tomatoes, peppers, basil, and other heat-loving plants.`,
      confidence: 0.85,
      actionable: true,
      priority: "Medium",
      category: "planning",
      weatherFactor: "optimal_temperature",
      urgency: "This Month",
    });
  }

  // 6. Weather Alert Integration
  alerts.forEach((alert: WeatherAlert) => {
    if (alert.severity === "high") {
      insights.push({
        title: alert.title,
        description: `${alert.description} Recommended action: Review and protect vulnerable crops immediately.`,
        confidence: 0.9,
        actionable: true,
        priority: "High",
        category: "alert",
        weatherFactor: alert.type,
        urgency: "Immediate",
      });
    }
  });

  // 7. Cost Optimization with Weather Context
  if (activities.length > 5) {
    const irrigationCosts = activities
      .filter((a) => a.type === "IRRIGATION")
      .reduce((sum, a) => sum + (a.cost || 0), 0);

    if (irrigationCosts > 200 && upcomingRain) {
      insights.push({
        title: "Weather-Based Cost Savings",
        description: `Recent irrigation costs ($${Math.round(irrigationCosts)}) can be reduced. With ${Math.round(Math.max(...forecast.map((d: { precipitationChance: number }) => d.precipitationChance)))}% rain chance, delay irrigation for potential savings.`,
        confidence: 0.75,
        actionable: true,
        priority: "Medium",
        category: "financial",
        weatherFactor: "rain_forecast",
        urgency: "This Week",
      });
    }
  }

  // 8. Harvest Timing with Weather
  const harvestReadyCrops = crops.filter((crop) => {
    const harvestDate = crop.expectedHarvestDate
      ? new Date(crop.expectedHarvestDate)
      : null;
    const now = new Date();
    if (!harvestDate) return false;
    const daysDiff = Math.ceil(
      (harvestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysDiff <= 7 && daysDiff >= 0 && crop.status !== "HARVESTED";
  });

  if (harvestReadyCrops.length > 0) {
    const heavyRain = forecast.some(
      (day: WeatherForecast) => day.precipitation > 20
    );

    if (heavyRain) {
      insights.push({
        title: "Harvest Before Rain",
        description: `${harvestReadyCrops.map((c) => c.name).join(", ")} ready for harvest. Heavy rain (${Math.round(Math.max(...forecast.map((d: WeatherForecast) => d.precipitation)))}mm) expected - harvest soon to prevent quality loss.`,
        confidence: 0.9,
        actionable: true,
        priority: "High",
        category: "harvest",
        weatherFactor: "heavy_rain_forecast",
        urgency: "Immediate",
      });
    }
  }

  // Sort insights by priority and urgency
  return insights
    .sort((a, b) => {
      const urgencyOrder = { Immediate: 3, "This Week": 2, "This Month": 1 };
      const priorityOrder = { High: 3, Medium: 2, Low: 1 };

      const urgencyDiff =
        urgencyOrder[b.urgency || "This Month"] -
        urgencyOrder[a.urgency || "This Month"];
      if (urgencyDiff !== 0) return urgencyDiff;

      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
    .slice(0, 6); // Return top 6 insights
}

function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}
