"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface DashboardStats {
  totalCrops: number;
  activeTasks: number;
  overdueTasks: number;
  recentHarvests: number;
  totalYield: number;
  waterUsage: number;
}

interface Analytics {
  dashboard: DashboardStats;
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

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push("/sign-in");
      return;
    }

    fetchAnalytics();
  }, [user, isLoaded, router]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/analytics");
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.data);
      } else {
        setError("Failed to fetch analytics");
      }
    } catch {
      setError("Error fetching analytics");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center text-gray-900 dark:text-gray-100">
              Loading...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-gray-800">
      <div className="content-container py-4 sm:py-6 lg:py-8">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-2">
            Farm Management Dashboard
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
            Welcome back, {user?.firstName || user?.username}! Here&apos;s your
            comprehensive farm overview and key insights.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded">
            {error}
          </div>
        )}

        {analytics && (
          <React.Fragment>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
              <div className="metric-card group cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-sm">
                      <span className="text-white text-lg">🌱</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Crops
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {analytics.dashboard.totalCrops}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="metric-card group cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                      <span className="text-white text-lg">📋</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Active Tasks
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {analytics.dashboard.activeTasks}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="metric-card group cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-sm">
                      <span className="text-white text-lg">⚠️</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Overdue Tasks
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {analytics.dashboard.overdueTasks}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="metric-card group cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                      <span className="text-white text-lg">🌾</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Yield
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {analytics.dashboard.totalYield.toFixed(1)} kg
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 lg:mb-8">
              <div className="card-enhanced p-4 sm:p-6">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white text-sm">💧</span>
                  </div>
                  <h3 className="text-heading text-gray-900">Resource Usage</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Water Usage</span>
                    <span className="text-sm font-medium">
                      {analytics.water.totalWater.toFixed(1)} L
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Irrigation Sessions
                    </span>
                    <span className="text-sm font-medium">
                      {analytics.water.sessionCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Fertilizer Applications
                    </span>
                    <span className="text-sm font-medium">
                      {analytics.fertilizer.applicationCount}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card-enhanced p-4 sm:p-6">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-red-600 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white text-sm">🌡️</span>
                  </div>
                  <h3 className="text-heading text-gray-900">
                    Health & Issues
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Total Incidents
                    </span>
                    <span className="text-sm font-medium">
                      {analytics.pestDisease.totalIncidents}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pest Issues</span>
                    <span className="text-sm font-medium">
                      {analytics.pestDisease.pestCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Disease Issues
                    </span>
                    <span className="text-sm font-medium">
                      {analytics.pestDisease.diseaseCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card-enhanced p-4 sm:p-6">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-sm">⚡</span>
                </div>
                <h3 className="text-heading text-gray-900">Quick Actions</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <button
                  onClick={() => router.push("/ai-companion")}
                  className="btn-enhanced btn-primary group"
                >
                  <span className="mr-2">🤖</span>
                  AI Companion
                </button>
                <button
                  onClick={() => router.push("/crops")}
                  className="btn-enhanced bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm hover:shadow"
                >
                  <span className="mr-2">🌱</span>
                  Manage Crops
                </button>
                <button
                  onClick={() => router.push("/tasks")}
                  className="btn-enhanced bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm hover:shadow"
                >
                  <span className="mr-2">✅</span>
                  View Tasks
                </button>
                <button
                  onClick={() => router.push("/activities")}
                  className="btn-enhanced bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500 shadow-sm hover:shadow"
                >
                  <span className="mr-2">📋</span>
                  Log Activity
                </button>
                <button
                  onClick={() => router.push("/reports")}
                  className="btn-enhanced bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500 shadow-sm hover:shadow"
                >
                  <span className="mr-2">📈</span>
                  View Reports
                </button>
              </div>
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}
