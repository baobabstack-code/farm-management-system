"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { usePullToRefresh, useIsMobile } from "@/hooks/useMobileGestures";
import WeatherDashboard from "@/components/weather/WeatherDashboard";
import { PageHeader, LoadingState } from "@/components/ui/farm-theme";

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
    return <LoadingState message="Loading dashboard..." />;
  }

  return (
    <div
      ref={isMobile ? pullToRefresh.elementRef : null}
      className="page-container"
    >
      {isMobile && pullToRefresh.refreshIndicator}
      <div className="content-container padding-responsive-lg mobile-header-spacing content-spacing">
        <PageHeader
          title="Farm Management Dashboard"
          description={`Welcome back, ${user?.firstName || user?.username}! Here's your comprehensive farm overview and key insights.`}
          icon={<span className="text-2xl">📊</span>}
        />

        {/* {error && (
          <div className="farm-card border-destructive/20 bg-destructive/5">
            <div className="flex-center gap-content padding-responsive">
              <div className="flex-center w-10 h-10 bg-destructive/10 rounded-full">
                <span className="text-destructive text-lg">⚠️</span>
              </div>
              <span className="text-destructive font-medium">{error}</span>
            </div>
          </div>
        )} */}

        {analytics && (
          <React.Fragment>
            {/* Key Metrics */}
            <div className="stats-container">
              <div className="stat-card">
                <div className="flex-start gap-content">
                  <div className="w-12 h-12 bg-gradient-to-br from-success to-success/80 rounded-xl flex-center shadow-sm">
                    <span className="text-white text-xl">🌱</span>
                  </div>
                  <div className="flex-1">
                    <p className="stat-label">Total Crops</p>
                    <p className="stat-value">
                      {analytics.dashboard.totalCrops}
                    </p>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="flex-start gap-content">
                  <div className="w-12 h-12 bg-gradient-to-br from-info to-info/80 rounded-xl flex-center shadow-sm">
                    <span className="text-white text-xl">📋</span>
                  </div>
                  <div className="flex-1">
                    <p className="stat-label">Active Tasks</p>
                    <p className="stat-value">
                      {analytics.dashboard.activeTasks}
                    </p>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="flex-start gap-content">
                  <div className="w-12 h-12 bg-gradient-to-br from-warning to-warning/80 rounded-xl flex-center shadow-sm">
                    <span className="text-white text-xl">⚠️</span>
                  </div>
                  <div className="flex-1">
                    <p className="stat-label">Overdue Tasks</p>
                    <p className="stat-value">
                      {analytics.dashboard.overdueTasks}
                    </p>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="flex-start gap-content">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-hover rounded-xl flex-center shadow-sm">
                    <span className="text-white text-xl">🌾</span>
                  </div>
                  <div className="flex-1">
                    <p className="stat-label">Total Yield</p>
                    <p className="stat-value">
                      {analytics.dashboard.totalYield.toFixed(1)} kg
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Weather Dashboard */}
            <WeatherDashboard />

            {/* Activity Summary */}
            <div className="farm-grid grid-cols-1 lg:grid-cols-2">
              <div className="farm-card">
                <div className="farm-card-header">
                  <div className="icon-text">
                    <div className="w-10 h-10 bg-gradient-to-br from-info to-info/80 rounded-lg flex-center">
                      <span className="text-white text-lg">💧</span>
                    </div>
                    <h3 className="farm-heading-card">Resource Usage</h3>
                  </div>
                </div>
                <div className="farm-card-content">
                  <div className="flex-between py-2">
                    <span className="farm-text-muted">Water Usage</span>
                    <span className="farm-text-body font-semibold">
                      {analytics.water.totalWater.toFixed(1)} L
                    </span>
                  </div>
                  <div className="flex-between py-2">
                    <span className="farm-text-muted">Irrigation Sessions</span>
                    <span className="farm-text-body font-semibold">
                      {analytics.water.sessionCount}
                    </span>
                  </div>
                  <div className="flex-between py-2">
                    <span className="farm-text-muted">
                      Fertilizer Applications
                    </span>
                    <span className="farm-text-body font-semibold">
                      {analytics.fertilizer.applicationCount}
                    </span>
                  </div>
                </div>
              </div>

              <div className="farm-card">
                <div className="farm-card-header">
                  <div className="icon-text">
                    <div className="w-10 h-10 bg-gradient-to-br from-warning to-warning/80 rounded-lg flex-center">
                      <span className="text-white text-lg">🌡️</span>
                    </div>
                    <h3 className="farm-heading-card">Health & Issues</h3>
                  </div>
                </div>
                <div className="farm-card-content">
                  <div className="flex-between py-2">
                    <span className="farm-text-muted">Total Incidents</span>
                    <span className="farm-text-body font-semibold">
                      {analytics.pestDisease.totalIncidents}
                    </span>
                  </div>
                  <div className="flex-between py-2">
                    <span className="farm-text-muted">Pest Issues</span>
                    <span className="farm-text-body font-semibold">
                      {analytics.pestDisease.pestCount}
                    </span>
                  </div>
                  <div className="flex-between py-2">
                    <span className="farm-text-muted">Disease Issues</span>
                    <span className="farm-text-body font-semibold">
                      {analytics.pestDisease.diseaseCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="farm-card">
              <div className="farm-card-header">
                <div className="icon-text">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-hover rounded-lg flex-center">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                  <h3 className="farm-heading-card">Quick Actions</h3>
                </div>
              </div>
              <div className="farm-card-content">
                <div className="farm-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                  <button
                    onClick={() => router.push("/ai-companion")}
                    className="farm-btn farm-btn-success w-full"
                  >
                    <span className="text-lg">🤖</span>
                    AI Companion
                  </button>
                  <button
                    onClick={() => router.push("/crops")}
                    className="farm-btn farm-btn-success w-full"
                  >
                    <span className="text-lg">🌱</span>
                    Manage Crops
                  </button>
                  <button
                    onClick={() => router.push("/tasks")}
                    className="farm-btn farm-btn-success w-full"
                  >
                    <span className="text-lg">✅</span>
                    View Tasks
                  </button>
                  <button
                    onClick={() => router.push("/activities")}
                    className="farm-btn farm-btn-success w-full"
                  >
                    <span className="text-lg">📋</span>
                    Log Activity
                  </button>
                  <button
                    onClick={() => router.push("/reports")}
                    className="farm-btn farm-btn-success w-full"
                  >
                    <span className="text-lg">📈</span>
                    View Reports
                  </button>
                </div>
              </div>
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}
