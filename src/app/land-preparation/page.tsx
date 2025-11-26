"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tractor,
  Plus,
  TrendingUp,
  DollarSign,
  Clock,
  AlertTriangle,
  Wrench,
  Fuel,
  Calendar,
  Target,
  Activity,
  CheckCircle,
  Settings,
  RefreshCw,
} from "lucide-react";

interface TillageOperation {
  id: string;
  operationType: string;
  operationDate: string;
  status: string;
  depth: number;
  speed: number;
  area?: number;
  cost: number;
  fuelUsed: number;
  effectiveness?: number;
  field?: {
    id: string;
    name: string;
  };
  equipmentUsed?: {
    id: string;
    name: string;
    equipmentType: string;
    condition: string;
  };
}

interface Equipment {
  id: string;
  name: string;
  equipmentType: string;
  category: string;
  status: string;
  condition: string;
  hoursUsed: number;
  lastServiceDate?: string;
  nextServiceDue?: string;
}

interface PreparationStats {
  totalOperations: number;
  completedOperations: number;
  plannedOperations: number;
  inProgressOperations: number;
  totalCost: number;
  totalFuelUsed: number;
  totalAreaCovered: number;
  avgEffectiveness: number;
  operationsByType: Record<string, number>;
  operationsByStatus: Record<string, number>;
}

interface EquipmentStats {
  totalEquipment: number;
  activeEquipment: number;
  maintenanceEquipment: number;
  totalValue: number;
  totalHours: number;
  maintenanceCosts: number;
  fuelCosts: number;
  equipmentByCategory: Record<string, number>;
}

interface MaintenanceAlert {
  equipmentId: string;
  equipmentName: string;
  alertType: string;
  dueDate?: string;
  hoursOverdue: number;
  lastServiceDate?: string;
}

export default function LandPreparationDashboard() {
  const { user, isLoaded } = useUser();
  const [operations, setOperations] = useState<TillageOperation[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [preparationStats, setPreparationStats] =
    useState<PreparationStats | null>(null);
  const [equipmentStats, setEquipmentStats] = useState<EquipmentStats | null>(
    null
  );
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<
    MaintenanceAlert[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"operations" | "equipment">(
    "operations"
  );

  useEffect(() => {
    if (isLoaded && user) {
      fetchData();
    }
  }, [isLoaded, user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch operations and equipment in parallel
      const [operationsResponse, equipmentResponse] = await Promise.all([
        fetch("/api/land-preparation/tillage-operations?includeStats=true"),
        fetch(
          "/api/land-preparation/equipment?includeStats=true&includeMaintenanceAlerts=true"
        ),
      ]);

      if (!operationsResponse.ok || !equipmentResponse.ok) {
        throw new Error("Failed to fetch data");
      }

      const operationsData = await operationsResponse.json();
      const equipmentData = await equipmentResponse.json();

      setOperations(operationsData.data.operations.slice(0, 10)); // Recent operations
      setPreparationStats(operationsData.data.stats);
      setEquipment(equipmentData.data.equipment);
      setEquipmentStats(equipmentData.data.stats);
      setMaintenanceAlerts(equipmentData.data.maintenanceAlerts || []);
      setError(null);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "PLANNED":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "DELAYED":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "EXCELLENT":
        return "bg-green-100 text-green-800";
      case "GOOD":
        return "bg-green-100 text-green-700";
      case "FAIR":
        return "bg-yellow-100 text-yellow-800";
      case "POOR":
        return "bg-orange-100 text-orange-800";
      case "NEEDS_REPAIR":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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

  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">
              Loading land preparation dashboard...
            </p>
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
            Please sign in to access land preparation tools.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-gray-800 overflow-auto">
      <div className="content-container py-4 sm:py-6 lg:py-8 mobile-header-spacing">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Tractor className="w-8 h-8 text-green-600 dark:text-green-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Land Preparation
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() =>
                (window.location.href = "/land-preparation/equipment")
              }
            >
              <Settings className="w-4 h-4 mr-2" />
              Manage Equipment
            </Button>
            <Button
              onClick={() =>
                (window.location.href = "/land-preparation/operations/create")
              }
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Log Operation
            </Button>
          </div>
        </div>

        {/* Maintenance Alerts */}
        {maintenanceAlerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Maintenance Alerts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {maintenanceAlerts.map((alert) => (
                <Alert
                  key={alert.equipmentId}
                  className="border-yellow-200 bg-yellow-50"
                >
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <AlertDescription>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-yellow-900">
                          {alert.equipmentName}
                        </p>
                        <p className="text-yellow-800 text-sm">
                          {alert.alertType === "OVERDUE"
                            ? "Maintenance Overdue"
                            : "Maintenance Due Soon"}
                        </p>
                        {alert.dueDate && (
                          <p className="text-xs text-yellow-600">
                            Due: {formatDate(alert.dueDate)}
                          </p>
                        )}
                      </div>
                      <Badge className="bg-yellow-200 text-yellow-800">
                        {alert.alertType}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Summary Statistics */}
        {(preparationStats || equipmentStats) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {preparationStats && (
              <>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Total Operations
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {preparationStats.totalOperations}
                        </p>
                      </div>
                      <Activity className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Completed
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          {preparationStats.completedOperations}
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Total Cost
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(preparationStats.totalCost)}
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
                          Area Covered
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {Math.round(preparationStats.totalAreaCovered)}
                        </p>
                        <p className="text-xs text-gray-500">acres</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 border-b mb-6">
          {[
            {
              id: "operations",
              label: "Recent Operations",
              icon: <Tractor className="w-4 h-4" />,
            },
            {
              id: "equipment",
              label: "Equipment Overview",
              icon: <Wrench className="w-4 h-4" />,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "operations" | "equipment")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? "bg-green-100 text-green-700 border-b-2 border-green-600"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="p-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading data...</p>
            </CardContent>
          </Card>
        )}

        {/* Recent Operations Tab */}
        {!loading && activeTab === "operations" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Recent Tillage Operations
                </h3>
                <Button
                  variant="outline"
                  onClick={() =>
                    (window.location.href = "/land-preparation/operations")
                  }
                >
                  View All Operations
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {operations.length === 0 ? (
                <div className="text-center py-12">
                  <Tractor className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Operations Yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Start by logging your first tillage operation to track field
                    preparation progress.
                  </p>
                  <Button
                    onClick={() =>
                      (window.location.href =
                        "/land-preparation/operations/create")
                    }
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Log First Operation
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {operations.map((operation) => (
                    <div
                      key={operation.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Tractor className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {operation.operationType}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {operation.field?.name} •{" "}
                              {formatDate(operation.operationDate)}
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(operation.status)}>
                          {operation.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Depth</p>
                          <p className="font-medium">{operation.depth}&quot;</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Speed</p>
                          <p className="font-medium">{operation.speed} mph</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Area</p>
                          <p className="font-medium">
                            {operation.area || "N/A"} acres
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Cost</p>
                          <p className="font-medium">
                            {formatCurrency(operation.cost)}
                          </p>
                        </div>
                      </div>

                      {operation.equipmentUsed && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Wrench className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">
                                {operation.equipmentUsed.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Fuel className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-600">
                                  {operation.fuelUsed} gal
                                </span>
                              </div>
                              {operation.effectiveness && (
                                <div className="flex items-center gap-1">
                                  <Target className="w-4 h-4 text-gray-500" />
                                  <span className="text-gray-600">
                                    {operation.effectiveness}/10
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Equipment Overview Tab */}
        {!loading && activeTab === "equipment" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Equipment Overview</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      (window.location.href = "/land-preparation/equipment")
                    }
                  >
                    Manage Equipment
                  </Button>
                  <Button
                    onClick={() =>
                      (window.location.href = "/land-preparation/equipment/add")
                    }
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Equipment
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {equipment.length === 0 ? (
                <div className="text-center py-12">
                  <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Equipment Registered
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Add your farm equipment to track usage, maintenance, and
                    costs.
                  </p>
                  <Button
                    onClick={() =>
                      (window.location.href = "/land-preparation/equipment/add")
                    }
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Equipment
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {equipment.slice(0, 9).map((eq) => (
                    <div
                      key={eq.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {eq.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {eq.equipmentType}
                          </p>
                        </div>
                        <Badge className={getConditionColor(eq.condition)}>
                          {eq.condition}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Category:</span>
                          <span>{eq.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Hours Used:</span>
                          <span>{eq.hoursUsed.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <Badge variant="outline" className="text-xs">
                            {eq.status}
                          </Badge>
                        </div>
                      </div>

                      {eq.nextServiceDue && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Next Service:</span>
                            <span className="text-yellow-600">
                              {formatDate(eq.nextServiceDue)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Equipment Stats */}
        {equipmentStats && equipment.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Equipment Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Value
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(equipmentStats!.totalValue)}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Hours
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {equipmentStats!.totalHours.toLocaleString()}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Maintenance Costs
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(equipmentStats!.maintenanceCosts)}
                      </p>
                    </div>
                    <Wrench className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Fuel Costs
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(equipmentStats!.fuelCosts)}
                      </p>
                    </div>
                    <Fuel className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
