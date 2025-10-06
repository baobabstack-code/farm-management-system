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
        return "text-green-600 dark:text-green-300 bg-green-100 dark:bg-green-900/20";
      case "Good":
        return "text-green-500 dark:text-green-400 bg-green-50 dark:bg-green-900/10";
      case "Average":
        return "text-yellow-600 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/20";
      case "Below Average":
        return "text-orange-600 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/20";
      case "Poor":
        return "text-red-600 dark:text-red-300 bg-red-100 dark:bg-red-900/20";
      default:
        return "text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "text-red-600 dark:text-red-300 bg-red-100 dark:bg-red-900/20";
      case "Medium":
        return "text-yellow-600 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/20";
      case "Low":
        return "text-green-600 dark:text-green-300 bg-green-100 dark:bg-green-900/20";
      default:
        return "text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800";
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            💰 Financial AI Analytics
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Advanced insights with profit forecasting and ROI analysis
          </p>
        </div>
        <Button
          onClick={fetchFinancialInsights}
          disabled={isLoading}
          size="sm"
          className="text-xs touch-target w-full sm:w-auto"
        >
          {isLoading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap sm:flex-nowrap gap-1 sm:space-x-1 mb-4 sm:mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
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
            className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-md text-xs font-medium transition-colors touch-target flex-1 sm:flex-none justify-center ${
              activeTab === tab.id
                ? "bg-white dark:bg-gray-600 text-blue-700 dark:text-blue-300 shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden text-xs">{tab.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded text-xs">
          {error}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-8 sm:py-12">
          <div className="animate-pulse">
            <div className="h-6 sm:h-8 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-3 sm:h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mx-auto mb-2"></div>
            <div className="h-3 sm:h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3 mx-auto"></div>
          </div>
        </div>
      ) : insights ? (
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Financial Summary */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 sm:p-4 text-center">
                  <div className="text-lg sm:text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {formatCurrency(insights.summary.totalRevenue)}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Total Revenue
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 sm:p-4 text-center">
                  <div className="text-lg sm:text-2xl font-bold text-red-700 dark:text-red-300">
                    {formatCurrency(insights.summary.totalCosts)}
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Total Costs
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 sm:p-4 text-center">
                  <div className="text-lg sm:text-2xl font-bold text-green-700 dark:text-green-300">
                    {formatCurrency(insights.summary.netProfit)}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Net Profit
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 sm:p-4 text-center">
                  <div className="text-lg sm:text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {formatPercentage(insights.summary.profitMargin)}
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    Profit Margin
                  </div>
                </div>
              </div>

              {/* Trends */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Trends
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center space-x-1">
                      <span className="text-lg">
                        {getTrendIcon(insights.trends.revenueGrowth)}
                      </span>
                      <span className="font-bold text-sm">
                        {formatPercentage(insights.trends.revenueGrowth)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
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
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Cost Trend
                    </div>
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
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Profit Trend
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Key Recommendations
                </h3>
                <div className="space-y-2">
                  {insights.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-2 text-xs"
                    >
                      <span className="text-blue-500 dark:text-blue-400 mt-0.5">
                        💡
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {rec}
                      </span>
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
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 sm:p-4"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">
                      {forecast.period.replace("_", " ")}
                    </h3>
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full">
                      {forecast.confidence}% confidence
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-3 text-center">
                    <div>
                      <div className="font-bold text-sm text-green-600 dark:text-green-400">
                        {formatCurrency(forecast.projectedRevenue)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Revenue
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-sm text-red-600 dark:text-red-400">
                        {formatCurrency(forecast.projectedCosts)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Costs
                      </div>
                    </div>
                    <div>
                      <div
                        className={`font-bold text-sm ${forecast.projectedProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                      >
                        {formatCurrency(forecast.projectedProfit)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Profit
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <strong>Based on:</strong>
                    <ul className="mt-1 space-y-0.5">
                      {forecast.factors.map((factor, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-blue-500 dark:text-blue-400 mr-1">
                            •
                          </span>
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
        <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400">
          <p className="text-sm">No financial data available yet.</p>
          <p className="text-xs mt-2">
            Start logging activities and costs to see insights.
          </p>
        </div>
      )}
    </div>
  );
}
