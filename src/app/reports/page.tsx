"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface ReportData {
  dashboard: {
    totalCrops: number;
    activeTasks: number;
    overdueTasks: number;
    recentHarvests: number;
    totalYield: number;
    waterUsage: number;
  };
  water: {
    totalWater: number;
    averagePerSession: number;
    sessionCount: number;
  };
  fertilizer: {
    totalAmount: number;
    applicationCount: number;
    typeBreakdown: Record<string, number>;
  };
  yield: {
    totalYield: number;
    harvestCount: number;
    cropBreakdown: Record<string, number>;
  };
  pestDisease: {
    totalIncidents: number;
    pestCount: number;
    diseaseCount: number;
    severityBreakdown: Record<string, number>;
  };
}

export default function ReportsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push("/sign-in");
      return;
    }

    if (user) {
      fetchReportData();
    }
  }, [user, isLoaded, router, dateRange]);

  const fetchReportData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append("startDate", dateRange.startDate);
      if (dateRange.endDate) params.append("endDate", dateRange.endDate);

      const response = await fetch(`/api/analytics?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setReportData(data.data);
      } else {
        setError("Failed to fetch report data");
      }
    } catch {
      setError("Error fetching report data");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  const exportToCSV = () => {
    if (!reportData) return;

    const csvData = [
      ["Report Type", "Metric", "Value"],
      ["Dashboard", "Total Crops", reportData.dashboard.totalCrops],
      ["Dashboard", "Active Tasks", reportData.dashboard.activeTasks],
      ["Dashboard", "Overdue Tasks", reportData.dashboard.overdueTasks],
      ["Dashboard", "Recent Harvests", reportData.dashboard.recentHarvests],
      ["Dashboard", "Total Yield (kg)", reportData.dashboard.totalYield],
      ["Dashboard", "Water Usage (L)", reportData.dashboard.waterUsage],
      ["Water", "Total Water Used (L)", reportData.water.totalWater],
      ["Water", "Average Per Session (L)", reportData.water.averagePerSession],
      ["Water", "Total Sessions", reportData.water.sessionCount],
      ["Fertilizer", "Total Amount (kg)", reportData.fertilizer.totalAmount],
      [
        "Fertilizer",
        "Application Count",
        reportData.fertilizer.applicationCount,
      ],
      ["Yield", "Total Yield (kg)", reportData.yield.totalYield],
      ["Yield", "Harvest Count", reportData.yield.harvestCount],
      [
        "Pest/Disease",
        "Total Incidents",
        reportData.pestDisease.totalIncidents,
      ],
      ["Pest/Disease", "Pest Count", reportData.pestDisease.pestCount],
      ["Pest/Disease", "Disease Count", reportData.pestDisease.diseaseCount],
    ];

    const csvContent = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `farm-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center">
              {error ? (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              ) : (
                "Loading report data..."
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      <div className="content-container py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <span className="text-white text-2xl">📈</span>
              </div>
              <div>
                <h1 className="text-display text-gray-900">
                  Farm Reports & Analytics
                </h1>
                <p className="text-gray-600 mt-1">
                  Comprehensive insights into your farm performance
                </p>
              </div>
            </div>
            <button
              onClick={exportToCSV}
              disabled={!reportData}
              className="btn-enhanced bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              <span className="mr-2">📄</span>
              Export to CSV
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Date Range Filter */}
          <div className="mb-8 card-enhanced p-6">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white text-sm">📅</span>
              </div>
              <h2 className="text-heading text-gray-900">Date Range Filter</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, startDate: e.target.value })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, endDate: e.target.value })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => setDateRange({ startDate: "", endDate: "" })}
                  className="bg-gray-600 hover:bg-gray-700"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>

          {reportData && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">🌱</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Crops
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {reportData.dashboard.totalCrops}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">📋</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Active Tasks
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {reportData.dashboard.activeTasks}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">🌾</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Yield
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {reportData.dashboard.totalYield.toFixed(1)} kg
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">💧</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Water Usage
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {reportData.dashboard.waterUsage.toFixed(1)} L
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Reports */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Water Usage Report */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Water Usage Report
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Total Water Used
                      </span>
                      <span className="text-sm font-medium">
                        {reportData.water.totalWater.toFixed(1)} L
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Irrigation Sessions
                      </span>
                      <span className="text-sm font-medium">
                        {reportData.water.sessionCount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Average per Session
                      </span>
                      <span className="text-sm font-medium">
                        {reportData.water.averagePerSession.toFixed(1)} L
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fertilizer Report */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Fertilizer Usage Report
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Total Amount Used
                      </span>
                      <span className="text-sm font-medium">
                        {reportData.fertilizer.totalAmount.toFixed(1)} kg
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Applications
                      </span>
                      <span className="text-sm font-medium">
                        {reportData.fertilizer.applicationCount}
                      </span>
                    </div>
                    {reportData.fertilizer.typeBreakdown &&
                      Object.entries(reportData.fertilizer.typeBreakdown)
                        .length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Fertilizer Types Used:
                          </h4>
                          {reportData.fertilizer.typeBreakdown &&
                            Object.entries(
                              reportData.fertilizer.typeBreakdown
                            ).map(([type, amount]) => (
                              <div
                                key={type}
                                className="flex justify-between items-center"
                              >
                                <span className="text-xs text-gray-600">
                                  {type}
                                </span>
                                <span className="text-xs font-medium">
                                  {amount} kg
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                  </div>
                </div>

                {/* Harvest Report */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Harvest Report
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Yield</span>
                      <span className="text-sm font-medium">
                        {reportData.yield.totalYield.toFixed(1)} kg
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Harvest Sessions
                      </span>
                      <span className="text-sm font-medium">
                        {reportData.yield.harvestCount}
                      </span>
                    </div>
                    {reportData.yield.cropBreakdown &&
                      Object.entries(reportData.yield.cropBreakdown).length >
                        0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Yield by Crop:
                          </h4>
                          {reportData.yield.cropBreakdown &&
                            Object.entries(reportData.yield.cropBreakdown).map(
                              ([crop, yieldAmount]) => (
                                <div
                                  key={crop}
                                  className="flex justify-between items-center"
                                >
                                  <span className="text-xs text-gray-600">
                                    {crop}
                                  </span>
                                  <span className="text-xs font-medium">
                                    {yieldAmount} kg
                                  </span>
                                </div>
                              )
                            )}
                        </div>
                      )}
                  </div>
                </div>

                {/* Pest & Disease Report */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Pest & Disease Report
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Total Incidents
                      </span>
                      <span className="text-sm font-medium">
                        {reportData.pestDisease.totalIncidents}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Pest Issues</span>
                      <span className="text-sm font-medium">
                        {reportData.pestDisease.pestCount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Disease Issues
                      </span>
                      <span className="text-sm font-medium">
                        {reportData.pestDisease.diseaseCount}
                      </span>
                    </div>
                    {reportData.pestDisease.severityBreakdown &&
                      Object.entries(reportData.pestDisease.severityBreakdown)
                        .length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Severity Breakdown:
                          </h4>
                          {reportData.pestDisease.severityBreakdown &&
                            Object.entries(
                              reportData.pestDisease.severityBreakdown
                            ).map(([severity, count]) => (
                              <div
                                key={severity}
                                className="flex justify-between items-center"
                              >
                                <span className="text-xs text-gray-600">
                                  {severity}
                                </span>
                                <span className="text-xs font-medium">
                                  {count}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {/* Task Summary */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Task Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {reportData.dashboard.activeTasks}
                    </div>
                    <div className="text-sm text-gray-600">Active Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {reportData.dashboard.overdueTasks}
                    </div>
                    <div className="text-sm text-gray-600">Overdue Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {reportData.dashboard.recentHarvests}
                    </div>
                    <div className="text-sm text-gray-600">Recent Harvests</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
