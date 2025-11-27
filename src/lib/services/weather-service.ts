import axios from "axios";
import { prisma } from "@/lib/prisma";
import {
  WeatherData,
  WeatherForecast,
  WeatherAlert,
  WeatherAlertType,
  WeatherAlertSeverity,
} from "@/types";

export interface OpenMeteoCurrentResponse {
  latitude: number;
  longitude: number;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    surface_pressure: number;
    visibility: number;
  };
}

export interface OpenMeteoForecastResponse {
  latitude: number;
  longitude: number;
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
    wind_direction_10m_dominant: number[];
    weather_code: number[];
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    precipitation: number[];
    weather_code: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
  };
}

export class WeatherService {
  private static readonly BASE_URL = "https://api.open-meteo.com/v1";

  static async getCurrentWeather(
    latitude: number,
    longitude: number,
    location: string
  ): Promise<WeatherData> {
    try {
      const response = await axios.get<OpenMeteoCurrentResponse>(
        `${this.BASE_URL}/forecast`,
        {
          params: {
            latitude,
            longitude,
            current: [
              "temperature_2m",
              "relative_humidity_2m",
              "precipitation",
              "weather_code",
              "wind_speed_10m",
              "wind_direction_10m",
              "surface_pressure",
            ].join(","),
            timezone: "auto",
          },
        }
      );

      const data = response.data.current;
      const { description, icon } = this.getWeatherDescription(
        data.weather_code
      );

      const weatherData: WeatherData = {
        id: `${latitude}-${longitude}-${Date.now()}`,
        location,
        latitude,
        longitude,
        temperature: data.temperature_2m,
        humidity: data.relative_humidity_2m,
        precipitation: data.precipitation,
        windSpeed: data.wind_speed_10m,
        windDirection: data.wind_direction_10m,
        pressure: data.surface_pressure,
        uvIndex: 0, // Open-Meteo doesn't provide UV index in free tier
        visibility: 10, // Default visibility
        description,
        icon,
        timestamp: new Date(data.time),
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
    try {
      const response = await axios.get<OpenMeteoForecastResponse>(
        `${this.BASE_URL}/forecast`,
        {
          params: {
            latitude,
            longitude,
            daily: [
              "temperature_2m_max",
              "temperature_2m_min",
              "precipitation_sum",
              "precipitation_probability_max",
              "wind_speed_10m_max",
              "wind_direction_10m_dominant",
              "weather_code",
            ].join(","),
            timezone: "auto",
            forecast_days: days,
          },
        }
      );

      const daily = response.data.daily;
      const forecasts: WeatherForecast[] = daily.time.map((time, index) => {
        const { description, icon } = this.getWeatherDescription(
          daily.weather_code[index]
        );

        return {
          id: `${latitude}-${longitude}-${time}-${index}`,
          location,
          latitude,
          longitude,
          forecastDate: new Date(time),
          tempMin: daily.temperature_2m_min[index],
          tempMax: daily.temperature_2m_max[index],
          humidity: 0, // Daily doesn't include humidity, would need hourly
          precipitation: daily.precipitation_sum[index],
          precipitationChance: daily.precipitation_probability_max[index],
          windSpeed: daily.wind_speed_10m_max[index],
          windDirection: daily.wind_direction_10m_dominant[index],
          description,
          icon,
          timestamp: new Date(),
        };
      });

      // Store forecast data in database
      await this.storeWeatherForecasts(forecasts);

      return forecasts;
    } catch (error) {
      console.error("Error fetching weather forecast:", error);
      throw new Error("Failed to fetch weather forecast");
    }
  }

  /**
   * Convert Open-Meteo weather code to description and icon
   * Based on WMO Weather interpretation codes
   */
  private static getWeatherDescription(code: number): {
    description: string;
    icon: string;
  } {
    const weatherCodes: Record<number, { description: string; icon: string }> =
      {
        0: { description: "Clear sky", icon: "01d" },
        1: { description: "Mainly clear", icon: "02d" },
        2: { description: "Partly cloudy", icon: "03d" },
        3: { description: "Overcast", icon: "04d" },
        45: { description: "Foggy", icon: "50d" },
        48: { description: "Depositing rime fog", icon: "50d" },
        51: { description: "Light drizzle", icon: "09d" },
        53: { description: "Moderate drizzle", icon: "09d" },
        55: { description: "Dense drizzle", icon: "09d" },
        61: { description: "Slight rain", icon: "10d" },
        63: { description: "Moderate rain", icon: "10d" },
        65: { description: "Heavy rain", icon: "10d" },
        71: { description: "Slight snow", icon: "13d" },
        73: { description: "Moderate snow", icon: "13d" },
        75: { description: "Heavy snow", icon: "13d" },
        77: { description: "Snow grains", icon: "13d" },
        80: { description: "Slight rain showers", icon: "09d" },
        81: { description: "Moderate rain showers", icon: "09d" },
        82: { description: "Violent rain showers", icon: "09d" },
        85: { description: "Slight snow showers", icon: "13d" },
        86: { description: "Heavy snow showers", icon: "13d" },
        95: { description: "Thunderstorm", icon: "11d" },
        96: { description: "Thunderstorm with slight hail", icon: "11d" },
        99: { description: "Thunderstorm with heavy hail", icon: "11d" },
      };

    return (
      weatherCodes[code] || {
        description: "Unknown",
        icon: "01d",
      }
    );
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
