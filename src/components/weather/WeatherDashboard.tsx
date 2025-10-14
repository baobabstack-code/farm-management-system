"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { WeatherData, WeatherAlert, WeatherAlertSeverity } from "@/types";

interface WeatherDashboardProps {
  latitude?: number;
  longitude?: number;
  location?: string;
}

export default function WeatherDashboard({
  latitude = 40.7128,
  longitude = -74.006,
  location = "New York, NY",
}: WeatherDashboardProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/weather/current?latitude=${latitude}&longitude=${longitude}&location=${encodeURIComponent(location)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch weather data");
      }

      const result = await response.json();
      setWeatherData(result.data.current);
      setAlerts(result.data.alerts || []);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch weather data"
      );
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, location]);

  useEffect(() => {
    fetchWeatherData();
    // Refresh weather data every 10 minutes
    const interval = setInterval(fetchWeatherData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeatherData]);

  const getAlertColor = (severity: WeatherAlertSeverity) => {
    switch (severity) {
      case WeatherAlertSeverity.EXTREME:
        return "bg-red-100 border-red-500 text-red-800";
      case WeatherAlertSeverity.SEVERE:
        return "bg-orange-100 border-orange-500 text-orange-800";
      case WeatherAlertSeverity.HIGH:
        return "bg-yellow-100 border-yellow-500 text-yellow-800";
      case WeatherAlertSeverity.MODERATE:
        return "bg-blue-100 border-blue-500 text-blue-800";
      default:
        return "bg-gray-100 border-gray-500 text-gray-800";
    }
  };

  const getWindDirection = (degrees: number) => {
    const directions = [
      "N",
      "NNE",
      "NE",
      "ENE",
      "E",
      "ESE",
      "SE",
      "SSE",
      "S",
      "SSW",
      "SW",
      "WSW",
      "W",
      "WNW",
      "NW",
      "NNW",
    ];
    return directions[Math.round(degrees / 22.5) % 16];
  };

  if (loading) {
    return (
      <div className="farm-card">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="farm-card border-destructive/20 bg-destructive/5">
        <div className="text-destructive mb-4">
          <h3 className="text-lg font-semibold">Weather Data Error</h3>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={fetchWeatherData}
          className="farm-btn farm-btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!weatherData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Weather Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`border-l-4 p-4 rounded ${getAlertColor(alert.severity)}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{alert.title}</h4>
                  <p className="text-sm mt-1">{alert.description}</p>
                  <p className="text-xs mt-2">
                    Active until: {new Date(alert.endTime).toLocaleString()}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded">
                  {alert.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Current Weather */}
      <div className="farm-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Current Weather
          </h2>
          <span className="text-sm text-gray-500">
            {new Date(weatherData.timestamp).toLocaleString()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Temperature */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {Math.round(weatherData.temperature)}°C
            </div>
            <div className="text-sm text-gray-600 capitalize">
              {weatherData.description}
            </div>
            <div className="text-xs text-gray-500 mt-1">{location}</div>
          </div>

          {/* Weather Details */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Humidity:</span>
              <span className="font-medium">{weatherData.humidity}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pressure:</span>
              <span className="font-medium">{weatherData.pressure} hPa</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Visibility:</span>
              <span className="font-medium">{weatherData.visibility} km</span>
            </div>
          </div>

          {/* Wind Information */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Wind Speed:</span>
              <span className="font-medium">{weatherData.windSpeed} m/s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Direction:</span>
              <span className="font-medium">
                {getWindDirection(weatherData.windDirection)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Degrees:</span>
              <span className="font-medium">{weatherData.windDirection}°</span>
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-2">
            <div className="text-center">
              <Image
                src={`https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`}
                alt={weatherData.description}
                width={64}
                height={64}
                className="mx-auto"
              />
            </div>
            <button
              onClick={fetchWeatherData}
              className="farm-btn farm-btn-primary w-full text-sm"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
