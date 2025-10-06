"use client";

import { useState, useEffect } from "react";
import { useFeatureFlag } from "@/lib/feature-flags";

interface AIInsight {
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  priority?: string;
  category?: string;
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case "High":
      return "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300";
    case "Medium":
      return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300";
    case "Low":
      return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300";
    default:
      return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300";
  }
}

function getPriorityBorderColor(priority?: string): string {
  switch (priority) {
    case "High":
      return "border-red-200 dark:border-red-800";
    case "Medium":
      return "border-yellow-200 dark:border-yellow-800";
    case "Low":
      return "border-green-200 dark:border-green-800";
    default:
      return "border-blue-100 dark:border-blue-700";
  }
}

function getCategoryIcon(category: string): string {
  switch (category) {
    case "harvest":
      return "🌾";
    case "planning":
      return "📋";
    case "monitoring":
      return "👁️";
    case "management":
      return "📊";
    case "irrigation":
      return "💧";
    case "fertilizer":
      return "🌱";
    case "financial":
      return "💰";
    case "optimization":
      return "⚡";
    default:
      return "📈";
  }
}

export default function AIInsightsCard() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const aiAnalyticsEnabled = useFeatureFlag("aiAnalytics");

  const fetchAIInsights = async () => {
    setLoading(true);
    try {
      // Call your AI agent via API
      const response = await fetch("/api/ai/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: "farm_summary" }),
      });

      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights || []);
      }
    } catch (error) {
      console.error("Failed to fetch AI insights:", error);
      // Graceful fallback - don't break the existing UI
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (aiAnalyticsEnabled) {
      fetchAIInsights();
    }
  }, [aiAnalyticsEnabled]);

  // Only show if AI analytics is enabled
  if (!aiAnalyticsEnabled) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-3">
        <h3 className="text-base sm:text-lg font-semibold text-blue-900 dark:text-blue-100 flex items-center">
          🤖 AI Insights
          <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
            Beta
          </span>
        </h3>
        <button
          onClick={fetchAIInsights}
          disabled={loading}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 disabled:opacity-50 touch-target self-start sm:self-auto"
        >
          {loading ? "Analyzing..." : "Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse">
          <div className="h-4 bg-blue-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-blue-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      ) : insights.length > 0 ? (
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`bg-white dark:bg-gray-800 rounded-md p-3 border ${getPriorityBorderColor(insight.priority)}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-0">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                      {insight.title}
                    </h4>
                    {insight.priority && (
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(insight.priority)}`}
                      >
                        {insight.priority}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {insight.description}
                  </p>
                  {insight.category && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {getCategoryIcon(insight.category)} {insight.category}
                      </span>
                    </div>
                  )}
                </div>
                <div className="sm:ml-3 flex flex-row sm:flex-col items-start sm:items-end gap-2 sm:gap-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.round(insight.confidence * 100)}% confidence
                  </div>
                  {insight.actionable && (
                    <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-1 rounded">
                      Actionable
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
          No AI insights available at the moment. The AI is learning from your
          farm data.
        </p>
      )}

      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 border-t border-blue-100 dark:border-blue-700 pt-2">
        💡 AI insights are generated based on your farm data and may not always
        be accurate. Always verify recommendations with your agricultural
        expertise.
      </div>
    </div>
  );
}
