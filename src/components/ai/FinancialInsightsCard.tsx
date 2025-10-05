"use client";

import { useState, useEffect } from "react";
import { useFeatureFlag } from "@/lib/feature-flags";
import { Button } from "@/components/ui/button";
import type { FinancialInsights } from "@/lib/services/financial-analytics";

export default function FinancialInsightsCard() {
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<FinancialInsights | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "forecasts" | "roi" | "optimization"
  >("overview");
  const [error, setError] = useState("");

  const financialInsightsEnabled =
    useFeatureFlag("aiFinancialInsights") || true;

  useEffect(() => {
    if (financialInsightsEnabled) {
      fetchFinancialInsights();
    }
  }, [financialInsightsEnabled]);

  const fetchFinancialInsights = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ai/financial-insights");
      const data = await response.json();

      if (data.success) {
        setInsights(data.insights);
      } else {
        setError(data.error || "Failed to fetch financial insights");
      }
    } catch {
      setError("Error fetching financial insights");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case "Excellent":
        return "text-green-600 bg-green-100";
      case "Good":
        return "text-green-500 bg-green-50";
      case "Average":
        return "text-yellow-600 bg-yellow-100";
      case "Below Average":
        return "text-orange-600 bg-orange-100";
      case "Poor":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "text-red-600 bg-red-100";
      case "Medium":
        return "text-yellow-600 bg-yellow-100";
      case "Low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 5) return "📈";
    if (trend < -5) return "📉";
    return "➡️";
  };

  if (!financialInsightsEnabled) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            💰 Financial AI Analytics
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Advanced insights with profit forecasting and ROI analysis
          </p>
        </div>
        <Button
          onClick={fetchFinancialInsights}
          disabled={isLoading}
          size="sm"
          className="text-xs"
        >
          {isLoading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
        {[
          { id: "overview", label: "Overview", icon: "📊" },
          { id: "forecasts", label: "Forecasts", icon: "🔮" },
          { id: "roi", label: "ROI Analysis", icon: "📈" },
          { id: "optimization", label: "Cost Savings", icon: "💡" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() =>
              setActiveTab(
                tab.id as "overview" | "forecasts" | "roi" | "optimization"
              )
            }
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-xs">
          {error}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-2/3 mx-auto"></div>
          </div>
        </div>
      ) : insights ? (
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Financial Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-700">
                    {formatCurrency(insights.summary.totalRevenue)}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Total Revenue
                  </div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-700">
                    {formatCurrency(insights.summary.totalCosts)}
                  </div>
                  <div className="text-xs text-red-600 mt-1">Total Costs</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-700">
                    {formatCurrency(insights.summary.netProfit)}
                  </div>
                  <div className="text-xs text-green-600 mt-1">Net Profit</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-700">
                    {formatPercentage(insights.summary.profitMargin)}
                  </div>
                  <div className="text-xs text-purple-600 mt-1">
                    Profit Margin
                  </div>
                </div>
              </div>

              {/* Trends */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Trends
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center space-x-1">
                      <span className="text-lg">
                        {getTrendIcon(insights.trends.revenueGrowth)}
                      </span>
                      <span className="font-bold text-sm">
                        {formatPercentage(insights.trends.revenueGrowth)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Revenue Growth
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center space-x-1">
                      <span className="text-lg">
                        {getTrendIcon(-insights.trends.costTrend)}
                      </span>
                      <span className="font-bold text-sm">
                        {formatPercentage(insights.trends.costTrend)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Cost Trend</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center space-x-1">
                      <span className="text-lg">
                        {getTrendIcon(insights.trends.profitTrend)}
                      </span>
                      <span className="font-bold text-sm">
                        {formatPercentage(insights.trends.profitTrend)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Profit Trend
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Key Recommendations
                </h3>
                <div className="space-y-2">
                  {insights.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-2 text-xs"
                    >
                      <span className="text-blue-500 mt-0.5">💡</span>
                      <span className="text-gray-700">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Forecasts Tab */}
          {activeTab === "forecasts" && (
            <div className="space-y-4">
              {insights.forecasts.map((forecast, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 capitalize">
                      {forecast.period.replace("_", " ")}
                    </h3>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {forecast.confidence}% confidence
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3 text-center">
                    <div>
                      <div className="font-bold text-sm text-green-600">
                        {formatCurrency(forecast.projectedRevenue)}
                      </div>
                      <div className="text-xs text-gray-600">Revenue</div>
                    </div>
                    <div>
                      <div className="font-bold text-sm text-red-600">
                        {formatCurrency(forecast.projectedCosts)}
                      </div>
                      <div className="text-xs text-gray-600">Costs</div>
                    </div>
                    <div>
                      <div
                        className={`font-bold text-sm ${forecast.projectedProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {formatCurrency(forecast.projectedProfit)}
                      </div>
                      <div className="text-xs text-gray-600">Profit</div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-600">
                    <strong>Based on:</strong>
                    <ul className="mt-1 space-y-0.5">
                      {forecast.factors.map((factor, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-blue-500 mr-1">•</span>
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ROI Analysis Tab */}
          {activeTab === "roi" && (
            <div className="space-y-4">
              {insights.roiAnalysis.slice(0, 6).map((roi, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {roi.cropName}
                    </h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getPerformanceColor(roi.performance)}`}
                    >
                      {roi.performance}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-center">
                    <div>
                      <div className="font-bold text-xs text-gray-700">
                        {formatCurrency(roi.investmentCost)}
                      </div>
                      <div className="text-xs text-gray-500">Investment</div>
                    </div>
                    <div>
                      <div className="font-bold text-xs text-gray-700">
                        {formatCurrency(roi.actualRevenue)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Actual Revenue
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-xs text-blue-600">
                        {formatPercentage(roi.actualROI)}
                      </div>
                      <div className="text-xs text-gray-500">Actual ROI</div>
                    </div>
                    <div>
                      <div className="font-bold text-xs text-green-600">
                        {formatPercentage(roi.projectedROI)}
                      </div>
                      <div className="text-xs text-gray-500">Projected ROI</div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-700">
                    <strong>Recommendation:</strong> {roi.recommendation}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cost Optimization Tab */}
          {activeTab === "optimization" && (
            <div className="space-y-4">
              {insights.costOptimizations.map((opt, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 capitalize">
                      {opt.category.toLowerCase().replace("_", " ")}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(opt.priority)}`}
                      >
                        {opt.priority} Priority
                      </span>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                        {opt.implementation}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3 text-center">
                    <div>
                      <div className="font-bold text-sm text-red-600">
                        {formatCurrency(opt.currentCost)}
                      </div>
                      <div className="text-xs text-gray-600">Current Cost</div>
                    </div>
                    <div>
                      <div className="font-bold text-sm text-blue-600">
                        {formatCurrency(opt.optimizedCost)}
                      </div>
                      <div className="text-xs text-gray-600">
                        Optimized Cost
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-sm text-green-600">
                        {formatCurrency(opt.potentialSavings)}
                      </div>
                      <div className="text-xs text-gray-600">
                        Potential Savings
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-700">
                    <strong>Recommendations:</strong>
                    <ul className="mt-1 space-y-0.5">
                      {opt.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-green-500 mr-1">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">No financial data available yet.</p>
          <p className="text-xs mt-2">
            Start logging activities and costs to see insights.
          </p>
        </div>
      )}
    </div>
  );
}
