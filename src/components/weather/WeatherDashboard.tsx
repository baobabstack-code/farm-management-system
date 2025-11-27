"use client";

import React, { useState, useEffect, useCallback } from "react";
import WeatherIcon from "./WeatherIcon";
import { WeatherData, WeatherAlert, WeatherAlertSeverity } from "@/types";

interface WeatherDashboardProps {
  latitude: number;
  longitude: number;
  location: string;
}

export default function WeatherDashboard({
  latitude,
  longitude,
  location,
}: WeatherDashboardProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherData = useCallback(async () => {
    if (!latitude || !longitude || !location) {
      setError("Please configure a farm location to view weather data.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/weather/current?latitude=${latitude}&longitude=${longitude}&location=${encodeURIComponent(location)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch weather data");
      }

      const result = await response.json();
      setWeatherData(result.data.current);
      setAlerts(result.data.alerts || []);
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
        return "bg-destructive/10 border-destructive text-destructive dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30";
      case WeatherAlertSeverity.SEVERE:
        return "bg-warning/10 border-warning text-warning dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30";
      case WeatherAlertSeverity.HIGH:
        return "bg-warning/10 border-warning text-warning dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30";
      case WeatherAlertSeverity.MODERATE:
        return "bg-info/10 border-info text-info dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30";
      default:
        return "bg-muted border-border text-muted-foreground dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600/50";
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
          <h2 className="farm-heading-card text-foreground">Current Weather</h2>
          <span className="farm-text-muted">
            {new Date(weatherData.timestamp).toLocaleString()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Temperature */}
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground">
              {Math.round(weatherData.temperature)}°C
            </div>
            <div className="farm-text-body capitalize">
              {weatherData.description}
            </div>
            <div className="farm-text-muted mt-1">{location}</div>
          </div>

          {/* Weather Details */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="farm-text-muted">Humidity:</span>
              <span className="font-medium text-foreground">
                {weatherData.humidity}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="farm-text-muted">Pressure:</span>
              <span className="font-medium text-foreground">
                {weatherData.pressure} hPa
              </span>
            </div>
            <div className="flex justify-between">
              <span className="farm-text-muted">Visibility:</span>
              <span className="font-medium text-foreground">
                {weatherData.visibility} km
              </span>
            </div>
          </div>

          {/* Wind Information */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="farm-text-muted">Wind Speed:</span>
              <span className="font-medium text-foreground">
                {weatherData.windSpeed} m/s
              </span>
            </div>
            <div className="flex justify-between">
              <span className="farm-text-muted">Direction:</span>
              <span className="font-medium text-foreground">
                {getWindDirection(weatherData.windDirection)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="farm-text-muted">Degrees:</span>
              <span className="font-medium text-foreground">
                {weatherData.windDirection}°
              </span>
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-2">
            <div className="text-center">
              <WeatherIcon
                icon={weatherData.icon}
                description={weatherData.description}
                size="lg"
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
