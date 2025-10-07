"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AgricultureWeatherInsight,
  WeatherConditions,
} from "@/lib/services/enhanced-weather-service";
import { WeatherAlertSeverity } from "@/types";
import {
  Cloud,
  Sun,
  CloudRain,
  Wind,
  Thermometer,
  Droplets,
  Eye,
  TrendingUp,
  Sprout,
  Spray,
  Wheat,
  Shield,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  MapPin,
} from "lucide-react";

interface EnhancedWeatherDashboardProps {
  latitude?: number;
  longitude?: number;
  location?: string;
}

export default function EnhancedWeatherDashboard({
  latitude = 40.7128,
  longitude = -74.006,
  location = "Farm Location",
}: EnhancedWeatherDashboardProps) {
  const [weatherConditions, setWeatherConditions] =
    useState<WeatherConditions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "current" | "forecast" | "insights" | "conditions"
  >("current");

  useEffect(() => {
    fetchWeatherData();
    // Refresh weather data every 15 minutes
    const interval = setInterval(fetchWeatherData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [latitude, longitude, location]);

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/weather/enhanced?latitude=${latitude}&longitude=${longitude}&location=${encodeURIComponent(location)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch weather data");
      }

      const result = await response.json();
      setWeatherConditions(result.data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch weather data"
      );
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 border-red-500 text-red-800";
      case "high":
        return "bg-orange-100 border-orange-500 text-orange-800";
      case "medium":
        return "bg-yellow-100 border-yellow-500 text-yellow-800";
      case "low":
        return "bg-green-100 border-green-500 text-green-800";
      default:
        return "bg-gray-100 border-gray-500 text-gray-800";
    }
  };

  const getSuitabilityColor = (suitability: string) => {
    switch (suitability) {
      case "excellent":
        return "text-green-700 bg-green-100";
      case "good":
        return "text-green-600 bg-green-50";
      case "fair":
        return "text-yellow-600 bg-yellow-50";
      case "poor":
        return "text-orange-600 bg-orange-50";
      case "unsuitable":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getMoistureColor = (level: string) => {
    switch (level) {
      case "very_low":
        return "text-red-600 bg-red-50";
      case "low":
        return "text-orange-600 bg-orange-50";
      case "optimal":
        return "text-green-600 bg-green-50";
      case "high":
        return "text-blue-600 bg-blue-50";
      case "saturated":
        return "text-blue-800 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "irrigation":
        return <Droplets className="w-4 h-4" />;
      case "spraying":
        return <Spray className="w-4 h-4" />;
      case "planting":
      case "harvesting":
        return <Wheat className="w-4 h-4" />;
      case "fieldwork":
        return <Calendar className="w-4 h-4" />;
      case "protection":
        return <Shield className="w-4 h-4" />;
      default:
        return <Sprout className="w-4 h-4" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
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
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
                <p className="text-gray-600">
                  Loading enhanced weather data...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !weatherConditions) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error || "Failed to load weather data"}
            </AlertDescription>
          </Alert>
          <Button
            onClick={fetchWeatherData}
            className="mt-4 bg-green-600 hover:bg-green-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const {
    current,
    forecast,
    alerts,
    insights,
    soilConditions,
    sprayConditions,
    harvestConditions,
  } = weatherConditions;

  return (
    <div className="space-y-6">
      {/* Header with Location and Last Update */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            Weather Dashboard
          </h2>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">{location}</p>
          <p className="text-xs text-gray-400">
            Updated: {new Date(current.timestamp).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Weather Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Alert key={alert.id} className="border-l-4 border-red-500">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <AlertDescription>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-red-900">
                      {alert.title}
                    </h4>
                    <p className="text-red-800 mt-1">{alert.description}</p>
                    <p className="text-xs text-red-600 mt-2">
                      Active until: {new Date(alert.endTime).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="destructive">{alert.severity}</Badge>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 border-b">
        {[
          {
            id: "current",
            label: "Current Weather",
            icon: <Sun className="w-4 h-4" />,
          },
          {
            id: "forecast",
            label: "Forecast",
            icon: <Cloud className="w-4 h-4" />,
          },
          {
            id: "insights",
            label: "Farm Insights",
            icon: <TrendingUp className="w-4 h-4" />,
          },
          {
            id: "conditions",
            label: "Field Conditions",
            icon: <Sprout className="w-4 h-4" />,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? "bg-green-100 text-green-700 border-b-2 border-green-600"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Current Weather Tab */}
      {activeTab === "current" && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Temperature */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Thermometer className="w-6 h-6 text-red-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {Math.round(current.temperature)}°C
                </div>
                <div className="text-sm text-gray-600 capitalize">
                  {current.description}
                </div>
              </div>

              {/* Humidity & Pressure */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Humidity:</span>
                  <span className="font-medium">{current.humidity}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pressure:</span>
                  <span className="font-medium">{current.pressure} hPa</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Visibility:</span>
                  <span className="font-medium">{current.visibility} km</span>
                </div>
              </div>

              {/* Wind Information */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Wind Speed:</span>
                  <span className="font-medium">{current.windSpeed} m/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Direction:</span>
                  <span className="font-medium">
                    {getWindDirection(current.windDirection)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Degrees:</span>
                  <span className="font-medium">{current.windDirection}°</span>
                </div>
              </div>

              {/* Weather Icon */}
              <div className="text-center">
                <img
                  src={`https://openweathermap.org/img/wn/${current.icon}@2x.png`}
                  alt={current.description}
                  className="mx-auto w-16 h-16 mb-2"
                />
                <Button
                  onClick={fetchWeatherData}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Forecast Tab */}
      {activeTab === "forecast" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {forecast.slice(0, 8).map((day, index) => (
            <Card key={index}>
              <CardContent className="p-4 text-center">
                <div className="font-medium text-gray-900 mb-2">
                  {formatDate(day.forecastDate)}
                </div>
                <img
                  src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                  alt={day.description}
                  className="mx-auto w-12 h-12 mb-2"
                />
                <div className="text-sm text-gray-600 capitalize mb-2">
                  {day.description}
                </div>
                <div className="space-y-1">
                  <div className="text-sm">
                    <span className="font-medium">
                      {Math.round(day.tempMax)}°
                    </span>
                    <span className="text-gray-500">
                      /{Math.round(day.tempMin)}°
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    💧 {day.precipitationChance}% • {day.precipitation}mm
                  </div>
                  <div className="text-xs text-gray-500">
                    💨 {day.windSpeed}m/s
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Farm Insights Tab */}
      {activeTab === "insights" && (
        <div className="space-y-4">
          {insights.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Active Insights
                </h3>
                <p className="text-gray-600">
                  Current weather conditions don't require any specific farm
                  actions.
                </p>
              </CardContent>
            </Card>
          ) : (
            insights.map((insight) => (
              <Card
                key={insight.id}
                className={`border-l-4 ${
                  getPriorityColor(insight.priority).includes("red")
                    ? "border-red-500"
                    : getPriorityColor(insight.priority).includes("orange")
                      ? "border-orange-500"
                      : getPriorityColor(insight.priority).includes("yellow")
                        ? "border-yellow-500"
                        : "border-green-500"
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(insight.category)}
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {insight.title}
                        </h3>
                        <p className="text-sm text-gray-600 capitalize">
                          {insight.category}
                        </p>
                      </div>
                    </div>
                    <Badge className={getPriorityColor(insight.priority)}>
                      {insight.priority.toUpperCase()}
                    </Badge>
                  </div>

                  <p className="text-gray-700 mb-3">{insight.description}</p>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Recommendation
                    </h4>
                    <p className="text-gray-700">{insight.recommendation}</p>
                  </div>

                  {insight.fieldConditions && (
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-600">
                        Field Conditions:{" "}
                      </span>
                      <span className="text-sm text-gray-700">
                        {insight.fieldConditions}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Valid until:{" "}
                      {new Date(insight.validUntil).toLocaleString()}
                    </span>
                    {insight.cropStages && (
                      <span>Relevant for: {insight.cropStages.join(", ")}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Field Conditions Tab */}
      {activeTab === "conditions" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Soil Conditions */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sprout className="w-5 h-5 text-green-600" />
                Soil Conditions
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Moisture Level:</span>
                <Badge
                  className={getMoistureColor(soilConditions.moistureLevel)}
                >
                  {soilConditions.moistureLevel.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Soil Temperature:</span>
                <span className="font-medium">
                  {Math.round(soilConditions.temperature)}°C
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Evapotranspiration:</span>
                <span className="font-medium">
                  {soilConditions.evapotranspiration.toFixed(1)} mm/day
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Spray Conditions */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Spray className="w-5 h-5 text-blue-600" />
                Spray Conditions
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Suitability:</span>
                <Badge
                  className={getSuitabilityColor(sprayConditions.suitability)}
                >
                  {sprayConditions.suitability.toUpperCase()}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Wind Speed:</span>
                  <span className="font-medium">
                    {sprayConditions.windSpeed} m/s
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Temperature:</span>
                  <span className="font-medium">
                    {Math.round(sprayConditions.temperature)}°C
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Humidity:</span>
                  <span className="font-medium">
                    {sprayConditions.humidity}%
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">
                  {sprayConditions.recommendation}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Harvest Conditions */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Wheat className="w-5 h-5 text-yellow-600" />
                Harvest Conditions
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Suitability:</span>
                <Badge
                  className={getSuitabilityColor(harvestConditions.suitability)}
                >
                  {harvestConditions.suitability.toUpperCase()}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Consecutive Dry Days:</span>
                  <span className="font-medium">
                    {harvestConditions.dryDays}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Soil Moisture:</span>
                  <span className="font-medium">
                    {harvestConditions.soilMoisture}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">
                  {harvestConditions.recommendation}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
