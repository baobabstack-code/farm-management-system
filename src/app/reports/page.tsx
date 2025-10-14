"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  PageHeader,
  FarmCard,
  FarmCardHeader,
  FarmCardContent,
  FarmButton,
  LoadingState,
} from "@/components/ui/farm-theme";
import { BarChart3, Download, Calendar, TrendingUp } from "lucide-react";

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

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push("/sign-in");
      return;
    }

    if (user) {
      fetchReportData();
    }
  }, [user, isLoaded, router, dateRange, fetchReportData]);

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
      ["Water", "Total Water (L)", reportData.water.totalWater],
      ["Water", "Average Per Session (L)", reportData.water.averagePerSession],
      ["Water", "Session Count", reportData.water.sessionCount],
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
    return <LoadingState message="Loading report data..." />;
  }

  return (
    <div className="page-container">
      <div className="content-container padding-responsive-lg mobile-header-spacing content-spacing">
        <PageHeader
          title="Farm Reports & Analytics"
          description="Comprehensive insights into your farm performance"
          icon={<BarChart3 className="w-6 h-6" />}
          actions={
            <FarmButton
              onClick={exportToCSV}
              disabled={!reportData}
              variant="success"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </FarmButton>
          }
        />

        {error && (
          <div className="farm-card border-destructive/20 bg-destructive/5">
            <div className="flex-center gap-content padding-responsive">
              <div className="flex-center w-10 h-10 bg-destructive/10 rounded-full">
                <span className="text-destructive text-lg">⚠️</span>
              </div>
              <span className="text-destructive font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Date Range Filter */}
        <FarmCard>
          <FarmCardHeader
            title="Report Filters"
            description="Select date range for your reports"
          />
          <FarmCardContent>
            <div className="farm-grid grid-cols-1 md:grid-cols-3">
              <div>
                <label className="farm-label">Start Date</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, startDate: e.target.value })
                  }
                  className="farm-input"
                />
              </div>
              <div>
                <label className="farm-label">End Date</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, endDate: e.target.value })
                  }
                  className="farm-input"
                />
              </div>
              <div className="flex items-end">
                <FarmButton
                  onClick={fetchReportData}
                  variant="success"
                  className="w-full"
                >
                  <TrendingUp className="w-4 h-4" />
                  Update Report
                </FarmButton>
              </div>
            </div>
          </FarmCardContent>
        </FarmCard>

        {reportData && (
          <>
            {/* Dashboard Metrics */}
            <FarmCard>
              <FarmCardHeader
                title="Dashboard Overview"
                description="Key farm metrics and performance indicators"
              />
              <FarmCardContent>
                <div className="stats-container">
                  <div className="stat-card">
                    <div className="flex-start gap-content">
                      <div className="w-12 h-12 bg-gradient-to-br from-success to-success/80 rounded-xl flex-center shadow-sm">
                        <span className="text-white text-xl">🌱</span>
                      </div>
                      <div className="flex-1">
                        <p className="stat-label">Total Crops</p>
                        <p className="stat-value">
                          {reportData.dashboard.totalCrops}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="flex-start gap-content">
                      <div className="w-12 h-12 bg-gradient-to-br from-info to-info/80 rounded-xl flex-center shadow-sm">
                        <span className="text-white text-xl">✅</span>
                      </div>
                      <div className="flex-1">
                        <p className="stat-label">Active Tasks</p>
                        <p className="stat-value">
                          {reportData.dashboard.activeTasks}
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
                          {reportData.dashboard.overdueTasks}
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
                          {reportData.dashboard.totalYield} kg
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </FarmCardContent>
            </FarmCard>

            {/* Resource Usage */}
            <div className="farm-grid grid-cols-1 lg:grid-cols-2">
              <FarmCard>
                <FarmCardHeader
                  title="Water Usage"
                  description="Irrigation and water management metrics"
                />
                <FarmCardContent>
                  <div className="farm-card-content">
                    <div className="flex-between py-2">
                      <span className="farm-text-muted">Total Water Used</span>
                      <span className="farm-text-body font-semibold">
                        {reportData.water.totalWater} L
                      </span>
                    </div>
                    <div className="flex-between py-2">
                      <span className="farm-text-muted">
                        Average Per Session
                      </span>
                      <span className="farm-text-body font-semibold">
                        {reportData.water.averagePerSession} L
                      </span>
                    </div>
                    <div className="flex-between py-2">
                      <span className="farm-text-muted">Total Sessions</span>
                      <span className="farm-text-body font-semibold">
                        {reportData.water.sessionCount}
                      </span>
                    </div>
                  </div>
                </FarmCardContent>
              </FarmCard>

              <FarmCard>
                <FarmCardHeader
                  title="Fertilizer Usage"
                  description="Fertilizer application and usage metrics"
                />
                <FarmCardContent>
                  <div className="farm-card-content">
                    <div className="flex-between py-2">
                      <span className="farm-text-muted">Total Amount</span>
                      <span className="farm-text-body font-semibold">
                        {reportData.fertilizer.totalAmount} kg
                      </span>
                    </div>
                    <div className="flex-between py-2">
                      <span className="farm-text-muted">Applications</span>
                      <span className="farm-text-body font-semibold">
                        {reportData.fertilizer.applicationCount}
                      </span>
                    </div>
                  </div>
                </FarmCardContent>
              </FarmCard>
            </div>

            {/* Health & Issues */}
            <FarmCard>
              <FarmCardHeader
                title="Pest & Disease Management"
                description="Health monitoring and issue tracking"
              />
              <FarmCardContent>
                <div className="farm-card-content">
                  <div className="flex-between py-2">
                    <span className="farm-text-muted">Total Incidents</span>
                    <span className="farm-text-body font-semibold">
                      {reportData.pestDisease.totalIncidents}
                    </span>
                  </div>
                  <div className="flex-between py-2">
                    <span className="farm-text-muted">Pest Issues</span>
                    <span className="farm-text-body font-semibold">
                      {reportData.pestDisease.pestCount}
                    </span>
                  </div>
                  <div className="flex-between py-2">
                    <span className="farm-text-muted">Disease Issues</span>
                    <span className="farm-text-body font-semibold">
                      {reportData.pestDisease.diseaseCount}
                    </span>
                  </div>
                </div>
              </FarmCardContent>
            </FarmCard>
          </>
        )}
      </div>
    </div>
  );
}
