"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  Plus,
  TrendingUp,
  DollarSign,
  MapPin,
  Users,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  RefreshCw,
} from "lucide-react";

interface PreSeasonPlan {
  id: string;
  planName: string;
  season: string;
  year: number;
  status: string;
  totalBudget: number;
  expectedRevenue: number;
  startDate: string;
  endDate: string;
  description?: string;
  createdAt: string;
  _count: {
    plannedCrops: number;
    rotationPlans: number;
    resourceAllocations: number;
    seasonalTasks: number;
  };
}

interface PlanningStats {
  totalPlans: number;
  draftPlans: number;
  activePlans: number;
  completedPlans: number;
  totalBudget: number;
  totalExpectedRevenue: number;
}

export default function PlanningDashboard() {
  const { user, isLoaded } = useUser();
  const [plans, setPlans] = useState<PreSeasonPlan[]>([]);
  const [stats, setStats] = useState<PlanningStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedYear) params.append("year", selectedYear.toString());
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);

      const response = await fetch(`/api/planning/pre-season?${params}`);
      if (!response.ok) throw new Error("Failed to fetch plans");

      const data = await response.json();
      setPlans(data.data.plans);
      setStats(data.data.stats);
      setError(null);
    } catch (error) {
      console.error("Error fetching plans:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch plans"
      );
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedStatus]);

  useEffect(() => {
    if (isLoaded && user) {
      fetchPlans();
    }
  }, [isLoaded, user, fetchPlans]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "ARCHIVED":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "APPROVED":
        return <Target className="w-4 h-4 text-green-600" />;
      case "IN_PROGRESS":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "DRAFT":
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i - 2);

  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading planning dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            Please sign in to access planning tools.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Pre-Season Planning
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Year Filter */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="ALL">All Plans</option>
            <option value="DRAFT">Draft</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="APPROVED">Approved</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <Button
            onClick={() => (window.location.href = "/planning/create")}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Plan
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Plans
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalPlans}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Active Plans
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.activePlans}
                  </p>
                </div>
                <Target className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Budget
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.totalBudget)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Expected Revenue
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.totalExpectedRevenue)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading your plans...</p>
          </CardContent>
        </Card>
      )}

      {/* Plans Grid */}
      {!loading && (
        <>
          {plans.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Plans Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Start by creating your first pre-season plan to organize your
                  farming activities.
                </p>
                <Button
                  onClick={() => (window.location.href = "/planning/create")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Plan
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {plan.planName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {plan.season} {plan.year}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(plan.status)}
                        <Badge className={getStatusColor(plan.status)}>
                          {plan.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Plan Details */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">
                          {formatDate(plan.startDate)} -{" "}
                          {formatDate(plan.endDate)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Budget:</span>
                        <span className="font-medium">
                          {formatCurrency(plan.totalBudget)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Expected Revenue:</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(plan.expectedRevenue)}
                        </span>
                      </div>

                      {plan.description && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Description
                          </p>
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {plan.description}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Planning Components */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center mb-1">
                          <MapPin className="w-4 h-4 text-green-500" />
                        </div>
                        <p className="text-lg font-semibold">
                          {plan._count.plannedCrops}
                        </p>
                        <p className="text-xs text-gray-600">Planned Crops</p>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center mb-1">
                          <Users className="w-4 h-4 text-blue-500" />
                        </div>
                        <p className="text-lg font-semibold">
                          {plan._count.seasonalTasks}
                        </p>
                        <p className="text-xs text-gray-600">Tasks</p>
                      </div>
                    </div>

                    {/* Additional Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span>{plan._count.rotationPlans} Rotations</span>
                      <span>{plan._count.resourceAllocations} Resources</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          (window.location.href = `/planning/${plan.id}`)
                        }
                      >
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          (window.location.href = `/planning/${plan.id}/edit`)
                        }
                      >
                        Edit
                      </Button>
                    </div>

                    {/* Creation Date */}
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-gray-500">
                        Created: {formatDate(plan.createdAt)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
