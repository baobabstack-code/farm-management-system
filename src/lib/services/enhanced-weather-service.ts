import { WeatherService } from "./weather-service";
import { WeatherData, WeatherForecast, WeatherAlert } from "@/types";
import { prisma } from "@/lib/prisma";

export interface AgricultureWeatherInsight {
  id: string;
  category:
    | "irrigation"
    | "spraying"
    | "planting"
    | "harvesting"
    | "fieldwork"
    | "protection";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  recommendation: string;
  validUntil: Date;
  fieldConditions?: string;
  cropStages?: string[];
  weatherFactors: string[];
}

export interface WeatherConditions {
  current: WeatherData;
  forecast: WeatherForecast[];
  alerts: WeatherAlert[];
  insights: AgricultureWeatherInsight[];
  soilConditions: {
    moistureLevel: "very_low" | "low" | "optimal" | "high" | "saturated";
    temperature: number;
    evapotranspiration: number;
  };
  sprayConditions: {
    suitability: "excellent" | "good" | "fair" | "poor" | "unsuitable";
    windSpeed: number;
    temperature: number;
    humidity: number;
    recommendation: string;
  };
  harvestConditions: {
    suitability: "excellent" | "good" | "fair" | "poor" | "unsuitable";
    dryDays: number;
    soilMoisture: string;
    recommendation: string;
  };
}

export class EnhancedWeatherService extends WeatherService {
  static async getComprehensiveWeatherData(
    latitude: number,
    longitude: number,
    location: string,
    userId: string
  ): Promise<WeatherConditions> {
    // Get basic weather data
    const current = await this.getCurrentWeather(latitude, longitude, location);
    const forecast = await this.getWeatherForecast(
      latitude,
      longitude,
      location,
      7
    );
    const alerts = await this.analyzeWeatherAlerts(userId, current, forecast);

    // Generate agricultural insights
    const insights = await this.generateAgriculturalInsights(
      current,
      forecast,
      alerts
    );

    // Calculate soil conditions
    const soilConditions = await this.calculateSoilConditions(
      current,
      forecast
    );

    // Analyze spray conditions
    const sprayConditions = this.analyzeSprayConditions(current, forecast);

    // Analyze harvest conditions
    const harvestConditions = this.analyzeHarvestConditions(current, forecast);

    return {
      current,
      forecast,
      alerts,
      insights,
      soilConditions,
      sprayConditions,
      harvestConditions,
    };
  }

  static async generateAgriculturalInsights(
    current: WeatherData,
    forecast: WeatherForecast[],
    alerts: WeatherAlert[]
  ): Promise<AgricultureWeatherInsight[]> {
    const insights: AgricultureWeatherInsight[] = [];
    const now = new Date();

    // Irrigation recommendations
    const avgTemp =
      forecast
        .slice(0, 3)
        .reduce((sum, f) => sum + (f.tempMax + f.tempMin) / 2, 0) / 3;
    const totalPrecip = forecast
      .slice(0, 3)
      .reduce((sum, f) => sum + f.precipitation, 0);
    const avgHumidity =
      forecast.slice(0, 3).reduce((sum, f) => sum + f.humidity, 0) / 3;

    if (avgTemp > 25 && totalPrecip < 5 && avgHumidity < 60) {
      insights.push({
        id: `irrigation-${now.getTime()}`,
        category: "irrigation",
        priority: "high",
        title: "Increase Irrigation",
        description: "Hot, dry conditions expected over the next 3 days",
        recommendation: `Increase irrigation frequency. Expected temperature: ${Math.round(avgTemp)}°C, minimal rainfall (${Math.round(totalPrecip)}mm), low humidity (${Math.round(avgHumidity)}%)`,
        validUntil: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        fieldConditions: "Soil moisture likely decreasing rapidly",
        cropStages: ["flowering", "fruit_development", "grain_filling"],
        weatherFactors: [
          "high_temperature",
          "low_humidity",
          "minimal_precipitation",
        ],
      });
    }

    // Spraying window recommendations
    const goodSprayDays = forecast.filter(
      (f) =>
        f.windSpeed < 10 && // Less than 10 m/s
        f.tempMax < 30 &&
        f.tempMin > 5 && // Moderate temperatures
        f.precipitationChance < 30 // Low chance of rain
    );

    if (goodSprayDays.length > 0) {
      const nextSprayDay = goodSprayDays[0];
      insights.push({
        id: `spraying-${now.getTime()}`,
        category: "spraying",
        priority: "medium",
        title: "Optimal Spraying Window",
        description: `Good conditions for spraying on ${nextSprayDay.forecastDate.toDateString()}`,
        recommendation: `Wind: ${nextSprayDay.windSpeed}m/s, Temperature: ${Math.round((nextSprayDay.tempMax + nextSprayDay.tempMin) / 2)}°C, Rain chance: ${nextSprayDay.precipitationChance}%`,
        validUntil: new Date(
          nextSprayDay.forecastDate.getTime() + 24 * 60 * 60 * 1000
        ),
        fieldConditions: "Good spray retention expected",
        weatherFactors: [
          "low_wind",
          "moderate_temperature",
          "low_precipitation_chance",
        ],
      });
    }

    // Frost protection
    const frostRisk = forecast.filter((f) => f.tempMin <= 3);
    if (frostRisk.length > 0) {
      const frostDate = frostRisk[0];
      insights.push({
        id: `frost-protection-${now.getTime()}`,
        category: "protection",
        priority: "critical",
        title: "Frost Protection Needed",
        description: `Frost risk on ${frostDate.forecastDate.toDateString()}`,
        recommendation: `Minimum temperature: ${frostDate.tempMin}°C. Consider frost protection measures like irrigation, covers, or heaters`,
        validUntil: new Date(
          frostDate.forecastDate.getTime() + 24 * 60 * 60 * 1000
        ),
        fieldConditions: "Crop damage risk high",
        cropStages: ["seedling", "flowering", "young_fruit"],
        weatherFactors: ["low_temperature"],
      });
    }

    // Field work conditions
    const dryDays = forecast.filter(
      (f) => f.precipitationChance < 20 && f.precipitation < 1
    );
    if (dryDays.length >= 2) {
      insights.push({
        id: `fieldwork-${now.getTime()}`,
        category: "fieldwork",
        priority: "medium",
        title: "Good Field Work Window",
        description: `${dryDays.length} consecutive dry days expected`,
        recommendation:
          "Good opportunity for tillage, planting, or harvest operations",
        validUntil: new Date(
          dryDays[dryDays.length - 1].forecastDate.getTime() +
            24 * 60 * 60 * 1000
        ),
        fieldConditions: "Soil conditions should be workable",
        weatherFactors: ["low_precipitation", "low_precipitation_chance"],
      });
    }

    // Disease pressure warnings
    const highHumidityDays = forecast.filter(
      (f) => f.humidity > 80 && f.tempMax > 20 && f.tempMax < 30
    );
    if (highHumidityDays.length >= 2) {
      insights.push({
        id: `disease-pressure-${now.getTime()}`,
        category: "protection",
        priority: "high",
        title: "Increased Disease Pressure",
        description: "Warm, humid conditions favor disease development",
        recommendation:
          "Monitor crops closely for disease symptoms. Consider preventive fungicide applications",
        validUntil: new Date(
          highHumidityDays[highHumidityDays.length - 1].forecastDate.getTime() +
            24 * 60 * 60 * 1000
        ),
        fieldConditions: "High disease pressure conditions",
        cropStages: ["vegetative", "flowering", "fruit_development"],
        weatherFactors: ["high_humidity", "moderate_temperature"],
      });
    }

    return insights;
  }

  static async calculateSoilConditions(
    current: WeatherData,
    forecast: WeatherForecast[]
  ): Promise<WeatherConditions["soilConditions"]> {
    // Calculate evapotranspiration
    const et = await this.calculateEvapotranspiration(
      current.temperature,
      current.humidity,
      current.windSpeed,
      0 // Simplified - would need solar radiation data
    );

    // Estimate soil moisture based on recent precipitation and ET
    const recentPrecip = forecast
      .slice(0, 3)
      .reduce((sum, f) => sum + f.precipitation, 0);
    const avgET = et * 3; // 3 days

    let moistureLevel: "very_low" | "low" | "optimal" | "high" | "saturated";
    const waterBalance = recentPrecip - avgET;

    if (waterBalance < -20) moistureLevel = "very_low";
    else if (waterBalance < -5) moistureLevel = "low";
    else if (waterBalance > 20) moistureLevel = "saturated";
    else if (waterBalance > 5) moistureLevel = "high";
    else moistureLevel = "optimal";

    // Estimate soil temperature (simplified)
    const soilTemp = current.temperature * 0.8; // Soil temp is typically lower than air temp

    return {
      moistureLevel,
      temperature: soilTemp,
      evapotranspiration: et,
    };
  }

  static analyzeSprayConditions(
    current: WeatherData,
    forecast: WeatherForecast[]
  ): WeatherConditions["sprayConditions"] {
    const { windSpeed, temperature, humidity } = current;
    const nextRain = forecast.find((f) => f.precipitationChance > 50);
    const hoursToRain = nextRain
      ? Math.max(
          0,
          (nextRain.forecastDate.getTime() - Date.now()) / (1000 * 60 * 60)
        )
      : 72;

    let suitability: "excellent" | "good" | "fair" | "poor" | "unsuitable";
    let recommendation: string;

    // Analyze conditions
    const windOk = windSpeed < 15; // m/s
    const tempOk = temperature > 5 && temperature < 30;
    const humidityOk = humidity > 40 && humidity < 90;
    const rainOk = hoursToRain > 2;

    const goodConditions = [windOk, tempOk, humidityOk, rainOk].filter(
      Boolean
    ).length;

    if (goodConditions === 4) {
      suitability = "excellent";
      recommendation =
        "Ideal spraying conditions. Low wind, good temperature range, adequate humidity.";
    } else if (goodConditions === 3) {
      suitability = "good";
      recommendation =
        "Good conditions for spraying with minor considerations.";
    } else if (goodConditions === 2) {
      suitability = "fair";
      recommendation = "Spraying possible but monitor conditions carefully.";
    } else if (goodConditions === 1) {
      suitability = "poor";
      recommendation = "Poor conditions. Consider delaying spray application.";
    } else {
      suitability = "unsuitable";
      recommendation = "Do not spray. Conditions are not suitable.";
    }

    // Add specific warnings
    if (!windOk)
      recommendation += ` High winds (${windSpeed}m/s) may cause drift.`;
    if (!tempOk)
      recommendation += ` Temperature (${temperature}°C) outside optimal range.`;
    if (!rainOk)
      recommendation += ` Rain expected in ${Math.round(hoursToRain)} hours.`;

    return {
      suitability,
      windSpeed,
      temperature,
      humidity,
      recommendation,
    };
  }

  static analyzeHarvestConditions(
    current: WeatherData,
    forecast: WeatherForecast[]
  ): WeatherConditions["harvestConditions"] {
    // Count consecutive dry days
    let dryDays = 0;
    for (const f of forecast) {
      if (f.precipitation < 1 && f.precipitationChance < 30) {
        dryDays++;
      } else {
        break;
      }
    }

    // Check recent precipitation
    const recentRain = forecast
      .slice(0, 2)
      .reduce((sum, f) => sum + f.precipitation, 0);

    let suitability: "excellent" | "good" | "fair" | "poor" | "unsuitable";
    let soilMoisture: string;
    let recommendation: string;

    if (recentRain < 2) {
      soilMoisture = "low";
    } else if (recentRain < 10) {
      soilMoisture = "moderate";
    } else {
      soilMoisture = "high";
    }

    if (dryDays >= 3 && recentRain < 5) {
      suitability = "excellent";
      recommendation =
        "Excellent harvest conditions. Dry weather and low soil moisture.";
    } else if (dryDays >= 2 && recentRain < 10) {
      suitability = "good";
      recommendation =
        "Good harvest conditions. Some field access limitations possible.";
    } else if (dryDays >= 1 && recentRain < 20) {
      suitability = "fair";
      recommendation =
        "Fair conditions. Monitor soil moisture and field accessibility.";
    } else if (recentRain < 30) {
      suitability = "poor";
      recommendation =
        "Poor conditions. Wet fields may limit harvest operations.";
    } else {
      suitability = "unsuitable";
      recommendation =
        "Very wet conditions. Avoid harvest to prevent soil compaction and crop quality issues.";
    }

    return {
      suitability,
      dryDays,
      soilMoisture,
      recommendation,
    };
  }

  static async storeAgricultureInsights(
    insights: AgricultureWeatherInsight[],
    userId: string
  ): Promise<void> {
    try {
      // Note: This would require a new database table for agriculture insights
      // For now, we'll log them - in production, you'd want to store them
      console.log("Agriculture insights for user", userId, ":", insights);

      // TODO: Create AgricultureInsight model in Prisma schema
      // await prisma.agricultureInsight.createMany({
      //   data: insights.map(insight => ({
      //     ...insight,
      //     userId,
      //     weatherFactors: JSON.stringify(insight.weatherFactors),
      //     cropStages: insight.cropStages ? JSON.stringify(insight.cropStages) : null
      //   }))
      // });
    } catch (error) {
      console.error("Error storing agriculture insights:", error);
    }
  }

  static async getHistoricalWeatherTrends(
    latitude: number,
    longitude: number,
    days: number = 30
  ): Promise<{
    averageTemp: number;
    totalPrecipitation: number;
    averageHumidity: number;
    temperatureTrend: { date: string; temp: number }[];
    precipitationTrend: { date: string; precipitation: number }[];
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date(
        endDate.getTime() - days * 24 * 60 * 60 * 1000
      );

      const historicalData = await prisma.weatherData.findMany({
        where: {
          latitude: { gte: latitude - 0.01, lte: latitude + 0.01 },
          longitude: { gte: longitude - 0.01, lte: longitude + 0.01 },
          timestamp: { gte: startDate, lte: endDate },
        },
        orderBy: { timestamp: "asc" },
      });

      if (historicalData.length === 0) {
        return {
          averageTemp: 0,
          totalPrecipitation: 0,
          averageHumidity: 0,
          temperatureTrend: [],
          precipitationTrend: [],
        };
      }

      const averageTemp =
        historicalData.reduce((sum, d) => sum + d.temperature, 0) /
        historicalData.length;
      const totalPrecipitation = historicalData.reduce(
        (sum, d) => sum + d.precipitation,
        0
      );
      const averageHumidity =
        historicalData.reduce((sum, d) => sum + d.humidity, 0) /
        historicalData.length;

      const temperatureTrend = historicalData.map((d) => ({
        date: d.timestamp.toISOString().split("T")[0],
        temp: d.temperature,
      }));

      const precipitationTrend = historicalData.map((d) => ({
        date: d.timestamp.toISOString().split("T")[0],
        precipitation: d.precipitation,
      }));

      return {
        averageTemp,
        totalPrecipitation,
        averageHumidity,
        temperatureTrend,
        precipitationTrend,
      };
    } catch (error) {
      console.error("Error fetching historical weather trends:", error);
      return {
        averageTemp: 0,
        totalPrecipitation: 0,
        averageHumidity: 0,
        temperatureTrend: [],
        precipitationTrend: [],
      };
    }
  }
}
