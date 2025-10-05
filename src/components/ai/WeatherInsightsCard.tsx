"use client";

import { useState, useEffect } from "react";
import { useFeatureFlag } from "@/lib/feature-flags";

interface WeatherInsight {
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  priority: "High" | "Medium" | "Low";
  category: string;
  weatherFactor: string;
  urgency?: "Immediate" | "This Week" | "This Month";
}

interface WeatherConditions {
  temperature: number;
  humidity: number;
  condition: string;
  windSpeed: number;
  precipitation: number;
}

interface WeatherData {
  insights: WeatherInsight[];
  weather: {
    current: WeatherConditions;
    forecast: any[];
    alerts: any[];
    recommendations: string[];
  };
  location: {
    latitude: number;
    longitude: number;
  };
}

function getUrgencyColor(urgency?: string): string {
  switch (urgency) {
    case "Immediate":
      return "bg-red-100 text-red-800 border-red-200";
    case "This Week":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "This Month":
      return "bg-blue-100 text-blue-800 border-blue-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function getPriorityIcon(priority: string): string {
  switch (priority) {
    case "High":
      return "🔴";
    case "Medium":
      return "🟡";
    case "Low":
      return "🟢";
    default:
      return "⚪";
  }
}

function getWeatherIcon(condition: string): string {
  const conditionLower = condition.toLowerCase();
  if (conditionLower.includes("clear") || conditionLower.includes("sunny"))
    return "☀️";
  if (conditionLower.includes("cloud")) return "☁️";
  if (conditionLower.includes("rain")) return "🌧️";
  if (conditionLower.includes("snow")) return "❄️";
  if (conditionLower.includes("storm")) return "⛈️";
  return "🌤️";
}

function getCategoryIcon(category: string): string {
  switch (category) {
    case "irrigation":
      return "💧";
    case "protection":
      return "🛡️";
    case "monitoring":
      return "👁️";
    case "planning":
      return "📋";
    case "harvest":
      return "🌾";
    case "financial":
      return "💰";
    case "alert":
      return "⚠️";
    default:
      return "📈";
  }
}

export default function WeatherInsightsCard() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const aiAnalyticsEnabled = useFeatureFlag("aiAnalytics");

  // Get user's location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          // Use default location (example: San Francisco)
          setLocation({ latitude: 37.7749, longitude: -122.4194 });
        }
      );
    } else {
      // Geolocation not supported, use default location
      setLocation({ latitude: 37.7749, longitude: -122.4194 });
    }
  };

  const fetchWeatherInsights = async () => {
    if (!location) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/weather-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          analysisType: "comprehensive",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setWeatherData(data.data);
      } else {
        throw new Error("Failed to fetch weather insights");
      }
    } catch (error) {
      console.error("Failed to fetch weather insights:", error);
      setError("Unable to fetch weather-aware insights. Using fallback data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (aiAnalyticsEnabled && !location) {
      getUserLocation();
    }
  }, [aiAnalyticsEnabled, location]);

  useEffect(() => {
    if (aiAnalyticsEnabled && location) {
      fetchWeatherInsights();
    }
  }, [aiAnalyticsEnabled, location, fetchWeatherInsights]);

  // Only show if AI analytics is enabled
  if (!aiAnalyticsEnabled) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-sky-50 to-indigo-100 border border-sky-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-sky-900 flex items-center">
          🌤️ Weather-Aware Insights
          <span className="ml-2 text-xs bg-sky-100 text-sky-800 px-2 py-1 rounded-full">
            Beta
          </span>
        </h3>
        <button
          onClick={fetchWeatherInsights}
          disabled={loading || !location}
          className="text-sm text-sky-600 hover:text-sky-800 disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-sky-200 rounded"></div>
          <div className="h-4 bg-sky-200 rounded w-3/4"></div>
          <div className="h-16 bg-sky-200 rounded"></div>
        </div>
      ) : weatherData ? (
        <div className="space-y-4">
          {/* Current Weather Display */}
          <div className="bg-white rounded-lg p-3 border border-sky-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Current Conditions</h4>
              <span className="text-2xl">
                {getWeatherIcon(weatherData.weather.current.condition)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div>
                🌡️ {Math.round(weatherData.weather.current.temperature)}°C
              </div>
              <div>💧 {Math.round(weatherData.weather.current.humidity)}%</div>
              <div>
                💨 {Math.round(weatherData.weather.current.windSpeed)} km/h
              </div>
              <div>
                ☔ {Math.round(weatherData.weather.current.precipitation)}mm
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-700 capitalize">
              {weatherData.weather.current.condition}
            </div>
          </div>

          {/* Weather Alerts */}
          {weatherData.weather.alerts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <h4 className="font-medium text-amber-900 mb-2 flex items-center">
                ⚠️ Weather Alerts
              </h4>
              {weatherData.weather.alerts.map((alert, index) => (
                <div key={index} className="text-sm text-amber-800 mb-1">
                  <strong>{alert.title}:</strong> {alert.description}
                </div>
              ))}
            </div>
          )}

          {/* Weather-Aware Insights */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Smart Recommendations</h4>
            {weatherData.insights.length > 0 ? (
              weatherData.insights.map((insight, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg p-3 border border-sky-100"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {getCategoryIcon(insight.category)}
                        </span>
                        <h5 className="font-medium text-gray-900 text-sm">
                          {insight.title}
                        </h5>
                        <span className="text-xs">
                          {getPriorityIcon(insight.priority)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {insight.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {insight.urgency && (
                          <span
                            className={`px-2 py-1 rounded-full border ${getUrgencyColor(insight.urgency)}`}
                          >
                            {insight.urgency}
                          </span>
                        )}
                        <span>
                          {Math.round(insight.confidence * 100)}% confidence
                        </span>
                        {insight.actionable && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                            Action needed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                No weather-specific recommendations at this time.
              </div>
            )}
          </div>

          {/* Forecast Preview */}
          {weatherData.weather.forecast.length > 0 && (
            <div className="bg-white rounded-lg p-3 border border-sky-100">
              <h4 className="font-medium text-gray-900 mb-2">3-Day Forecast</h4>
              <div className="grid grid-cols-3 gap-2">
                {weatherData.weather.forecast.slice(0, 3).map((day, index) => (
                  <div key={index} className="text-center text-xs">
                    <div className="text-gray-500 mb-1">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        weekday: "short",
                      })}
                    </div>
                    <div className="text-lg mb-1">
                      {getWeatherIcon(day.condition)}
                    </div>
                    <div className="text-gray-700">
                      {Math.round(day.high)}° / {Math.round(day.low)}°
                    </div>
                    {day.precipitationChance > 30 && (
                      <div className="text-blue-600">
                        {Math.round(day.precipitationChance)}% rain
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-600 text-center py-4">
          {location
            ? "Click refresh to get weather-aware insights"
            : "Getting your location..."}
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500 border-t border-sky-100 pt-2">
        🌐 Weather insights combine local conditions with your farm data for
        personalized recommendations.
      </div>
    </div>
  );
}
