"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
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
  ArrowLeft,
  Edit,
  MapPin,
  TrendingUp,
  Wheat,
  DollarSign,
  Activity,
  Trash2,
  Map,
  Sprout,
  TestTube,
  Calendar,
  Droplets,
  Plus,
  Eye,
  FileText,
  Navigation,
  Layers,
  BarChart3,
  Zap,
  CloudRain,
} from "lucide-react";
import {
  AddCropModal,
  SoilTestModal,
  FieldTreatmentModal,
  WeatherRefreshModal,
} from "@/components/ui/field-quick-action-modals";

interface FieldDetail {
  id: string;
  name: string;
  description?: string;
  area: number;
  unit: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  soilType?: string;
  drainageType?: string;
  irrigationType?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  crops?: Crop[];
  soilTests?: SoilTest[];
  soilAmendments?: SoilAmendment[];
  tillageOps?: TillageOperation[];
  costEntries?: CostEntry[];
  _count?: {
    crops: number;
    soilTests: number;
    soilAmendments: number;
    tillageOps: number;
    costEntries: number;
  };
  analytics?: {
    fieldAnalytics: unknown;
    currentSeasonCrops: Crop[];
    costSummary: unknown[];
    soilHealthTrend: SoilHealthPoint[];
    utilizationRate: number;
  };
}

interface Crop {
  id: string;
  name: string;
  variety?: string;
  status: string;
  plantingDate: string;
  expectedHarvestDate: string;
  actualHarvestDate?: string;
  area?: number;
  createdAt: string;
}

interface SoilTest {
  id: string;
  sampleDate: string;
  pH: number;
  organicMatter: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  testType: string;
  labName: string;
  recommendations?: string;
}

interface SoilAmendment {
  id: string;
  amendmentType: string;
  applicationDate: string;
  rate: number;
  unit: string;
  cost: number;
  method: string;
}

interface TillageOperation {
  id: string;
  operationType: string;
  operationDate: string;
  depth: number;
  equipment: string;
  operator?: string;
  cost: number;
}

interface CostEntry {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: { name: string };
  supplier?: { name: string };
}

interface SoilHealthPoint {
  date: string;
  pH: number;
  organicMatter: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
}

export default function FieldDetailPage() {
  const { user, isLoaded } = useUser();
  const params = useParams();
  const router = useRouter();
  const fieldId = params.id as string;

  const [field, setField] = useState<FieldDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<
    "overview" | "crops" | "soil" | "history"
  >("overview");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [dependencies, setDependencies] = useState<unknown[]>([]);
  const [deleting, setDeleting] = useState(false);

  // Quick action modal states
  const [showAddCropModal, setShowAddCropModal] = useState(false);
  const [showSoilTestModal, setShowSoilTestModal] = useState(false);
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [showWeatherModal, setShowWeatherModal] = useState(false);

  const fetchField = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/fields/${fieldId}?includeDetails=true`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setError("Field not found");
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return;
      }

      const data = await response.json();

      if (data.success !== false) {
        setField(data);
      } else {
        setError(data.error || "Failed to fetch field details");
      }
    } catch (err) {
      console.error("Field fetch error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch field details"
      );
    } finally {
      setLoading(false);
    }
  }, [fieldId]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push("/sign-in");
      return;
    }

    if (fieldId) {
      fetchField();
    }
  }, [user, isLoaded, router, fieldId, fetchField]);

  const getStatusBadge = (status: string) => {
    return status === "ACTIVE" ? (
      <FarmBadge variant="success">Active</FarmBadge>
    ) : (
      <FarmBadge variant="neutral">Inactive</FarmBadge>
    );
  };

  const getCropStatusBadge = (status: string) => {
    switch (status) {
      case "PLANTED":
        return <FarmBadge variant="info">Planted</FarmBadge>;
      case "GROWING":
        return <FarmBadge variant="success">Growing</FarmBadge>;
      case "FLOWERING":
        return <FarmBadge variant="warning">Flowering</FarmBadge>;
      case "FRUITING":
        return <FarmBadge variant="warning">Fruiting</FarmBadge>;
      case "HARVESTED":
        return <FarmBadge variant="success">Harvested</FarmBadge>;
      case "COMPLETED":
        return <FarmBadge variant="neutral">Completed</FarmBadge>;
      default:
        return <FarmBadge variant="neutral">{status}</FarmBadge>;
    }
  };

  const handleDeleteClick = async () => {
    if (!field) return;

    try {
      // Check dependencies first
      const response = await fetch(`/api/fields/${fieldId}/dependencies`);
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
    if (!field) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/fields/${fieldId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        router.push("/fields");
      } else {
        setError(data.error || "Failed to delete field");
        setShowDeleteDialog(false);
      }
    } catch (err) {
      console.error("Field deletion error:", err);
      setError("Failed to delete field. Please try again.");
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
    // Refresh field data when a quick action succeeds
    fetchField();
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const formatArea = (area: number, unit: string) => {
    return `${area.toLocaleString()} ${unit.replace("_", " ")}`;
  };

  // Calculate derived data
  const activeCrops =
    field?.crops?.filter(
      (crop) => crop.status !== "COMPLETED" && crop.status !== "HARVESTED"
    ) || [];

  const totalCosts =
    field?.costEntries?.reduce((sum, entry) => sum + entry.amount, 0) || 0;

  if (!isLoaded || loading) {
    return <LoadingState message="Loading field details..." />;
  }

  if (error && !field) {
    return (
      <PageContainer>
        <ErrorState
          title="Field Loading Error"
          message={error}
          onRetry={fetchField}
        />
      </PageContainer>
    );
  }

  if (!field) {
    return (
      <PageContainer>
        <ErrorState
          title="Field Not Found"
          message="The requested field could not be found."
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
            onClick={() => router.push("/fields")}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            Fields
          </FarmButton>
          <span>/</span>
          <span className="text-foreground font-medium">{field.name}</span>
        </nav>
      </div>

      <div className="farm-page-header">
        <div className="farm-page-title-section">
          <div className="farm-page-title-group">
            <div className="farm-page-icon bg-gradient-to-br from-primary to-primary-hover">
              <Map className="w-6 h-6 text-white" />
            </div>
            <div className="farm-page-title-text">
              <h1 className="farm-heading-display">{field.name}</h1>
              <p className="farm-text-muted mt-1">
                {formatArea(field.area, field.unit)} • {activeCrops.length}{" "}
                active crops •{" "}
                {getStatusBadge(field.isActive ? "ACTIVE" : "INACTIVE")}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <FarmButton
              variant="outline"
              onClick={() => router.push("/fields")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Fields
            </FarmButton>
            <FarmButton
              variant="primary"
              onClick={() => router.push(`/fields/${fieldId}/edit`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </FarmButton>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-border">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "overview"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("crops")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "crops"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              Crops ({field.crops?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("soil")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "soil"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              Soil Data ({field.soilTests?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "history"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              Field History
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Field Summary Stats */}
          <FarmCard>
            <FarmCardHeader title="Field Statistics" />
            <FarmCardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-muted-foreground" />
                    <span className="farm-text-muted">Total Area</span>
                  </div>
                  <span className="farm-text-body font-medium">
                    {formatArea(field.area, field.unit)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Sprout className="w-4 h-4 text-muted-foreground" />
                    <span className="farm-text-muted">Active Crops</span>
                  </div>
                  <span className="farm-text-body font-medium">
                    {activeCrops.length}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="farm-text-muted">Total Costs</span>
                  </div>
                  <span className="farm-text-body font-medium">
                    {formatCurrency(totalCosts)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <span className="farm-text-muted">Operations</span>
                  </div>
                  <span className="farm-text-body font-medium">
                    {(field._count?.tillageOps || 0) +
                      (field._count?.crops || 0)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="farm-text-muted">Status</span>
                  {getStatusBadge(field.isActive ? "ACTIVE" : "INACTIVE")}
                </div>
              </div>
            </FarmCardContent>
          </FarmCard>

          {/* Field Information */}
          <FarmCard>
            <FarmCardHeader title="Field Details" />
            <FarmCardContent>
              <div className="space-y-3">
                {field.description && (
                  <div>
                    <span className="farm-text-muted">Description</span>
                    <p className="farm-text-body mt-1">{field.description}</p>
                  </div>
                )}

                {field.soilType && (
                  <div className="flex justify-between items-center">
                    <span className="farm-text-muted">Soil Type</span>
                    <span className="farm-text-body font-medium">
                      {field.soilType.replace("_", " ")}
                    </span>
                  </div>
                )}

                {field.drainageType && (
                  <div className="flex justify-between items-center">
                    <span className="farm-text-muted">Drainage</span>
                    <span className="farm-text-body font-medium">
                      {field.drainageType.replace("_", " ")}
                    </span>
                  </div>
                )}

                {field.irrigationType && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-muted-foreground" />
                      <span className="farm-text-muted">Irrigation</span>
                    </div>
                    <span className="farm-text-body font-medium">
                      {field.irrigationType.replace("_", " ")}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="farm-text-muted">Created</span>
                  </div>
                  <span className="farm-text-body font-medium">
                    {formatDate(field.createdAt)}
                  </span>
                </div>
              </div>
            </FarmCardContent>
          </FarmCard>

          {/* Location Information */}
          <FarmCard>
            <FarmCardHeader title="Location" />
            <FarmCardContent>
              <div className="space-y-3">
                {field.address && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="farm-text-muted">Address</span>
                    </div>
                    <p className="farm-text-body">{field.address}</p>
                  </div>
                )}

                {field.latitude && (
                  <div className="flex justify-between items-center">
                    <span className="farm-text-muted">Latitude</span>
                    <span className="farm-text-body font-medium">
                      {field.latitude}°
                    </span>
                  </div>
                )}

                {field.longitude && (
                  <div className="flex justify-between items-center">
                    <span className="farm-text-muted">Longitude</span>
                    <span className="farm-text-body font-medium">
                      {field.longitude}°
                    </span>
                  </div>
                )}

                {field.latitude && field.longitude && (
                  <div className="pt-3 border-t border-border">
                    <FarmButton
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        const url = `https://www.google.com/maps?q=${field.latitude},${field.longitude}`;
                        window.open(url, "_blank");
                      }}
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      View on Map
                    </FarmButton>
                  </div>
                )}

                {!field.address && !field.latitude && !field.longitude && (
                  <div className="text-center py-4">
                    <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="farm-text-muted">
                      No location data available
                    </p>
                  </div>
                )}
              </div>
            </FarmCardContent>
          </FarmCard>

          {/* Quick Actions */}
          <div className="lg:col-span-3">
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
                    onClick={() => setShowAddCropModal(true)}
                  >
                    <Sprout className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Add Crop</span>
                  </FarmButton>

                  <FarmButton
                    variant="outline"
                    className="h-auto p-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/20"
                    onClick={() => setShowSoilTestModal(true)}
                  >
                    <TestTube className="w-5 h-5 text-blue-500" />
                    <span className="text-sm">Soil Test</span>
                  </FarmButton>

                  <FarmButton
                    variant="outline"
                    className="h-auto p-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/20"
                    onClick={() => setShowTreatmentModal(true)}
                  >
                    <Droplets className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Schedule Treatment</span>
                  </FarmButton>

                  <FarmButton
                    variant="outline"
                    className="h-auto p-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/20"
                    onClick={() => setShowWeatherModal(true)}
                  >
                    <CloudRain className="w-5 h-5 text-blue-600" />
                    <span className="text-sm">Weather Data</span>
                  </FarmButton>
                </div>

                {/* Secondary Actions */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FarmButton
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => setActiveTab("crops")}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Crops
                    </FarmButton>

                    <FarmButton
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => setActiveTab("soil")}
                    >
                      <TestTube className="w-4 h-4 mr-2" />
                      Soil Data
                    </FarmButton>

                    <FarmButton
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => setActiveTab("history")}
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      Field History
                    </FarmButton>

                    <FarmButton
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => router.push(`/reports?field=${fieldId}`)}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Reports
                    </FarmButton>
                  </div>
                </div>
              </FarmCardContent>
            </FarmCard>
          </div>

          {/* Delete Action */}
          <div className="lg:col-span-3">
            <FarmCard className="border-destructive/20">
              <FarmCardHeader title="Danger Zone" />
              <FarmCardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="farm-heading-card text-destructive">
                      Delete Field
                    </h4>
                    <p className="farm-text-muted">
                      Permanently delete this field and all associated data.
                      This action cannot be undone.
                    </p>
                  </div>
                  <FarmButton variant="destructive" onClick={handleDeleteClick}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Field
                  </FarmButton>
                </div>
              </FarmCardContent>
            </FarmCard>
          </div>
        </div>
      )}

      {activeTab === "crops" && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="farm-heading-section">Field Crops</h2>
            <FarmButton
              variant="primary"
              onClick={() => router.push(`/crops/add?field=${fieldId}`)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Crop
            </FarmButton>
          </div>

          {!field.crops || field.crops.length === 0 ? (
            <FarmCard>
              <FarmCardContent>
                <div className="text-center py-8">
                  <Sprout className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="farm-heading-card mb-2">No Crops Yet</h3>
                  <p className="farm-text-muted mb-4">
                    Start by adding crops to track their growth and progress.
                  </p>
                  <FarmButton
                    variant="primary"
                    onClick={() => router.push(`/crops/add?field=${fieldId}`)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Crop
                  </FarmButton>
                </div>
              </FarmCardContent>
            </FarmCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {field.crops.map((crop) => (
                <FarmCard
                  key={crop.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                >
                  <FarmCardContent>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="farm-heading-card">{crop.name}</h4>
                          {crop.variety && (
                            <p className="farm-text-muted">{crop.variety}</p>
                          )}
                        </div>
                        {getCropStatusBadge(crop.status)}
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="farm-text-muted">Planted</span>
                          <span className="farm-text-body">
                            {formatDate(crop.plantingDate)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="farm-text-muted">
                            Expected Harvest
                          </span>
                          <span className="farm-text-body">
                            {formatDate(crop.expectedHarvestDate)}
                          </span>
                        </div>

                        {crop.area && (
                          <div className="flex justify-between items-center">
                            <span className="farm-text-muted">Area</span>
                            <span className="farm-text-body">
                              {crop.area} m²
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-border">
                        <FarmButton
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => router.push(`/crops/${crop.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </FarmButton>
                      </div>
                    </div>
                  </FarmCardContent>
                </FarmCard>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "soil" && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="farm-heading-section">Soil Data</h2>
            <FarmButton
              variant="primary"
              onClick={() => router.push(`/soil-tests/add?field=${fieldId}`)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Soil Test
            </FarmButton>
          </div>

          {!field.soilTests || field.soilTests.length === 0 ? (
            <FarmCard>
              <FarmCardContent>
                <div className="text-center py-8">
                  <TestTube className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="farm-heading-card mb-2">No Soil Tests</h3>
                  <p className="farm-text-muted mb-4">
                    Track soil health with regular testing to optimize crop
                    growth.
                  </p>
                  <FarmButton
                    variant="primary"
                    onClick={() =>
                      router.push(`/soil-tests/add?field=${fieldId}`)
                    }
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Test
                  </FarmButton>
                </div>
              </FarmCardContent>
            </FarmCard>
          ) : (
            <div className="space-y-4">
              {field.soilTests.map((test) => (
                <FarmCard key={test.id}>
                  <FarmCardContent>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <TestTube className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="farm-heading-card">
                            {test.testType.replace("_", " ")} Test
                          </h4>
                          <p className="farm-text-muted">
                            {formatDate(test.sampleDate)} • {test.labName}
                          </p>

                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3">
                            <div>
                              <span className="farm-text-caption">pH</span>
                              <p className="farm-text-body font-medium">
                                {test.pH}
                              </p>
                            </div>
                            <div>
                              <span className="farm-text-caption">
                                Organic Matter
                              </span>
                              <p className="farm-text-body font-medium">
                                {test.organicMatter}%
                              </p>
                            </div>
                            <div>
                              <span className="farm-text-caption">
                                Nitrogen
                              </span>
                              <p className="farm-text-body font-medium">
                                {test.nitrogen} ppm
                              </p>
                            </div>
                            <div>
                              <span className="farm-text-caption">
                                Phosphorus
                              </span>
                              <p className="farm-text-body font-medium">
                                {test.phosphorus} ppm
                              </p>
                            </div>
                            <div>
                              <span className="farm-text-caption">
                                Potassium
                              </span>
                              <p className="farm-text-body font-medium">
                                {test.potassium} ppm
                              </p>
                            </div>
                          </div>

                          {test.recommendations && (
                            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                              <span className="farm-text-caption">
                                Recommendations
                              </span>
                              <p className="farm-text-body mt-1">
                                {test.recommendations}
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

      {activeTab === "history" && (
        <div>
          <h2 className="farm-heading-section mb-6">Field History</h2>

          <div className="space-y-6">
            {/* Tillage Operations */}
            <FarmCard>
              <FarmCardHeader
                title="Tillage Operations"
                badge={
                  <FarmButton variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Log Operation
                  </FarmButton>
                }
              />
              <FarmCardContent>
                {!field.tillageOps || field.tillageOps.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="farm-heading-card mb-2">
                      No Operations Logged
                    </h3>
                    <p className="farm-text-muted">
                      Start tracking field operations to maintain detailed
                      records.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {field.tillageOps.slice(0, 5).map((op) => (
                      <div
                        key={op.id}
                        className="flex items-center justify-between py-2 border-b border-border last:border-0"
                      >
                        <div>
                          <p className="farm-text-body font-medium">
                            {op.operationType.replace("_", " ")}
                          </p>
                          <p className="farm-text-muted">
                            {op.equipment} • {op.depth}" depth
                            {op.operator && ` • ${op.operator}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="farm-text-body">
                            {formatDate(op.operationDate)}
                          </p>
                          <p className="farm-text-muted">
                            {formatCurrency(op.cost)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </FarmCardContent>
            </FarmCard>

            {/* Cost Summary */}
            <FarmCard>
              <FarmCardHeader title="Cost Summary" />
              <FarmCardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="farm-text-muted">Total Costs</span>
                    </div>
                    <p className="farm-text-body font-medium text-lg">
                      {formatCurrency(totalCosts)}
                    </p>
                  </div>

                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-4 h-4 text-muted-foreground" />
                      <span className="farm-text-muted">Cost Entries</span>
                    </div>
                    <p className="farm-text-body font-medium text-lg">
                      {field._count?.costEntries || 0}
                    </p>
                  </div>

                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <span className="farm-text-muted">Avg per Operation</span>
                    </div>
                    <p className="farm-text-body font-medium text-lg">
                      {formatCurrency(
                        field._count?.costEntries
                          ? totalCosts / field._count.costEntries
                          : 0
                      )}
                    </p>
                  </div>
                </div>
              </FarmCardContent>
            </FarmCard>
          </div>
        </div>
      )}

      {error && (
        <FarmCard className="border-destructive/20 bg-destructive/5 mt-6">
          <FarmCardContent>
            <div className="flex items-center gap-3 p-4">
              <span className="text-destructive text-lg">⚠️</span>
              <span className="text-destructive font-medium">{error}</span>
            </div>
          </FarmCardContent>
        </FarmCard>
      )}

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        entityName={field?.name || ""}
        entityType="Field"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        dependencies={dependencies as any}
        loading={deleting}
      />

      {/* Quick Action Modals */}
      {field && (
        <>
          <AddCropModal
            isOpen={showAddCropModal}
            onClose={() => setShowAddCropModal(false)}
            fieldId={fieldId}
            fieldName={field.name}
            onSuccess={handleQuickActionSuccess}
          />

          <SoilTestModal
            isOpen={showSoilTestModal}
            onClose={() => setShowSoilTestModal(false)}
            fieldId={fieldId}
            fieldName={field.name}
            onSuccess={handleQuickActionSuccess}
          />

          <FieldTreatmentModal
            isOpen={showTreatmentModal}
            onClose={() => setShowTreatmentModal(false)}
            fieldId={fieldId}
            fieldName={field.name}
            onSuccess={handleQuickActionSuccess}
          />

          <WeatherRefreshModal
            isOpen={showWeatherModal}
            onClose={() => setShowWeatherModal(false)}
            fieldId={fieldId}
            fieldName={field.name}
            latitude={field.latitude}
            longitude={field.longitude}
            onSuccess={handleQuickActionSuccess}
          />
        </>
      )}
    </PageContainer>
  );
}
