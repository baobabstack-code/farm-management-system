import axios from "axios";
import { prisma } from "@/lib/prisma";
import {
  WeatherData,
  WeatherForecast,
  WeatherAlert,
  WeatherAlertType,
  WeatherAlertSeverity,
} from "@/types";

export interface OpenWeatherMapResponse {
  coord: { lon: number; lat: number };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  visibility: number;
  wind: { speed: number; deg: number };
  clouds: { all: number };
  dt: number;
  sys: { country: string; sunrise: number; sunset: number };
  name: string;
}

export interface OpenWeatherMapForecastResponse {
  list: Array<{
    dt: number;
    main: {
      temp_min: number;
      temp_max: number;
      humidity: number;
    };
    weather: Array<{ description: string; icon: string }>;
    wind: { speed: number; deg: number };
    pop: number; // Probability of precipitation
    rain?: { "3h": number };
    snow?: { "3h": number };
  }>;
  city: { coord: { lat: number; lon: number }; name: string };
}

export class WeatherService {
  private static readonly API_KEY = process.env.OPENWEATHERMAP_API_KEY;
  private static readonly BASE_URL = "https://api.openweathermap.org/data/2.5";

  static async getCurrentWeather(
    latitude: number,
    longitude: number,
    location: string
  ): Promise<WeatherData> {
    if (!this.API_KEY) {
      throw new Error("OpenWeatherMap API key not configured");
    }

    try {
      const response = await axios.get<OpenWeatherMapResponse>(
        `${this.BASE_URL}/weather`,
        {
          params: {
            lat: latitude,
            lon: longitude,
            appid: this.API_KEY,
            units: "metric",
          },
        }
      );

      const data = response.data;
      const weather = data.weather[0];

      const weatherData: WeatherData = {
        id: `${latitude}-${longitude}-${Date.now()}`,
        location,
        latitude,
        longitude,
        temperature: data.main.temp,
        humidity: data.main.humidity,
        precipitation: 0, // Current weather doesn't include precipitation amount
        windSpeed: data.wind.speed,
        windDirection: data.wind.deg,
        pressure: data.main.pressure,
        uvIndex: 0, // Would need separate UV Index API call
        visibility: data.visibility / 1000, // Convert from meters to km
        description: weather.description,
        icon: weather.icon,
        timestamp: new Date(data.dt * 1000),
      };

      // Store weather data in database
      await this.storeWeatherData(weatherData);

      return weatherData;
    } catch (error) {
      console.error("Error fetching current weather:", error);
      throw new Error("Failed to fetch weather data");
    }
  }

  static async getWeatherForecast(
    latitude: number,
    longitude: number,
    location: string,
    days: number = 5
  ): Promise<WeatherForecast[]> {
    if (!this.API_KEY) {
      throw new Error("OpenWeatherMap API key not configured");
    }

    try {
      const response = await axios.get<OpenWeatherMapForecastResponse>(
        `${this.BASE_URL}/forecast`,
        {
          params: {
            lat: latitude,
            lon: longitude,
            appid: this.API_KEY,
            units: "metric",
            cnt: days * 8, // 8 forecasts per day (3-hour intervals)
          },
        }
      );

      const forecasts: WeatherForecast[] = response.data.list.map(
        (item, index) => {
          const precipitation =
            (item.rain?.["3h"] || 0) + (item.snow?.["3h"] || 0);

          return {
            id: `${latitude}-${longitude}-${item.dt}-${index}`,
            location,
            latitude,
            longitude,
            forecastDate: new Date(item.dt * 1000),
            tempMin: item.main.temp_min,
            tempMax: item.main.temp_max,
            humidity: item.main.humidity,
            precipitation,
            precipitationChance: item.pop * 100,
            windSpeed: item.wind.speed,
            windDirection: item.wind.deg,
            description: item.weather[0].description,
            icon: item.weather[0].icon,
            timestamp: new Date(),
          };
        }
      );

      // Store forecast data in database
      await this.storeWeatherForecasts(forecasts);

      return forecasts;
    } catch (error) {
      console.error("Error fetching weather forecast:", error);
      throw new Error("Failed to fetch weather forecast");
    }
  }

  static async analyzeWeatherAlerts(
    userId: string,
    weatherData: WeatherData,
    forecasts: WeatherForecast[]
  ): Promise<WeatherAlert[]> {
    const alerts: WeatherAlert[] = [];
    const now = new Date();

    // Check for frost alerts
    if (weatherData.temperature <= 2) {
      alerts.push({
        id: `frost-${userId}-${now.getTime()}`,
        userId,
        alertType: WeatherAlertType.FROST,
        severity:
          weatherData.temperature <= 0
            ? WeatherAlertSeverity.SEVERE
            : WeatherAlertSeverity.HIGH,
        title: "Frost Alert",
        description: `Current temperature is ${weatherData.temperature}°C. Protect sensitive crops from frost damage.`,
        location: weatherData.location,
        startTime: now,
        endTime: new Date(now.getTime() + 12 * 60 * 60 * 1000), // 12 hours
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Check forecast for frost warnings
    forecasts.forEach((forecast) => {
      if (forecast.tempMin <= 2) {
        alerts.push({
          id: `frost-forecast-${userId}-${forecast.forecastDate.getTime()}`,
          userId,
          alertType: WeatherAlertType.FROST,
          severity:
            forecast.tempMin <= 0
              ? WeatherAlertSeverity.HIGH
              : WeatherAlertSeverity.MODERATE,
          title: "Frost Warning",
          description: `Frost expected on ${forecast.forecastDate.toDateString()} with minimum temperature of ${forecast.tempMin}°C.`,
          location: forecast.location,
          startTime: forecast.forecastDate,
          endTime: new Date(
            forecast.forecastDate.getTime() + 24 * 60 * 60 * 1000
          ),
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
      }
    });

    // Check for high wind alerts
    if (weatherData.windSpeed >= 15) {
      // 15 m/s ≈ 34 mph
      alerts.push({
        id: `wind-${userId}-${now.getTime()}`,
        userId,
        alertType: WeatherAlertType.HIGH_WIND,
        severity:
          weatherData.windSpeed >= 25
            ? WeatherAlertSeverity.SEVERE
            : WeatherAlertSeverity.HIGH,
        title: "High Wind Alert",
        description: `Current wind speed is ${weatherData.windSpeed} m/s. Avoid spraying and protect structures.`,
        location: weatherData.location,
        startTime: now,
        endTime: new Date(now.getTime() + 6 * 60 * 60 * 1000), // 6 hours
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Check for extreme temperature alerts
    if (weatherData.temperature >= 35) {
      alerts.push({
        id: `heat-${userId}-${now.getTime()}`,
        userId,
        alertType: WeatherAlertType.EXTREME_HEAT,
        severity:
          weatherData.temperature >= 40
            ? WeatherAlertSeverity.EXTREME
            : WeatherAlertSeverity.HIGH,
        title: "Extreme Heat Alert",
        description: `Temperature is ${weatherData.temperature}°C. Increase irrigation and provide shade for livestock.`,
        location: weatherData.location,
        startTime: now,
        endTime: new Date(now.getTime() + 8 * 60 * 60 * 1000), // 8 hours
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Check for heavy precipitation alerts
    const heavyRain = forecasts.find((f) => f.precipitation >= 25); // 25mm in 3 hours
    if (heavyRain) {
      alerts.push({
        id: `flood-${userId}-${heavyRain.forecastDate.getTime()}`,
        userId,
        alertType: WeatherAlertType.FLOOD,
        severity:
          heavyRain.precipitation >= 50
            ? WeatherAlertSeverity.SEVERE
            : WeatherAlertSeverity.HIGH,
        title: "Heavy Rainfall Warning",
        description: `Heavy rainfall expected: ${heavyRain.precipitation}mm. Prepare drainage and avoid field operations.`,
        location: heavyRain.location,
        startTime: heavyRain.forecastDate,
        endTime: new Date(
          heavyRain.forecastDate.getTime() + 24 * 60 * 60 * 1000
        ),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Store alerts in database
    if (alerts.length > 0) {
      await this.storeWeatherAlerts(alerts);
    }

    return alerts;
  }

  static async calculateGrowingDegreeDays(
    cropId: string,
    cropName: string,
    baseTemperature: number,
    weatherData: WeatherData[]
  ): Promise<number> {
    let totalGDD = 0;

    weatherData.forEach((data) => {
      const dailyGDD = Math.max(0, data.temperature - baseTemperature);
      totalGDD += dailyGDD;
    });

    return totalGDD;
  }

  static async calculateEvapotranspiration(
    temperature: number,
    humidity: number,
    windSpeed: number,
    solarRadiation: number = 0 // Would need additional API for solar radiation
  ): Promise<number> {
    // Simplified Penman-Monteith equation for reference evapotranspiration (ET0)
    // This is a basic implementation - real-world usage would need more comprehensive calculation

    const delta =
      (4098 *
        (0.6108 * Math.exp((17.27 * temperature) / (temperature + 237.3)))) /
      Math.pow(temperature + 237.3, 2);
    const gamma = 0.665; // Psychrometric constant (simplified)
    const u2 = (windSpeed * 4.87) / Math.log(67.8 * 10 - 5.42); // Wind speed at 2m height
    const es = 0.6108 * Math.exp((17.27 * temperature) / (temperature + 237.3));
    const ea = (es * humidity) / 100;

    // Simplified calculation - in practice, you'd need net radiation, soil heat flux, etc.
    const numerator =
      0.408 * delta * solarRadiation +
      ((gamma * 900) / (temperature + 273)) * u2 * (es - ea);
    const denominator = delta + gamma * (1 + 0.34 * u2);

    return Math.max(0, numerator / denominator);
  }

  private static async storeWeatherData(
    weatherData: WeatherData
  ): Promise<void> {
    try {
      await prisma.weatherData.create({
        data: {
          location: weatherData.location,
          latitude: weatherData.latitude,
          longitude: weatherData.longitude,
          temperature: weatherData.temperature,
          humidity: weatherData.humidity,
          precipitation: weatherData.precipitation,
          windSpeed: weatherData.windSpeed,
          windDirection: weatherData.windDirection,
          pressure: weatherData.pressure,
          uvIndex: weatherData.uvIndex,
          visibility: weatherData.visibility,
          description: weatherData.description,
          icon: weatherData.icon,
          timestamp: weatherData.timestamp,
        },
      });
    } catch (error) {
      console.error("Error storing weather data:", error);
    }
  }

  private static async storeWeatherForecasts(
    forecasts: WeatherForecast[]
  ): Promise<void> {
    try {
      await prisma.weatherForecast.createMany({
        data: forecasts.map((forecast) => ({
          location: forecast.location,
          latitude: forecast.latitude,
          longitude: forecast.longitude,
          forecastDate: forecast.forecastDate,
          tempMin: forecast.tempMin,
          tempMax: forecast.tempMax,
          humidity: forecast.humidity,
          precipitation: forecast.precipitation,
          precipitationChance: forecast.precipitationChance,
          windSpeed: forecast.windSpeed,
          windDirection: forecast.windDirection,
          description: forecast.description,
          icon: forecast.icon,
          timestamp: forecast.timestamp,
        })),
        skipDuplicates: true,
      });
    } catch (error) {
      console.error("Error storing weather forecasts:", error);
    }
  }

  private static async storeWeatherAlerts(
    alerts: WeatherAlert[]
  ): Promise<void> {
    try {
      await prisma.weatherAlert.createMany({
        data: alerts.map((alert) => ({
          userId: alert.userId,
          alertType: alert.alertType,
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
          location: alert.location,
          startTime: alert.startTime,
          endTime: alert.endTime,
          isActive: alert.isActive,
        })),
        skipDuplicates: true,
      });
    } catch (error) {
      console.error("Error storing weather alerts:", error);
    }
  }

  static async getActiveAlertsForUser(userId: string): Promise<WeatherAlert[]> {
    try {
      const alerts = await prisma.weatherAlert.findMany({
        where: {
          userId,
          isActive: true,
          endTime: {
            gte: new Date(),
          },
        },
        orderBy: {
          severity: "desc",
        },
      });

      return alerts as WeatherAlert[];
    } catch (error) {
      console.error("Error fetching weather alerts:", error);
      return [];
    }
  }

  static async deactivateExpiredAlerts(): Promise<void> {
    try {
      await prisma.weatherAlert.updateMany({
        where: {
          isActive: true,
          endTime: {
            lt: new Date(),
          },
        },
        data: {
          isActive: false,
        },
      });
    } catch (error) {
      console.error("Error deactivating expired alerts:", error);
    }
  }
}
