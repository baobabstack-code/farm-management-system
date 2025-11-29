"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { usePullToRefresh, useIsMobile } from "@/hooks/useMobileGestures";
import { useOnboarding } from "@/hooks/use-onboarding";
import WeatherDashboard from "@/components/weather/WeatherDashboard";
import {
  PageHeader,
  LoadingState,
  PageContainer,
} from "@/components/ui/farm-theme";
import AIInsightsCard from "@/components/ai/AIInsightsCard";
import CropRecommendationsCard from "@/components/ai/CropRecommendationsCard";
import { useAnalytics } from "@/hooks/use-analytics";
import {
  validateDashboardApiResponse,
  type DashboardSummaryResponse,
} from "@/lib/validations/dashboard";
import { useToast } from "@/components/ui/use-toast";
import { VoiceAssistant } from "@/components/VoiceAssistant";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { checking: checkingOnboarding } = useOnboarding();
  const [dashboardData, setDashboardData] =
    useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { trackEvent, trackUserAction } = useAnalytics();
  const { toast } = useToast();

  // Default to New York if no field location is found
  const [farmLatitude, setFarmLatitude] = useState(40.7128);
  const [farmLongitude, setFarmLongitude] = useState(-74.006);
  const [farmLocation, setFarmLocation] = useState("New York, NY");

  useEffect(() => {
    trackEvent("dashboard_viewed"); // Track dashboard view when component mounts
  }, [trackEvent]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch("/api/dashboard/summary");

      const json = await response.json();

      // Check if response indicates success
      if (response.ok && json.success) {
        // Validate response with Zod
        const validatedResponse = validateDashboardApiResponse(json);
        setDashboardData(validatedResponse.data);

        // Update location if available
        if (validatedResponse.data.location) {
          setFarmLatitude(validatedResponse.data.location.latitude);
          setFarmLongitude(validatedResponse.data.location.longitude);
          setFarmLocation(validatedResponse.data.location.name);
        }
      } else {
        // Handle error response
        const errorMessage =
          json.error?.message || `HTTP error! status: ${response.status}`;
        setError(errorMessage);
        toast({
          title: "Error loading dashboard",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Error fetching dashboard data";
      setError(errorMessage);
      toast({
        title: "Error loading dashboard",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

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

  if (!isLoaded || loading || checkingOnboarding) {
    return <LoadingState message="Loading dashboard..." />;
  }

  return (
    <PageContainer
      ref={isMobile ? pullToRefresh.elementRef : null}
      className={isMobile ? "pull-to-refresh-container" : ""} // Add a class if needed for mobile specific styling
    >
      {isMobile && pullToRefresh.refreshIndicator}
      {/* The content-container padding-responsive-lg mobile-header-spacing content-spacing are handled by PageContainer */}
      <PageHeader
        title="Farm Management Dashboard"
        description={`Welcome back, ${user?.firstName || user?.username}! Here's your comprehensive farm overview and key insights.`}
        icon={<span className="text-2xl">📊</span>}
      />

      {error && !dashboardData && (
        <div className="farm-card" role="alert">
          <div className="farm-card-content">
            <div className="flex-center flex-col gap-content py-8">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex-center">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="farm-heading-card text-destructive">
                Unable to Load Dashboard
              </h3>
              <p className="farm-text-muted text-center max-w-md">{error}</p>
              <p className="farm-text-sm text-muted-foreground text-center max-w-md">
                This might be due to a database connection issue. Please check
                your internet connection and try again.
              </p>
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  fetchAnalytics();
                }}
                className="farm-btn farm-btn-primary"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {dashboardData && (
        <React.Fragment>
          {/* Key Metrics */}
          <div
            className="stats-container"
            role="region"
            aria-label="Dashboard statistics"
          >
            <div
              className="stat-card"
              role="article"
              aria-labelledby="total-crops-label"
            >
              <div className="flex-start gap-content">
                <div
                  className="w-12 h-12 bg-gradient-to-br from-success to-success/80 rounded-xl flex-center shadow-sm"
                  aria-hidden="true"
                >
                  <span className="text-white text-xl">🌱</span>
                </div>
                <div className="flex-1">
                  <p id="total-crops-label" className="stat-label">
                    Total Crops
                  </p>
                  <p
                    className="stat-value"
                    aria-label={`${dashboardData.dashboard.totalCrops} total crops`}
                  >
                    {dashboardData.dashboard.totalCrops === 0 ? (
                      <span className="text-muted-foreground">
                        No crops yet
                      </span>
                    ) : (
                      dashboardData.dashboard.totalCrops
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="stat-card"
              role="article"
              aria-labelledby="active-tasks-label"
            >
              <div className="flex-start gap-content">
                <div
                  className="w-12 h-12 bg-gradient-to-br from-info to-info/80 rounded-xl flex-center shadow-sm"
                  aria-hidden="true"
                >
                  <span className="text-white text-xl">📋</span>
                </div>
                <div className="flex-1">
                  <p id="active-tasks-label" className="stat-label">
                    Active Tasks
                  </p>
                  <p
                    className="stat-value"
                    aria-label={`${dashboardData.dashboard.activeTasks} active tasks`}
                  >
                    {dashboardData.dashboard.activeTasks === 0 ? (
                      <span className="text-muted-foreground">
                        No active tasks
                      </span>
                    ) : (
                      dashboardData.dashboard.activeTasks
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="stat-card"
              role="article"
              aria-labelledby="overdue-tasks-label"
            >
              <div className="flex-start gap-content">
                <div
                  className="w-12 h-12 bg-gradient-to-br from-warning to-warning/80 rounded-xl flex-center shadow-sm"
                  aria-hidden="true"
                >
                  <span className="text-white text-xl">⚠️</span>
                </div>
                <div className="flex-1">
                  <p id="overdue-tasks-label" className="stat-label">
                    Overdue Tasks
                  </p>
                  <p
                    className="stat-value"
                    aria-label={`${dashboardData.dashboard.overdueTasks} overdue tasks`}
                  >
                    {dashboardData.dashboard.overdueTasks === 0 ? (
                      <span className="text-success">All caught up!</span>
                    ) : (
                      dashboardData.dashboard.overdueTasks
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="stat-card"
              role="article"
              aria-labelledby="total-yield-label"
            >
              <div className="flex-start gap-content">
                <div
                  className="w-12 h-12 bg-gradient-to-br from-primary to-primary-hover rounded-xl flex-center shadow-sm"
                  aria-hidden="true"
                >
                  <span className="text-white text-xl">🌾</span>
                </div>
                <div className="flex-1">
                  <p id="total-yield-label" className="stat-label">
                    Total Yield
                  </p>
                  <p
                    className="stat-value"
                    aria-label={`${dashboardData.dashboard.totalYield.toFixed(1)} kilograms total yield`}
                  >
                    {dashboardData.dashboard.totalYield === 0 ? (
                      <span className="text-muted-foreground">
                        No harvests yet
                      </span>
                    ) : (
                      `${dashboardData.dashboard.totalYield.toFixed(1)} kg`
                    )}
                  </p>
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
                  onClick={() => {
                    trackUserAction("quick_action_clicked", "dashboard", {
                      action: "ai_companion",
                    });
                    router.push("/ai-companion");
                  }}
                  className="farm-btn farm-btn-success w-full"
                >
                  <span className="text-lg">🤖</span>
                  AI Companion
                </button>
                <button
                  onClick={() => {
                    trackUserAction("quick_action_clicked", "dashboard", {
                      action: "manage_crops",
                    });
                    router.push("/crops");
                  }}
                  className="farm-btn farm-btn-success w-full"
                >
                  <span className="text-lg">🌱</span>
                  Manage Crops
                </button>
                <button
                  onClick={() => {
                    trackUserAction("quick_action_clicked", "dashboard", {
                      action: "view_tasks",
                    });
                    router.push("/tasks");
                  }}
                  className="farm-btn farm-btn-success w-full"
                >
                  <span className="text-lg">✅</span>
                  View Tasks
                </button>
                <button
                  onClick={() => {
                    trackUserAction("quick_action_clicked", "dashboard", {
                      action: "log_activity",
                    });
                    router.push("/activities");
                  }}
                  className="farm-btn farm-btn-success w-full"
                >
                  <span className="text-lg">📋</span>
                  Log Activity
                </button>
                <button
                  onClick={() => {
                    trackUserAction("quick_action_clicked", "dashboard", {
                      action: "view_reports",
                    });
                    router.push("/reports");
                  }}
                  className="farm-btn farm-btn-success w-full"
                >
                  <span className="text-lg">📈</span>
                  View Reports
                </button>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <AIInsightsCard />

          {/* Voice Assistant */}
          <VoiceAssistant />

          {/* Crop Recommendations */}
          <CropRecommendationsCard />

          {/* Weather Dashboard */}
          <WeatherDashboard
            latitude={farmLatitude}
            longitude={farmLongitude}
            location={farmLocation}
          />

          {/* Recent Tasks Widget */}
          <div
            className="farm-card"
            role="region"
            aria-labelledby="recent-tasks-heading"
          >
            <div className="farm-card-header">
              <div className="icon-text">
                <div className="w-10 h-10 bg-gradient-to-br from-info to-info/80 rounded-lg flex-center">
                  <span className="text-white text-lg">📋</span>
                </div>
                <h3 id="recent-tasks-heading" className="farm-heading-card">
                  Recent Tasks
                </h3>
              </div>
              <button
                onClick={() => {
                  trackUserAction("view_all_tasks_clicked", "dashboard");
                  router.push("/tasks");
                }}
                className="farm-btn farm-btn-ghost farm-btn-sm"
                aria-label="View all tasks"
              >
                View All →
              </button>
            </div>
            <div className="farm-card-content">
              {!dashboardData.recentTasks ||
              dashboardData.recentTasks.length === 0 ? (
                <div
                  className="flex-center flex-col gap-content py-8"
                  role="status"
                >
                  <div className="w-16 h-16 bg-muted rounded-full flex-center">
                    <span className="text-3xl">📝</span>
                  </div>
                  <p className="farm-text-muted text-center">No tasks yet</p>
                  <button
                    onClick={() => {
                      trackUserAction("create_task_clicked", "dashboard");
                      router.push("/tasks");
                    }}
                    className="farm-btn farm-btn-primary farm-btn-sm"
                  >
                    Create Your First Task
                  </button>
                </div>
              ) : (
                <div className="space-y-3" role="list">
                  {dashboardData.recentTasks.slice(0, 10).map((task) => {
                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case "COMPLETED":
                          return "bg-success/10 text-success border-success/20";
                        case "IN_PROGRESS":
                          return "bg-info/10 text-info border-info/20";
                        case "CANCELLED":
                          return "bg-muted text-muted-foreground border-muted";
                        default: // PENDING
                          return "bg-warning/10 text-warning border-warning/20";
                      }
                    };

                    const getPriorityIcon = (priority: string) => {
                      switch (priority) {
                        case "HIGH":
                          return "🔴";
                        case "MEDIUM":
                          return "🟡";
                        default: // LOW
                          return "🟢";
                      }
                    };

                    const formatDate = (dateString: string) => {
                      const date = new Date(dateString);
                      const now = new Date();
                      const diffTime = date.getTime() - now.getTime();
                      const diffDays = Math.ceil(
                        diffTime / (1000 * 60 * 60 * 24)
                      );

                      if (diffDays < 0) {
                        return `${Math.abs(diffDays)} days overdue`;
                      } else if (diffDays === 0) {
                        return "Due today";
                      } else if (diffDays === 1) {
                        return "Due tomorrow";
                      } else {
                        return `Due in ${diffDays} days`;
                      }
                    };

                    return (
                      <div
                        key={task.id}
                        className="flex-between gap-content p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                        role="listitem"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex-start gap-2 mb-1">
                            <span
                              aria-label={`Priority: ${task.priority.toLowerCase()}`}
                            >
                              {getPriorityIcon(task.priority)}
                            </span>
                            <h4 className="farm-text-body font-semibold truncate">
                              {task.title}
                            </h4>
                          </div>
                          {task.cropName && (
                            <p className="farm-text-sm text-muted-foreground mb-1">
                              Crop: {task.cropName}
                            </p>
                          )}
                          <div className="flex-start gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}
                              role="status"
                              aria-label={`Status: ${task.status.toLowerCase().replace("_", " ")}`}
                            >
                              {task.status.replace("_", " ")}
                            </span>
                            <span className="farm-text-xs text-muted-foreground">
                              {formatDate(task.dueDate)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            trackUserAction("task_clicked", "dashboard", {
                              taskId: task.id,
                            });
                            router.push(`/tasks/${task.id}`);
                          }}
                          className="farm-btn farm-btn-ghost farm-btn-sm shrink-0"
                          aria-label={`View task: ${task.title}`}
                        >
                          View
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Harvests Widget */}
          <div
            className="farm-card"
            role="region"
            aria-labelledby="upcoming-harvests-heading"
          >
            <div className="farm-card-header">
              <div className="icon-text">
                <div className="w-10 h-10 bg-gradient-to-br from-success to-success/80 rounded-lg flex-center">
                  <span className="text-white text-lg">🌾</span>
                </div>
                <h3
                  id="upcoming-harvests-heading"
                  className="farm-heading-card"
                >
                  Upcoming Harvests
                </h3>
              </div>
              <button
                onClick={() => {
                  trackUserAction("view_all_crops_clicked", "dashboard");
                  router.push("/crops");
                }}
                className="farm-btn farm-btn-ghost farm-btn-sm"
                aria-label="View all crops"
              >
                View All →
              </button>
            </div>
            <div className="farm-card-content">
              {!dashboardData.upcomingHarvests ||
              dashboardData.upcomingHarvests.length === 0 ? (
                <div
                  className="flex-center flex-col gap-content py-8"
                  role="status"
                >
                  <div className="w-16 h-16 bg-muted rounded-full flex-center">
                    <span className="text-3xl">🌱</span>
                  </div>
                  <p className="farm-text-muted text-center">
                    No upcoming harvests in the next 30 days
                  </p>
                  <button
                    onClick={() => {
                      trackUserAction("add_crop_clicked", "dashboard");
                      router.push("/crops");
                    }}
                    className="farm-btn farm-btn-primary farm-btn-sm"
                  >
                    Add Crops
                  </button>
                </div>
              ) : (
                <div className="space-y-3" role="list">
                  {dashboardData.upcomingHarvests.map((crop) => {
                    const harvestDate = new Date(crop.expectedHarvestDate);
                    const now = new Date();
                    const diffTime = harvestDate.getTime() - now.getTime();
                    const daysUntilHarvest = Math.ceil(
                      diffTime / (1000 * 60 * 60 * 24)
                    );

                    // Determine urgency level for visual indicators
                    const getUrgencyColor = (days: number) => {
                      if (days <= 3) {
                        return "bg-destructive/10 text-destructive border-destructive/20";
                      } else if (days <= 7) {
                        return "bg-warning/10 text-warning border-warning/20";
                      } else if (days <= 14) {
                        return "bg-info/10 text-info border-info/20";
                      } else {
                        return "bg-success/10 text-success border-success/20";
                      }
                    };

                    const getUrgencyIcon = (days: number) => {
                      if (days <= 3) {
                        return "🔴";
                      } else if (days <= 7) {
                        return "🟡";
                      } else {
                        return "🟢";
                      }
                    };

                    const formatDaysUntilHarvest = (days: number) => {
                      if (days === 0) {
                        return "Harvest today!";
                      } else if (days === 1) {
                        return "Harvest tomorrow";
                      } else {
                        return `${days} days until harvest`;
                      }
                    };

                    return (
                      <div
                        key={crop.id}
                        className="flex-between gap-content p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                        role="listitem"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex-start gap-2 mb-1">
                            <span
                              aria-label={`Urgency: ${daysUntilHarvest <= 3 ? "high" : daysUntilHarvest <= 7 ? "medium" : "low"}`}
                            >
                              {getUrgencyIcon(daysUntilHarvest)}
                            </span>
                            <h4 className="farm-text-body font-semibold truncate">
                              {crop.name}
                              {crop.variety && (
                                <span className="farm-text-sm text-muted-foreground font-normal ml-1">
                                  ({crop.variety})
                                </span>
                              )}
                            </h4>
                          </div>
                          <div className="flex-start gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getUrgencyColor(daysUntilHarvest)}`}
                              role="status"
                              aria-label={formatDaysUntilHarvest(
                                daysUntilHarvest
                              )}
                            >
                              {formatDaysUntilHarvest(daysUntilHarvest)}
                            </span>
                            <span className="farm-text-xs text-muted-foreground">
                              Status: {crop.status.replace("_", " ")}
                            </span>
                            {crop.area && (
                              <span className="farm-text-xs text-muted-foreground">
                                Area: {crop.area.toFixed(1)} ha
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            trackUserAction("crop_clicked", "dashboard", {
                              cropId: crop.id,
                            });
                            router.push(`/crops/${crop.id}`);
                          }}
                          className="farm-btn farm-btn-ghost farm-btn-sm shrink-0"
                          aria-label={`View crop: ${crop.name}`}
                        >
                          View
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Financial Summary Widget */}
          <div
            className="farm-card"
            role="region"
            aria-labelledby="financial-summary-heading"
          >
            <div className="farm-card-header">
              <div className="icon-text">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-hover rounded-lg flex-center">
                  <span className="text-white text-lg">💰</span>
                </div>
                <h3
                  id="financial-summary-heading"
                  className="farm-heading-card"
                >
                  Financial Summary
                </h3>
              </div>
              <button
                onClick={() => {
                  trackUserAction("view_financials_clicked", "dashboard");
                  router.push("/financial");
                }}
                className="farm-btn farm-btn-ghost farm-btn-sm"
                aria-label="View detailed financials"
              >
                View Details →
              </button>
            </div>
            <div className="farm-card-content">
              {dashboardData.dashboard.totalYield === 0 &&
              dashboardData.water.totalWater === 0 &&
              dashboardData.fertilizer.applicationCount === 0 ? (
                <div
                  className="flex-center flex-col gap-content py-8"
                  role="status"
                >
                  <div className="w-16 h-16 bg-muted rounded-full flex-center">
                    <span className="text-3xl">📊</span>
                  </div>
                  <p className="farm-text-muted text-center">
                    No financial data yet
                  </p>
                  <p className="farm-text-sm text-muted-foreground text-center">
                    Start tracking your farm activities to see financial
                    insights
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Revenue */}
                  <div className="flex-between p-4 rounded-lg bg-success/5 border border-success/20">
                    <div className="flex-1">
                      <div className="flex-start gap-2 mb-1">
                        <span
                          className="text-success text-lg"
                          aria-hidden="true"
                        >
                          📈
                        </span>
                        <p className="farm-text-sm text-muted-foreground">
                          Total Revenue
                        </p>
                      </div>
                      <p
                        className="text-2xl font-bold text-success"
                        aria-label={`Total revenue: ${dashboardData.financial?.totalIncome?.toLocaleString("en-US", { style: "currency", currency: "USD" }) || "$0.00"}`}
                      >
                        {dashboardData.financial?.totalIncome
                          ? dashboardData.financial.totalIncome.toLocaleString(
                              "en-US",
                              {
                                style: "currency",
                                currency: "USD",
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )
                          : "$0.00"}
                      </p>
                    </div>
                  </div>

                  {/* Expenses */}
                  <div className="flex-between p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                    <div className="flex-1">
                      <div className="flex-start gap-2 mb-1">
                        <span
                          className="text-destructive text-lg"
                          aria-hidden="true"
                        >
                          📉
                        </span>
                        <p className="farm-text-sm text-muted-foreground">
                          Total Expenses
                        </p>
                      </div>
                      <p
                        className="text-2xl font-bold text-destructive"
                        aria-label={`Total expenses: ${dashboardData.financial?.totalExpenses?.toLocaleString("en-US", { style: "currency", currency: "USD" }) || "$0.00"}`}
                      >
                        {dashboardData.financial?.totalExpenses
                          ? dashboardData.financial.totalExpenses.toLocaleString(
                              "en-US",
                              {
                                style: "currency",
                                currency: "USD",
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )
                          : "$0.00"}
                      </p>
                    </div>
                  </div>

                  {/* Net Balance */}
                  <div
                    className={`flex-between p-4 rounded-lg border ${
                      (dashboardData.financial?.balance || 0) >= 0
                        ? "bg-info/5 border-info/20"
                        : "bg-warning/5 border-warning/20"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex-start gap-2 mb-1">
                        <span className="text-lg" aria-hidden="true">
                          {(dashboardData.financial?.balance || 0) >= 0
                            ? "💵"
                            : "⚠️"}
                        </span>
                        <p className="farm-text-sm text-muted-foreground">
                          Net Balance
                        </p>
                      </div>
                      <div className="flex-start gap-3 items-baseline">
                        <p
                          className={`text-2xl font-bold ${
                            (dashboardData.financial?.balance || 0) >= 0
                              ? "text-info"
                              : "text-warning"
                          }`}
                          aria-label={`Net balance: ${dashboardData.financial?.balance?.toLocaleString("en-US", { style: "currency", currency: "USD" }) || "$0.00"}`}
                        >
                          {dashboardData.financial?.balance !== undefined
                            ? dashboardData.financial.balance.toLocaleString(
                                "en-US",
                                {
                                  style: "currency",
                                  currency: "USD",
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )
                            : "$0.00"}
                        </p>
                        {dashboardData.financial?.balance !== undefined && (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              dashboardData.financial.balance >= 0
                                ? "bg-success/10 text-success"
                                : "bg-warning/10 text-warning"
                            }`}
                            role="status"
                          >
                            {dashboardData.financial.balance >= 0
                              ? "↑ Positive"
                              : "↓ Negative"}
                          </span>
                        )}
                      </div>
                      {dashboardData.financial?.balance === 0 && (
                        <p className="farm-text-xs text-muted-foreground mt-2">
                          Revenue and expenses are balanced
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Transaction Count */}
                  {dashboardData.financial?.transactionCount !== undefined && (
                    <div className="flex-between pt-2 border-t border-border">
                      <span className="farm-text-sm text-muted-foreground">
                        Total Transactions
                      </span>
                      <span className="farm-text-sm font-semibold">
                        {dashboardData.financial.transactionCount}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

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
                  <span className="farm-text-muted">Water Usage:</span>
                  <span className="farm-text-body font-semibold">
                    {dashboardData.water.totalWater.toFixed(1)} L
                  </span>
                </div>
                <div className="flex-between py-2">
                  <span className="farm-text-muted">Irrigation Sessions:</span>
                  <span className="farm-text-body font-semibold">
                    {dashboardData.water.sessionCount}
                  </span>
                </div>
                <div className="flex-between py-2">
                  <span className="farm-text-muted">
                    Fertilizer Applications:
                  </span>
                  <span className="farm-text-body font-semibold">
                    {dashboardData.fertilizer.applicationCount}
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
                  <span className="farm-text-muted">Total Incidents:</span>
                  <span className="farm-text-body font-semibold">
                    {dashboardData.pestDisease.totalIncidents}
                  </span>
                </div>
                <div className="flex-between py-2">
                  <span className="farm-text-muted">Pest Issues:</span>
                  <span className="farm-text-body font-semibold">
                    {dashboardData.pestDisease.pestCount}
                  </span>
                </div>
                <div className="flex-between py-2">
                  <span className="farm-text-muted">Disease Issues:</span>
                  <span className="farm-text-body font-semibold">
                    {dashboardData.pestDisease.diseaseCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </React.Fragment>
      )}
    </PageContainer>
  );
}
