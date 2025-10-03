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
      return "bg-red-100 text-red-800";
    case "Medium":
      return "bg-yellow-100 text-yellow-800";
    case "Low":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getPriorityBorderColor(priority?: string): string {
  switch (priority) {
    case "High":
      return "border-red-200";
    case "Medium":
      return "border-yellow-200";
    case "Low":
      return "border-green-200";
    default:
      return "border-blue-100";
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
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-blue-900 flex items-center">
          🤖 AI Insights
          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            Beta
          </span>
        </h3>
        <button
          onClick={fetchAIInsights}
          disabled={loading}
          className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse">
          <div className="h-4 bg-blue-200 rounded mb-2"></div>
          <div className="h-4 bg-blue-200 rounded w-3/4"></div>
        </div>
      ) : insights.length > 0 ? (
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`bg-white rounded-md p-3 border ${getPriorityBorderColor(insight.priority)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">
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
                  <p className="text-sm text-gray-600 mb-2">
                    {insight.description}
                  </p>
                  {insight.category && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">
                        {getCategoryIcon(insight.category)} {insight.category}
                      </span>
                    </div>
                  )}
                </div>
                <div className="ml-3 flex flex-col items-end gap-1">
                  <div className="text-xs text-gray-500">
                    {Math.round(insight.confidence * 100)}% confidence
                  </div>
                  {insight.actionable && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Actionable
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-600">
          No AI insights available at the moment. The AI is learning from your
          farm data.
        </p>
      )}

      <div className="mt-3 text-xs text-gray-500 border-t border-blue-100 pt-2">
        💡 AI insights are generated based on your farm data and may not always
        be accurate. Always verify recommendations with your agricultural
        expertise.
      </div>
    </div>
  );
}
