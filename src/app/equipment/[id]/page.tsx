"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import {
  PageContainer,
  FarmCard,
  FarmCardHeader,
  FarmCardContent,
  FarmButton,
  FarmBadge,
  LoadingState,
  ErrorState,
} from "@/components/ui/farm-theme";
import DeleteConfirmationDialog from "@/components/ui/delete-confirmation-dialog";
import {
  Wrench,
  ArrowLeft,
  Edit,
  Calendar,
  Gauge,
  Fuel,
  AlertTriangle,
  Clock,
  Plus,
  Trash2,
  Activity,
  Zap,
} from "lucide-react";
import {
  MaintenanceLogModal,
  FuelLogModal,
  HoursUpdateModal,
} from "@/components/ui/equipment-quick-action-modals";

interface Equipment {
  id: string;
  name: string;
  equipmentType: string;
  category: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  yearManufactured?: number;
  purchaseDate?: string;
  purchasePrice?: number;
  currentValue?: number;
  status: string;
  condition: string;
  fuelType?: string;
  horsepower?: number;
  workingWidth?: number;
  weight?: number;
  hoursUsed: number;
  lastServiceDate?: string;
  nextServiceDue?: string;
  serviceInterval?: number;
  insuranceExpiry?: string;
  warrantyExpiry?: string;
  location?: string;
  dailyRate?: number;
  notes?: string;
  createdAt: string;
  maintenanceLogs?: MaintenanceLog[];
  fuelLogs?: FuelLog[];
  tillageOps?: TillageOperation[];
  _count?: {
    tillageOps: number;
    maintenanceLogs: number;
    fuelLogs: number;
  };
}

interface MaintenanceLog {
  id: string;
  maintenanceType: string;
  serviceDate: string;
  hoursAtService?: number;
  description: string;
  totalCost: number;
  servicedBy?: string;
  nextServiceDue?: string;
  notes?: string;
}

interface FuelLog {
  id: string;
  fuelDate: string;
  fuelType: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalCost: number;
  location?: string;
  supplier?: string;
}

interface TillageOperation {
  id: string;
  operationType: string;
  operationDate: string;
  completedAt?: string;
  status: string;
  depth: number;
  area?: number;
  areaUnit: string;
  cost: number;
  fuelUsed: number;
  soilConditions: string;
  notes?: string;
  field?: {
    id: string;
    name: string;
    area: number;
    unit: string;
  };
  crop?: {
    id: string;
    name: string;
    variety?: string;
    status: string;
  };
}

export default function EquipmentDetailPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const equipmentId = params.id as string;

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<
    "overview" | "maintenance" | "fuel" | "usage"
  >("overview");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [dependencies, setDependencies] = useState<any[]>([]);
  const [deleting, setDeleting] = useState(false);

  // Quick action modal states
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showHoursModal, setShowHoursModal] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push("/sign-in");
      return;
    }

    if (equipmentId) {
      fetchEquipment();
    }
  }, [user, isLoaded, router, equipmentId]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/land-preparation/equipment/${equipmentId}?includeDetails=true`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setError("Equipment not found");
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return;
      }

      const data = await response.json();

      if (data.success) {
        setEquipment(data.data);
      } else {
        setError(data.error || "Failed to fetch equipment");
      }
    } catch (err) {
      console.error("Equipment fetch error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch equipment"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <FarmBadge variant="success">Active</FarmBadge>;
      case "maintenance":
        return <FarmBadge variant="warning">Maintenance</FarmBadge>;
      case "repair":
        return <FarmBadge variant="error">Repair</FarmBadge>;
      case "retired":
        return <FarmBadge variant="neutral">Retired</FarmBadge>;
      default:
        return <FarmBadge variant="neutral">{status}</FarmBadge>;
    }
  };

  const getConditionBadge = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "excellent":
        return <FarmBadge variant="success">Excellent</FarmBadge>;
      case "good":
        return <FarmBadge variant="success">Good</FarmBadge>;
      case "fair":
        return <FarmBadge variant="warning">Fair</FarmBadge>;
      case "poor":
        return <FarmBadge variant="error">Poor</FarmBadge>;
      case "needs_repair":
        return <FarmBadge variant="error">Needs Repair</FarmBadge>;
      default:
        return <FarmBadge variant="neutral">{condition}</FarmBadge>;
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const isMaintenanceDue = (nextServiceDue?: string) => {
    if (!nextServiceDue) return false;
    const dueDate = new Date(nextServiceDue);
    const today = new Date();
    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilDue <= 30; // Due within 30 days
  };

  const isMaintenanceOverdue = (nextServiceDue?: string) => {
    if (!nextServiceDue) return false;
    const dueDate = new Date(nextServiceDue);
    const today = new Date();
    return dueDate < today;
  };

  const handleDeleteClick = async () => {
    if (!equipment) return;

    try {
      // Check dependencies first
      const response = await fetch(
        `/api/land-preparation/equipment/${equipmentId}/dependencies`
      );
      const data = await response.json();

      if (data.success) {
        setDependencies(data.data.dependencies || []);
        setShowDeleteDialog(true);
      } else {
        setError(data.error || "Failed to check dependencies");
      }
    } catch (err) {
      console.error("Error checking dependencies:", err);
      setError("Failed to check dependencies. Please try again.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!equipment) return;

    try {
      setDeleting(true);
      const response = await fetch(
        `/api/land-preparation/equipment/${equipmentId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.success) {
        router.push("/equipment");
      } else {
        setError(data.error || "Failed to delete equipment");
        setShowDeleteDialog(false);
      }
    } catch (err) {
      console.error("Equipment deletion error:", err);
      setError("Failed to delete equipment. Please try again.");
      setShowDeleteDialog(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setDependencies([]);
  };

  const handleQuickActionSuccess = () => {
    // Refresh equipment data when a quick action succeeds
    fetchEquipment();
  };

  if (!isLoaded || loading) {
    return <LoadingState message="Loading equipment details..." />;
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorState
          title="Equipment Loading Error"
          message={error}
          onRetry={fetchEquipment}
        />
      </PageContainer>
    );
  }

  if (!equipment) {
    return (
      <PageContainer>
        <ErrorState
          title="Equipment Not Found"
          message="The requested equipment could not be found."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Breadcrumb Navigation */}
      <div className="mb-4">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <FarmButton
            variant="ghost"
            size="sm"
            onClick={() => router.push("/equipment")}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            Equipment
          </FarmButton>
          <span>/</span>
          <span className="text-foreground font-medium">{equipment.name}</span>
        </nav>
      </div>

      <div className="farm-page-header">
        <div className="farm-page-title-section">
          <div className="farm-page-title-group">
            <div className="farm-page-icon bg-gradient-to-br from-warning to-warning/80">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div className="farm-page-title-text">
              <h1 className="farm-heading-display">{equipment.name}</h1>
              <p className="farm-text-muted mt-1">
                {equipment.brand} {equipment.model} • {equipment.equipmentType}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <FarmButton variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </FarmButton>
            <FarmButton
              variant="primary"
              onClick={() => router.push(`/equipment/${equipmentId}/edit`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </FarmButton>
          </div>
        </div>
      </div>

      {/* Maintenance Alerts */}
      {isMaintenanceOverdue(equipment.nextServiceDue) && (
        <FarmCard className="border-destructive/20 bg-destructive/5 mb-6">
          <FarmCardContent>
            <div className="flex items-center gap-3 p-4">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">
                  Maintenance Overdue
                </p>
                <p className="farm-text-caption">
                  Service was due on {formatDate(equipment.nextServiceDue)}
                </p>
              </div>
            </div>
          </FarmCardContent>
        </FarmCard>
      )}

      {isMaintenanceDue(equipment.nextServiceDue) &&
        !isMaintenanceOverdue(equipment.nextServiceDue) && (
          <FarmCard className="border-warning/20 bg-warning/5 mb-6">
            <FarmCardContent>
              <div className="flex items-center gap-3 p-4">
                <Clock className="w-5 h-5 text-warning" />
                <div>
                  <p className="font-medium text-warning">
                    Maintenance Due Soon
                  </p>
                  <p className="farm-text-caption">
                    Service due on {formatDate(equipment.nextServiceDue)}
                  </p>
                </div>
              </div>
            </FarmCardContent>
          </FarmCard>
        )}

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-border">
          <nav className="flex space-x-8" role="tablist">
            <button
              id="overview-tab"
              role="tab"
              aria-selected={activeTab === "overview"}
              aria-controls="overview-panel"
              onClick={() => setActiveTab("overview")}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") {
                  setActiveTab("maintenance");
                }
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                activeTab === "overview"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              Overview
            </button>
            <button
              id="maintenance-tab"
              role="tab"
              aria-selected={activeTab === "maintenance"}
              aria-controls="maintenance-panel"
              onClick={() => setActiveTab("maintenance")}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") {
                  setActiveTab("overview");
                } else if (e.key === "ArrowRight") {
                  setActiveTab("fuel");
                }
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                activeTab === "maintenance"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              Maintenance ({equipment.maintenanceLogs?.length || 0})
            </button>
            <button
              id="fuel-tab"
              role="tab"
              aria-selected={activeTab === "fuel"}
              aria-controls="fuel-panel"
              onClick={() => setActiveTab("fuel")}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") {
                  setActiveTab("maintenance");
                } else if (e.key === "ArrowRight") {
                  setActiveTab("usage");
                }
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                activeTab === "fuel"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              Fuel Logs ({equipment.fuelLogs?.length || 0})
            </button>
            <button
              id="usage-tab"
              role="tab"
              aria-selected={activeTab === "usage"}
              aria-controls="usage-panel"
              onClick={() => setActiveTab("usage")}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") {
                  setActiveTab("fuel");
                }
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                activeTab === "usage"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              Field Usage ({equipment._count?.tillageOps || 0})
            </button>
          </nav>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <FarmCard>
          <FarmCardHeader
            title="Quick Actions"
            badge={
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Zap className="w-3 h-3" />
                Fast Entry
              </div>
            }
          />
          <FarmCardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FarmButton
                variant="outline"
                className="h-auto p-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/20"
                onClick={() => setShowMaintenanceModal(true)}
                title="Log maintenance performed on this equipment"
              >
                <Wrench className="w-5 h-5 text-orange-500" />
                <span className="text-sm">Log Maintenance</span>
              </FarmButton>

              <FarmButton
                variant="outline"
                className="h-auto p-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/20"
                onClick={() => setShowFuelModal(true)}
                title="Record fuel usage for this equipment"
              >
                <Fuel className="w-5 h-5 text-blue-500" />
                <span className="text-sm">Record Fuel</span>
              </FarmButton>

              <FarmButton
                variant="outline"
                className="h-auto p-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/20"
                onClick={() => setShowHoursModal(true)}
                title="Update operating hours for this equipment"
              >
                <Clock className="w-5 h-5 text-green-500" />
                <span className="text-sm">Update Hours</span>
              </FarmButton>

              <FarmButton
                variant="outline"
                className="h-auto p-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/20"
                onClick={() => setActiveTab("maintenance")}
                title="View maintenance history and schedule"
              >
                <Calendar className="w-5 h-5 text-purple-500" />
                <span className="text-sm">Schedule Service</span>
              </FarmButton>
            </div>

            {/* Secondary Actions */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FarmButton
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => setActiveTab("maintenance")}
                >
                  <Wrench className="w-4 h-4 mr-2" />
                  View Maintenance
                </FarmButton>

                <FarmButton
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => setActiveTab("fuel")}
                >
                  <Gauge className="w-4 h-4 mr-2" />
                  Fuel History
                </FarmButton>

                <FarmButton
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => setActiveTab("usage")}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Field Usage
                </FarmButton>

                <FarmButton
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() =>
                    router.push(`/reports?equipment=${equipmentId}`)
                  }
                >
                  <Plus className="w-4 h-4 mr-2" />
                  View Reports
                </FarmButton>
              </div>
            </div>
          </FarmCardContent>
        </FarmCard>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div role="tabpanel" id="overview-panel" aria-labelledby="overview-tab">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Information */}
            <FarmCard>
              <FarmCardHeader title="Basic Information" />
              <FarmCardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="farm-text-muted">Status</span>
                    {getStatusBadge(equipment.status)}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="farm-text-muted">Condition</span>
                    {getConditionBadge(equipment.condition)}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="farm-text-muted">Category</span>
                    <span className="farm-text-body font-medium">
                      {equipment.category.replace("_", " ")}
                    </span>
                  </div>

                  {equipment.serialNumber && (
                    <div className="flex justify-between items-center">
                      <span className="farm-text-muted">Serial Number</span>
                      <span className="farm-text-body font-medium">
                        {equipment.serialNumber}
                      </span>
                    </div>
                  )}

                  {equipment.yearManufactured && (
                    <div className="flex justify-between items-center">
                      <span className="farm-text-muted">Year</span>
                      <span className="farm-text-body font-medium">
                        {equipment.yearManufactured}
                      </span>
                    </div>
                  )}

                  {equipment.location && (
                    <div className="flex justify-between items-center">
                      <span className="farm-text-muted">Location</span>
                      <span className="farm-text-body font-medium">
                        {equipment.location}
                      </span>
                    </div>
                  )}
                </div>
              </FarmCardContent>
            </FarmCard>

            {/* Usage & Performance */}
            <FarmCard>
              <FarmCardHeader title="Usage & Performance" />
              <FarmCardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-muted-foreground" />
                      <span className="farm-text-muted">Hours Used</span>
                    </div>
                    <span className="farm-text-body font-medium">
                      {equipment.hoursUsed.toLocaleString()}
                    </span>
                  </div>

                  {equipment.horsepower && (
                    <div className="flex justify-between items-center">
                      <span className="farm-text-muted">Horsepower</span>
                      <span className="farm-text-body font-medium">
                        {equipment.horsepower} HP
                      </span>
                    </div>
                  )}

                  {equipment.workingWidth && (
                    <div className="flex justify-between items-center">
                      <span className="farm-text-muted">Working Width</span>
                      <span className="farm-text-body font-medium">
                        {equipment.workingWidth} ft
                      </span>
                    </div>
                  )}

                  {equipment.weight && (
                    <div className="flex justify-between items-center">
                      <span className="farm-text-muted">Weight</span>
                      <span className="farm-text-body font-medium">
                        {equipment.weight.toLocaleString()} lbs
                      </span>
                    </div>
                  )}

                  {equipment.fuelType && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Fuel className="w-4 h-4 text-muted-foreground" />
                        <span className="farm-text-muted">Fuel Type</span>
                      </div>
                      <span className="farm-text-body font-medium">
                        {equipment.fuelType}
                      </span>
                    </div>
                  )}
                </div>
              </FarmCardContent>
            </FarmCard>

            {/* Financial Information */}
            <FarmCard>
              <FarmCardHeader title="Financial Information" />
              <FarmCardContent>
                <div className="space-y-3">
                  {equipment.purchasePrice && (
                    <div className="flex justify-between items-center">
                      <span className="farm-text-muted">Purchase Price</span>
                      <span className="farm-text-body font-medium">
                        {formatCurrency(equipment.purchasePrice)}
                      </span>
                    </div>
                  )}

                  {equipment.currentValue && (
                    <div className="flex justify-between items-center">
                      <span className="farm-text-muted">Current Value</span>
                      <span className="farm-text-body font-medium">
                        {formatCurrency(equipment.currentValue)}
                      </span>
                    </div>
                  )}

                  {equipment.dailyRate && (
                    <div className="flex justify-between items-center">
                      <span className="farm-text-muted">Daily Rate</span>
                      <span className="farm-text-body font-medium">
                        {formatCurrency(equipment.dailyRate)}/day
                      </span>
                    </div>
                  )}

                  {equipment.purchaseDate && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="farm-text-muted">Purchase Date</span>
                      </div>
                      <span className="farm-text-body font-medium">
                        {formatDate(equipment.purchaseDate)}
                      </span>
                    </div>
                  )}
                </div>
              </FarmCardContent>
            </FarmCard>

            {/* Maintenance Schedule */}
            <div className="lg:col-span-3">
              <FarmCard>
                <FarmCardHeader
                  title="Maintenance Schedule"
                  badge={
                    <FarmButton
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveTab("maintenance");
                        // TODO: Open maintenance logging modal
                        console.log(
                          "Log maintenance for equipment:",
                          equipmentId
                        );
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Log Maintenance
                    </FarmButton>
                  }
                />
                <FarmCardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="farm-text-muted">Last Service</span>
                      </div>
                      <p className="farm-text-body font-medium">
                        {formatDate(equipment.lastServiceDate)}
                      </p>
                    </div>

                    <div className="p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="farm-text-muted">
                          Next Service Due
                        </span>
                      </div>
                      <p
                        className={`farm-text-body font-medium ${
                          isMaintenanceOverdue(equipment.nextServiceDue)
                            ? "text-destructive"
                            : isMaintenanceDue(equipment.nextServiceDue)
                              ? "text-warning"
                              : ""
                        }`}
                      >
                        {formatDate(equipment.nextServiceDue)}
                      </p>
                    </div>

                    <div className="p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Gauge className="w-4 h-4 text-muted-foreground" />
                        <span className="farm-text-muted">
                          Service Interval
                        </span>
                      </div>
                      <p className="farm-text-body font-medium">
                        {equipment.serviceInterval
                          ? `${equipment.serviceInterval} hours`
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </FarmCardContent>
              </FarmCard>
            </div>

            {/* Notes */}
            {equipment.notes && (
              <div className="lg:col-span-3">
                <FarmCard>
                  <FarmCardHeader title="Notes" />
                  <FarmCardContent>
                    <p className="farm-text-body whitespace-pre-wrap">
                      {equipment.notes}
                    </p>
                  </FarmCardContent>
                </FarmCard>
              </div>
            )}

            {/* Delete Action */}
            <div className="lg:col-span-3">
              <FarmCard className="border-destructive/20">
                <FarmCardHeader title="Danger Zone" />
                <FarmCardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="farm-heading-card text-destructive">
                        Delete Equipment
                      </h4>
                      <p className="farm-text-muted">
                        Permanently delete this equipment and all associated
                        data. This action cannot be undone.
                      </p>
                    </div>
                    <FarmButton
                      variant="destructive"
                      onClick={handleDeleteClick}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Equipment
                    </FarmButton>
                  </div>
                </FarmCardContent>
              </FarmCard>
            </div>
          </div>
        </div>
      )}

      {activeTab === "maintenance" && (
        <div
          role="tabpanel"
          id="maintenance-panel"
          aria-labelledby="maintenance-tab"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="farm-heading-section">Maintenance History</h2>
            <FarmButton
              variant="primary"
              onClick={() => {
                // TODO: Open maintenance logging modal
                console.log("Log maintenance for equipment:", equipmentId);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Log Maintenance
            </FarmButton>
          </div>

          {!equipment.maintenanceLogs ||
          equipment.maintenanceLogs.length === 0 ? (
            <FarmCard>
              <FarmCardContent>
                <div className="text-center py-8">
                  <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="farm-heading-card mb-2">
                    No Maintenance Records
                  </h3>
                  <p className="farm-text-muted mb-4">
                    Start tracking maintenance to keep your equipment in top
                    condition.
                  </p>
                  <FarmButton
                    variant="primary"
                    onClick={() => {
                      // TODO: Open maintenance logging modal
                      console.log(
                        "Log first maintenance for equipment:",
                        equipmentId
                      );
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Log First Maintenance
                  </FarmButton>
                </div>
              </FarmCardContent>
            </FarmCard>
          ) : (
            <div className="space-y-4">
              {equipment.maintenanceLogs.map((log) => (
                <FarmCard key={log.id}>
                  <FarmCardContent>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-warning/10 rounded-full flex items-center justify-center">
                          <Wrench className="w-4 h-4 text-warning" />
                        </div>
                        <div>
                          <h4 className="farm-heading-card">
                            {log.maintenanceType.replace("_", " ")}
                          </h4>
                          <p className="farm-text-muted">
                            {formatDate(log.serviceDate)}
                            {log.hoursAtService &&
                              ` • ${log.hoursAtService} hours`}
                            {log.servicedBy && ` • ${log.servicedBy}`}
                          </p>
                          <p className="farm-text-body mt-2">
                            {log.description}
                          </p>
                          {log.notes && (
                            <p className="farm-text-muted mt-1">{log.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="farm-text-body font-medium">
                          {formatCurrency(log.totalCost)}
                        </p>
                        {log.nextServiceDue && (
                          <p className="farm-text-caption">
                            Next: {formatDate(log.nextServiceDue)}
                          </p>
                        )}
                      </div>
                    </div>
                  </FarmCardContent>
                </FarmCard>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "fuel" && (
        <div role="tabpanel" id="fuel-panel" aria-labelledby="fuel-tab">
          <div className="flex justify-between items-center mb-6">
            <h2 className="farm-heading-section">Fuel Usage History</h2>
            <FarmButton
              variant="primary"
              onClick={() => {
                // TODO: Open fuel logging modal
                console.log("Log fuel for equipment:", equipmentId);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Log Fuel Usage
            </FarmButton>
          </div>

          {!equipment.fuelLogs || equipment.fuelLogs.length === 0 ? (
            <FarmCard>
              <FarmCardContent>
                <div className="text-center py-8">
                  <Fuel className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="farm-heading-card mb-2">No Fuel Records</h3>
                  <p className="farm-text-muted mb-4">
                    Track fuel usage to monitor operating costs and efficiency.
                  </p>
                  <FarmButton
                    variant="primary"
                    onClick={() => {
                      // TODO: Open fuel logging modal
                      console.log(
                        "Log first fuel entry for equipment:",
                        equipmentId
                      );
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Log First Fuel Entry
                  </FarmButton>
                </div>
              </FarmCardContent>
            </FarmCard>
          ) : (
            <div className="space-y-4">
              {equipment.fuelLogs.map((log) => (
                <FarmCard key={log.id}>
                  <FarmCardContent>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-info/10 rounded-full flex items-center justify-center">
                          <Fuel className="w-4 h-4 text-info" />
                        </div>
                        <div>
                          <h4 className="farm-heading-card">
                            {log.quantity} {log.unit} of {log.fuelType}
                          </h4>
                          <p className="farm-text-muted">
                            {formatDate(log.fuelDate)}
                            {log.location && ` • ${log.location}`}
                            {log.supplier && ` • ${log.supplier}`}
                          </p>
                          <p className="farm-text-body mt-1">
                            {formatCurrency(log.pricePerUnit)} per {log.unit}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="farm-text-body font-medium">
                          {formatCurrency(log.totalCost)}
                        </p>
                      </div>
                    </div>
                  </FarmCardContent>
                </FarmCard>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "usage" && (
        <div role="tabpanel" id="usage-panel" aria-labelledby="usage-tab">
          <div className="flex justify-between items-center mb-6">
            <h2 className="farm-heading-section">Field Usage History</h2>
            <FarmButton
              variant="primary"
              onClick={() => router.push("/land-preparation/operations/create")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Log Operation
            </FarmButton>
          </div>

          {!equipment.tillageOps || equipment.tillageOps.length === 0 ? (
            <FarmCard>
              <FarmCardContent>
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="farm-heading-card mb-2">
                    No Field Operations
                  </h3>
                  <p className="farm-text-muted mb-4">
                    This equipment hasn't been used in any field operations yet.
                  </p>
                  <FarmButton
                    variant="primary"
                    onClick={() =>
                      router.push("/land-preparation/operations/create")
                    }
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Log First Operation
                  </FarmButton>
                </div>
              </FarmCardContent>
            </FarmCard>
          ) : (
            <div className="space-y-4">
              {equipment.tillageOps.map((operation) => (
                <FarmCard
                  key={operation.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <FarmCardContent>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Activity className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="farm-heading-card">
                                {operation.operationType.replace("_", " ")}{" "}
                                Operation
                              </h4>
                              <p className="farm-text-muted">
                                {formatDate(operation.operationDate)}
                                {operation.completedAt &&
                                  ` • Completed ${formatDate(operation.completedAt)}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {operation.status === "COMPLETED" ? (
                                <FarmBadge variant="success">
                                  Completed
                                </FarmBadge>
                              ) : operation.status === "IN_PROGRESS" ? (
                                <FarmBadge variant="warning">
                                  In Progress
                                </FarmBadge>
                              ) : (
                                <FarmBadge variant="neutral">Planned</FarmBadge>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                            {operation.field && (
                              <div>
                                <span className="farm-text-caption">Field</span>
                                <div className="flex items-center gap-1">
                                  <FarmButton
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      router.push(
                                        `/fields/${operation.field?.id}`
                                      )
                                    }
                                    className="text-primary hover:text-primary-hover p-0 h-auto font-medium"
                                  >
                                    {operation.field.name}
                                  </FarmButton>
                                </div>
                              </div>
                            )}

                            {operation.crop && (
                              <div>
                                <span className="farm-text-caption">Crop</span>
                                <div className="flex items-center gap-1">
                                  <FarmButton
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      router.push(
                                        `/crops/${operation.crop?.id}`
                                      )
                                    }
                                    className="text-primary hover:text-primary-hover p-0 h-auto font-medium"
                                  >
                                    {operation.crop.name}
                                    {operation.crop.variety &&
                                      ` (${operation.crop.variety})`}
                                  </FarmButton>
                                </div>
                              </div>
                            )}

                            <div>
                              <span className="farm-text-caption">Depth</span>
                              <p className="farm-text-body font-medium">
                                {operation.depth}"
                              </p>
                            </div>

                            {operation.area && (
                              <div>
                                <span className="farm-text-caption">Area</span>
                                <p className="farm-text-body font-medium">
                                  {operation.area} {operation.areaUnit}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
                            <div>
                              <span className="farm-text-caption">
                                Fuel Used
                              </span>
                              <p className="farm-text-body font-medium">
                                {operation.fuelUsed} gal
                              </p>
                            </div>

                            <div>
                              <span className="farm-text-caption">Cost</span>
                              <p className="farm-text-body font-medium">
                                {formatCurrency(operation.cost)}
                              </p>
                            </div>

                            <div>
                              <span className="farm-text-caption">
                                Soil Conditions
                              </span>
                              <p className="farm-text-body font-medium">
                                {operation.soilConditions}
                              </p>
                            </div>
                          </div>

                          {operation.notes && (
                            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                              <span className="farm-text-caption">Notes</span>
                              <p className="farm-text-body mt-1">
                                {operation.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </FarmCardContent>
                </FarmCard>
              ))}
            </div>
          )}
        </div>
      )}

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        entityName={equipment?.name || ""}
        entityType="Equipment"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        dependencies={dependencies}
        loading={deleting}
      />

      {/* Quick Action Modals */}
      {equipment && (
        <>
          <MaintenanceLogModal
            isOpen={showMaintenanceModal}
            onClose={() => setShowMaintenanceModal(false)}
            equipmentId={equipmentId}
            equipmentName={equipment.name}
            onSuccess={handleQuickActionSuccess}
          />

          <FuelLogModal
            isOpen={showFuelModal}
            onClose={() => setShowFuelModal(false)}
            equipmentId={equipmentId}
            equipmentName={equipment.name}
            onSuccess={handleQuickActionSuccess}
          />

          <HoursUpdateModal
            isOpen={showHoursModal}
            onClose={() => setShowHoursModal(false)}
            equipmentId={equipmentId}
            equipmentName={equipment.name}
            currentHours={equipment.hoursUsed}
            onSuccess={handleQuickActionSuccess}
          />
        </>
      )}
    </PageContainer>
  );
}
