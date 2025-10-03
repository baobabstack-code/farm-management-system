/**
 * Weather Service for AI Insights
 * Provides weather data integration for smart farming recommendations
 */

export interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  pressure: number;
  uvIndex: number;
  visibility: number;
  condition: string;
  timestamp: string;
}

export interface WeatherForecast {
  date: string;
  high: number;
  low: number;
  precipitation: number;
  precipitationChance: number;
  humidity: number;
  condition: string;
}

export interface WeatherInsights {
  currentConditions: WeatherData;
  forecast: WeatherForecast[];
  farmingRecommendations: string[];
  alerts: WeatherAlert[];
}

export interface WeatherAlert {
  type: "warning" | "advisory" | "watch";
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  validUntil: string;
}

class WeatherService {
  private apiKey: string | undefined;
  private baseUrl = "https://api.openweathermap.org/data/2.5";

  constructor() {
    this.apiKey = process.env.WEATHER_API_KEY;
  }

  /**
   * Get current weather conditions for a location
   */
  async getCurrentWeather(
    latitude: number,
    longitude: number
  ): Promise<WeatherData | null> {
    if (!this.apiKey) {
      console.warn("Weather API key not configured, using mock data");
      return this.getMockCurrentWeather();
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/weather?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        temperature: data.main.temp,
        humidity: data.main.humidity,
        precipitation: data.rain?.["1h"] || data.snow?.["1h"] || 0,
        windSpeed: data.wind.speed,
        pressure: data.main.pressure,
        uvIndex: 0, // Not available in current weather endpoint
        visibility: data.visibility / 1000, // Convert to km
        condition: data.weather[0].description,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Failed to fetch weather data:", error);
      return this.getMockCurrentWeather();
    }
  }

  /**
   * Get weather forecast for the next 5 days
   */
  async getWeatherForecast(
    latitude: number,
    longitude: number
  ): Promise<WeatherForecast[]> {
    if (!this.apiKey) {
      console.warn("Weather API key not configured, using mock data");
      return this.getMockForecast();
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/forecast?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`Weather forecast API error: ${response.status}`);
      }

      const data = await response.json();

      // Group forecast by day and take daily highs/lows
      const dailyForecasts = this.processForecastData(data.list);

      return dailyForecasts.slice(0, 5); // Next 5 days
    } catch (error) {
      console.error("Failed to fetch weather forecast:", error);
      return this.getMockForecast();
    }
  }

  /**
   * Get comprehensive weather insights with farming recommendations
   */
  async getWeatherInsights(
    latitude: number,
    longitude: number
  ): Promise<WeatherInsights> {
    const [currentWeather, forecast] = await Promise.all([
      this.getCurrentWeather(latitude, longitude),
      this.getWeatherForecast(latitude, longitude),
    ]);

    const currentConditions = currentWeather || this.getMockCurrentWeather();
    const forecastData =
      forecast.length > 0 ? forecast : this.getMockForecast();

    const farmingRecommendations = this.generateFarmingRecommendations(
      currentConditions,
      forecastData
    );
    const alerts = this.generateWeatherAlerts(currentConditions, forecastData);

    return {
      currentConditions,
      forecast: forecastData,
      farmingRecommendations,
      alerts,
    };
  }

  /**
   * Generate farming-specific recommendations based on weather data
   */
  private generateFarmingRecommendations(
    current: WeatherData,
    forecast: WeatherForecast[]
  ): string[] {
    const recommendations: string[] = [];

    // Temperature-based recommendations
    if (current.temperature > 30) {
      recommendations.push(
        "High temperature detected. Increase irrigation frequency and consider shade protection for sensitive crops."
      );
    } else if (current.temperature < 5) {
      recommendations.push(
        "Low temperature warning. Protect tender crops from frost damage with covers or bring potted plants indoors."
      );
    }

    // Humidity recommendations
    if (current.humidity > 80) {
      recommendations.push(
        "High humidity levels may promote fungal diseases. Improve air circulation and monitor crops closely."
      );
    } else if (current.humidity < 30) {
      recommendations.push(
        "Low humidity conditions. Increase watering frequency and consider misting for humidity-loving plants."
      );
    }

    // Precipitation recommendations
    const upcomingRain = forecast.some((day) => day.precipitationChance > 60);
    if (upcomingRain) {
      recommendations.push(
        "Rain expected in the coming days. Delay irrigation and prepare drainage systems if needed."
      );
    } else if (current.precipitation === 0 && !upcomingRain) {
      recommendations.push(
        "No rainfall expected. Ensure adequate irrigation schedule is maintained."
      );
    }

    // Wind recommendations
    if (current.windSpeed > 15) {
      recommendations.push(
        "Strong winds detected. Secure tall plants with stakes and protect delicate seedlings."
      );
    }

    // Seasonal recommendations
    const season = this.getCurrentSeason();
    if (season === "spring") {
      recommendations.push(
        "Spring conditions ideal for planting. Consider starting warm-season crops."
      );
    } else if (season === "summer") {
      recommendations.push(
        "Summer heat stress period. Focus on heat-tolerant varieties and consistent watering."
      );
    } else if (season === "fall") {
      recommendations.push(
        "Fall planting season. Good time for cool-season crops and harvest preparation."
      );
    } else if (season === "winter") {
      recommendations.push(
        "Winter dormancy period. Protect plants from frost and plan for spring planting."
      );
    }

    return recommendations;
  }

  /**
   * Generate weather alerts for farming operations
   */
  private generateWeatherAlerts(
    current: WeatherData,
    forecast: WeatherForecast[]
  ): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];

    // Frost warning
    if (forecast.some((day) => day.low < 2)) {
      alerts.push({
        type: "warning",
        title: "Frost Warning",
        description:
          "Temperatures may drop below freezing in the coming days. Protect sensitive crops.",
        severity: "high",
        validUntil: new Date(
          Date.now() + 3 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
    }

    // Drought conditions
    const recentRain = forecast.reduce(
      (sum, day) => sum + day.precipitation,
      0
    );
    if (recentRain < 5 && current.humidity < 40) {
      alerts.push({
        type: "advisory",
        title: "Dry Conditions Advisory",
        description:
          "Low rainfall and humidity detected. Monitor soil moisture and increase irrigation.",
        severity: "medium",
        validUntil: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
    }

    // Heat stress warning
    if (forecast.some((day) => day.high > 35)) {
      alerts.push({
        type: "warning",
        title: "Heat Stress Warning",
        description:
          "Extreme heat expected. Provide shade and increase watering for crops.",
        severity: "high",
        validUntil: new Date(
          Date.now() + 2 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
    }

    // Heavy rain advisory
    if (forecast.some((day) => day.precipitation > 25)) {
      alerts.push({
        type: "advisory",
        title: "Heavy Rainfall Expected",
        description:
          "Significant rainfall forecasted. Ensure proper drainage and avoid overwatering.",
        severity: "medium",
        validUntil: new Date(
          Date.now() + 2 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
    }

    return alerts;
  }

  /**
   * Process raw forecast data into daily summaries
   */
  private processForecastData(forecastList: any[]): WeatherForecast[] {
    const dailyData: { [key: string]: any } = {};

    forecastList.forEach((item) => {
      const date = item.dt_txt.split(" ")[0]; // Get just the date part

      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          highs: [],
          lows: [],
          precipitation: [],
          precipitationChance: [],
          humidity: [],
          conditions: [],
        };
      }

      dailyData[date].highs.push(item.main.temp_max);
      dailyData[date].lows.push(item.main.temp_min);
      dailyData[date].precipitation.push(
        item.rain?.["3h"] || item.snow?.["3h"] || 0
      );
      dailyData[date].precipitationChance.push(item.pop * 100);
      dailyData[date].humidity.push(item.main.humidity);
      dailyData[date].conditions.push(item.weather[0].description);
    });

    return Object.values(dailyData).map((day: any) => ({
      date: day.date,
      high: Math.max(...day.highs),
      low: Math.min(...day.lows),
      precipitation: Math.max(...day.precipitation),
      precipitationChance: Math.max(...day.precipitationChance),
      humidity:
        day.humidity.reduce((sum: number, h: number) => sum + h, 0) /
        day.humidity.length,
      condition: day.conditions[0], // Use first condition of the day
    }));
  }

  /**
   * Get current season based on month
   */
  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return "spring";
    if (month >= 5 && month <= 7) return "summer";
    if (month >= 8 && month <= 10) return "fall";
    return "winter";
  }

  /**
   * Mock weather data for development/fallback
   */
  private getMockCurrentWeather(): WeatherData {
    return {
      temperature: 22 + Math.random() * 8, // 22-30°C
      humidity: 60 + Math.random() * 20, // 60-80%
      precipitation: Math.random() > 0.8 ? Math.random() * 5 : 0,
      windSpeed: 5 + Math.random() * 10, // 5-15 km/h
      pressure: 1010 + Math.random() * 20, // 1010-1030 hPa
      uvIndex: 6 + Math.random() * 4, // 6-10
      visibility: 8 + Math.random() * 2, // 8-10 km
      condition: ["clear", "partly cloudy", "cloudy", "light rain"][
        Math.floor(Math.random() * 4)
      ],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Mock forecast data for development/fallback
   */
  private getMockForecast(): WeatherForecast[] {
    const forecast: WeatherForecast[] = [];

    for (let i = 1; i <= 5; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      forecast.push({
        date: date.toISOString().split("T")[0],
        high: 20 + Math.random() * 12,
        low: 8 + Math.random() * 10,
        precipitation: Math.random() > 0.6 ? Math.random() * 10 : 0,
        precipitationChance: Math.random() * 100,
        humidity: 50 + Math.random() * 30,
        condition: ["sunny", "partly cloudy", "cloudy", "rainy"][
          Math.floor(Math.random() * 4)
        ],
      });
    }

    return forecast;
  }

  /**
   * Get weather-based crop recommendations
   */
  async getCropRecommendations(
    latitude: number,
    longitude: number
  ): Promise<string[]> {
    const insights = await this.getWeatherInsights(latitude, longitude);
    const recommendations: string[] = [];

    // Season-based planting recommendations
    const season = this.getCurrentSeason();
    const temp = insights.currentConditions.temperature;

    if (season === "spring" && temp > 15) {
      recommendations.push(
        "Ideal conditions for planting tomatoes, peppers, and warm-season vegetables."
      );
      recommendations.push("Consider starting herbs like basil and oregano.");
    } else if (season === "fall" && temp < 20) {
      recommendations.push(
        "Perfect time for cool-season crops like lettuce, spinach, and broccoli."
      );
      recommendations.push("Plant garlic and onions for next year's harvest.");
    }

    // Weather condition specific recommendations
    if (insights.currentConditions.humidity > 70) {
      recommendations.push(
        "High humidity - avoid crops prone to fungal diseases or improve ventilation."
      );
    }

    if (insights.forecast.some((day) => day.precipitationChance > 70)) {
      recommendations.push(
        "Rain expected - delay planting of seeds that may rot in wet conditions."
      );
    }

    return recommendations;
  }
}

export const weatherService = new WeatherService();
