"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { usePullToRefresh, useIsMobile } from "@/hooks/useMobileGestures";
import WeatherDashboard from "@/components/weather/WeatherDashboard";

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

  const fetchAnalytics = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push("/sign-in");
      return;
    }

    fetchAnalytics();
  }, [user, isLoaded, router, fetchAnalytics]);

  const isMobile = useIsMobile();
  const pullToRefresh = usePullToRefresh<HTMLDivElement>({
    onRefresh: fetchAnalytics,
    threshold: 80,
  });

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
    <div
      ref={isMobile ? pullToRefresh.elementRef : null}
      className="page-container"
    >
      {isMobile && pullToRefresh.refreshIndicator}
      <div className="content-container py-4 sm:py-6 lg:py-8">
        <div className="farm-page-header">
          <div className="farm-page-title-section">
            <div className="farm-page-title-group">
              <div className="farm-page-icon bg-gradient-to-br from-primary to-primary-hover">
                <span className="text-white text-2xl">📊</span>
              </div>
              <div className="farm-page-title-text">
                <h1 className="farm-heading-display">
                  Farm Management Dashboard
                </h1>
                <p className="farm-text-muted mt-1 max-w-2xl">
                  Welcome back, {user?.firstName || user?.username}! Here&apos;s
                  your comprehensive farm overview and key insights.
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6">
            <div className="farm-card border-destructive/20 bg-destructive/5">
              <div className="p-4 text-center">
                <span className="text-destructive text-lg mr-2">⚠️</span>
                <span className="text-destructive font-medium">{error}</span>
              </div>
            </div>
          </div>
        )}

        {analytics && (
          <React.Fragment>
            {/* Key Metrics */}
            <div className="farm-grid-metrics mb-6 lg:mb-8">
              <div className="farm-card farm-card-interactive">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-success to-success/80 rounded-xl flex items-center justify-center shadow-sm">
                    <span className="text-white text-lg">🌱</span>
                  </div>
                  <div>
                    <p className="farm-text-caption">Total Crops</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">
                      {analytics.dashboard.totalCrops}
                    </p>
                  </div>
                </div>
              </div>

              <div className="farm-card farm-card-interactive">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-info to-info/80 rounded-xl flex items-center justify-center shadow-sm">
                    <span className="text-white text-lg">📋</span>
                  </div>
                  <div>
                    <p className="farm-text-caption">Active Tasks</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">
                      {analytics.dashboard.activeTasks}
                    </p>
                  </div>
                </div>
              </div>

              <div className="farm-card farm-card-interactive">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-warning to-warning/80 rounded-xl flex items-center justify-center shadow-sm">
                    <span className="text-white text-lg">⚠️</span>
                  </div>
                  <div>
                    <p className="farm-text-caption">Overdue Tasks</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">
                      {analytics.dashboard.overdueTasks}
                    </p>
                  </div>
                </div>
              </div>

              <div className="farm-card farm-card-interactive">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-hover rounded-xl flex items-center justify-center shadow-sm">
                    <span className="text-white text-lg">🌾</span>
                  </div>
                  <div>
                    <p className="farm-text-caption">Total Yield</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">
                      {analytics.dashboard.totalYield.toFixed(1)} kg
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Weather Dashboard */}
            <div className="mb-6 lg:mb-8">
              <WeatherDashboard />
            </div>

            {/* Activity Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 lg:mb-8">
              <div className="farm-card">
                <div className="farm-card-header">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-info to-info/80 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white text-sm">💧</span>
                    </div>
                    <h3 className="farm-heading-card">Resource Usage</h3>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-1">
                    <span className="farm-text-muted">Water Usage</span>
                    <span className="farm-text-body font-medium">
                      {analytics.water.totalWater.toFixed(1)} L
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="farm-text-muted">Irrigation Sessions</span>
                    <span className="farm-text-body font-medium">
                      {analytics.water.sessionCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="farm-text-muted">
                      Fertilizer Applications
                    </span>
                    <span className="farm-text-body font-medium">
                      {analytics.fertilizer.applicationCount}
                    </span>
                  </div>
                </div>
              </div>

              <div className="farm-card">
                <div className="farm-card-header">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-warning to-warning/80 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white text-sm">🌡️</span>
                    </div>
                    <h3 className="farm-heading-card">Health & Issues</h3>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-1">
                    <span className="farm-text-muted">Total Incidents</span>
                    <span className="farm-text-body font-medium">
                      {analytics.pestDisease.totalIncidents}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="farm-text-muted">Pest Issues</span>
                    <span className="farm-text-body font-medium">
                      {analytics.pestDisease.pestCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="farm-text-muted">Disease Issues</span>
                    <span className="farm-text-body font-medium">
                      {analytics.pestDisease.diseaseCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="farm-card">
              <div className="farm-card-header">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-hover rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white text-sm">⚡</span>
                  </div>
                  <h3 className="farm-heading-card">Quick Actions</h3>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <button
                  onClick={() => router.push("/ai-companion")}
                  className="farm-btn farm-btn-primary w-full"
                >
                  <span className="mr-2 text-base sm:text-lg">🤖</span>
                  <span className="text-sm sm:text-base font-medium">
                    AI Companion
                  </span>
                </button>
                <button
                  onClick={() => router.push("/crops")}
                  className="farm-btn farm-btn-success w-full"
                >
                  <span className="mr-2 text-base sm:text-lg">🌱</span>
                  <span className="text-sm sm:text-base font-medium">
                    Manage Crops
                  </span>
                </button>
                <button
                  onClick={() => router.push("/tasks")}
                  className="farm-btn farm-btn-secondary w-full"
                >
                  <span className="mr-2 text-base sm:text-lg">✅</span>
                  <span className="text-sm sm:text-base font-medium">
                    View Tasks
                  </span>
                </button>
                <button
                  onClick={() => router.push("/activities")}
                  className="farm-btn farm-btn-outline w-full"
                >
                  <span className="mr-2 text-base sm:text-lg">📋</span>
                  <span className="text-sm sm:text-base font-medium">
                    Log Activity
                  </span>
                </button>
                <button
                  onClick={() => router.push("/reports")}
                  className="farm-btn farm-btn-outline w-full"
                >
                  <span className="mr-2 text-base sm:text-lg">📈</span>
                  <span className="text-sm sm:text-base font-medium">
                    View Reports
                  </span>
                </button>
              </div>
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}
