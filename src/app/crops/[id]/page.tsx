"use client";

import { useState, useEffect, useCallback } from "react";
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
import ActivityTimeline from "@/components/ui/activity-timeline";
import { useActivities } from "@/hooks/use-activities";
import { useDetailPageCrud } from "@/hooks/use-detail-page-error";
import { DetailPageErrorBoundary } from "@/components/ui/error-boundary";
import {
  DetailPageErrorDisplay,
  InlineDetailPageError,
} from "@/components/ui/detail-page-error-display";
import { cropApi } from "@/lib/api-client";
import {
  Sprout,
  ArrowLeft,
  Edit,
  Calendar,
  MapPin,
  TrendingUp,
  Droplets,
  Bug,
  Scissors,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Trash2,
  Plus,
  Eye,
  FileText,
  Zap,
} from "lucide-react";
import {
  TreatmentModal,
  StatusUpdateModal,
  IrrigationModal,
  FertilizerModal,
} from "@/components/ui/quick-action-modals";
import { Crop, CropStatus, Field, EntityType } from "@/types";

interface CropDetail extends Crop {
  field?: Field;
  tasks?: any[];
  irrigationLogs?: any[];
  fertilizerLogs?: any[];
  pestDiseaseLogs?: any[];
  harvestLogs?: any[];
}

export default function CropDetailPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const cropId = params.id as string;

  const [crop, setCrop] = useState<CropDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "timeline" | "activities"
  >("overview");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [dependencies, setDependencies] = useState<any[]>([]);

  // Quick action modal states
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showIrrigationModal, setShowIrrigationModal] = useState(false);
  const [showFertilizerModal, setShowFertilizerModal] = useState(false);

  // Enhanced error handling for detail page
  const {
    error,
    isError,
    handleAsyncError,
    clearError,
    updateEntity,
    deleteEntity,
    isUpdating,
    isDeleting,
    canRetry,
    retry,
  } = useDetailPageCrud({
    entityType: "crop",
    entityId: cropId,
    onSuccess: (data, operation) => {
      if (operation === "update") {
        setCrop(data);
        refetchActivities();
      }
    },
    onDelete: () => {
      router.push("/crops");
    },
  });

  // Fetch activities for this crop
  const {
    activities,
    error: activitiesError,
    refetch: refetchActivities,
  } = useActivities({
    entityType: EntityType.CROP,
    entityId: cropId,
    limit: 20,
  });

  const fetchCrop = useCallback(async () => {
    return handleAsyncError(async () => {
      setLoading(true);
      const data = await cropApi.getCrop(cropId);
      setCrop(data.data || data);
      return data;
    }, "fetch-crop");
  }, [cropId, handleAsyncError]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push("/sign-in");
      return;
    }

    if (cropId) {
      fetchCrop();
    }
  }, [user, isLoaded, router, cropId, fetchCrop]);

  const getStatusBadge = (status: CropStatus) => {
    switch (status) {
      case CropStatus.PLANTED:
        return <FarmBadge variant="info">Planted</FarmBadge>;
      case CropStatus.GROWING:
        return <FarmBadge variant="success">Growing</FarmBadge>;
      case CropStatus.FLOWERING:
        return <FarmBadge variant="warning">Flowering</FarmBadge>;
      case CropStatus.FRUITING:
        return <FarmBadge variant="warning">Fruiting</FarmBadge>;
      case CropStatus.HARVESTED:
        return <FarmBadge variant="success">Harvested</FarmBadge>;
      case CropStatus.COMPLETED:
        return <FarmBadge variant="neutral">Completed</FarmBadge>;
      default:
        return <FarmBadge variant="neutral">{status}</FarmBadge>;
    }
  };

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysToHarvest = (expectedHarvestDate: string | Date) => {
    const today = new Date();
    const harvestDate = new Date(expectedHarvestDate);
    const diffTime = harvestDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDaysSincePlanting = (plantingDate: string | Date) => {
    const today = new Date();
    const planted = new Date(plantingDate);
    const diffTime = today.getTime() - planted.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleDeleteClick = async () => {
    if (!crop) return;

    try {
      // Check dependencies first
      const data = await cropApi.getCropDependencies(cropId);
      setDependencies(data.dependencies || []);
      setShowDeleteDialog(true);
    } catch (err) {
      handleAsyncError(async () => {
        throw err;
      }, "check-dependencies");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!crop) return;

    try {
      await deleteEntity();
      setShowDeleteDialog(false);
    } catch (err) {
      // Error is already handled by useDetailPageCrud
      setShowDeleteDialog(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setDependencies([]);
  };

  const handleQuickActionSuccess = () => {
    // Refresh crop data and activities when a quick action succeeds
    fetchCrop();
    refetchActivities();
  };

  if (!isLoaded || loading) {
    return <LoadingState message="Loading crop details..." />;
  }

  if (isError && !crop) {
    return (
      <DetailPageErrorBoundary>
        <DetailPageErrorDisplay
          error={error!}
          entityType="crop"
          entityId={cropId}
          onRetry={canRetry ? retry : fetchCrop}
          showRetry={true}
          showNavigation={true}
        />
      </DetailPageErrorBoundary>
    );
  }

  if (!crop) {
    return (
      <PageContainer>
        <ErrorState
          title="Crop Not Found"
          message="The requested crop could not be found."
        />
      </PageContainer>
    );
  }

  const daysToHarvest = getDaysToHarvest(crop.expectedHarvestDate);
  const daysSincePlanting = getDaysSincePlanting(crop.plantingDate);
  const isOverdue = daysToHarvest < 0 && !crop.actualHarvestDate;

  return (
    <PageContainer>
      {/* Breadcrumb Navigation */}
      {crop.field && (
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
            <FarmButton
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/fields/${crop.field?.id}`)}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              {crop.field.name}
            </FarmButton>
            <span>/</span>
            <span className="text-foreground font-medium">Crops</span>
            <span>/</span>
            <span className="text-foreground font-medium">{crop.name}</span>
          </nav>
        </div>
      )}

      <div className="farm-page-header">
        <div className="farm-page-title-section">
          <div className="farm-page-title-group">
            <div className="farm-page-icon bg-gradient-to-br from-success to-success/80">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div className="farm-page-title-text">
              <h1 className="farm-heading-display">
                {crop.name}
                {crop.variety && (
                  <span className="farm-text-muted ml-2">({crop.variety})</span>
                )}
              </h1>
              <p className="farm-text-muted mt-1">
                Planted {daysSincePlanting} days ago •{" "}
                {getStatusBadge(crop.status)}
                {crop.field && (
                  <>
                    {" • "}
                    <FarmButton
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/fields/${crop.field?.id}`)}
                      className="text-muted-foreground hover:text-primary p-0 h-auto font-normal"
                    >
                      Field: {crop.field.name}
                    </FarmButton>
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <FarmButton variant="outline" onClick={() => router.push("/crops")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Crops
            </FarmButton>
            <FarmButton
              variant="primary"
              onClick={() => router.push(`/crops/${cropId}/edit`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </FarmButton>
          </div>
        </div>
      </div>

      {/* Harvest Alert */}
      {isOverdue && (
        <FarmCard className="border-destructive/20 bg-destructive/5 mb-6">
          <FarmCardContent>
            <div className="flex items-center gap-3 p-4">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Harvest Overdue</p>
                <p className="farm-text-caption">
                  Expected harvest was {Math.abs(daysToHarvest)} days ago
                </p>
              </div>
            </div>
          </FarmCardContent>
        </FarmCard>
      )}

      {daysToHarvest <= 7 && daysToHarvest > 0 && !crop.actualHarvestDate && (
        <FarmCard className="border-warning/20 bg-warning/5 mb-6">
          <FarmCardContent>
            <div className="flex items-center gap-3 p-4">
              <Clock className="w-5 h-5 text-warning" />
              <div>
                <p className="font-medium text-warning">Harvest Due Soon</p>
                <p className="farm-text-caption">
                  Expected harvest in {daysToHarvest} days
                </p>
              </div>
            </div>
          </FarmCardContent>
        </FarmCard>
      )}

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
              onClick={() => setActiveTab("timeline")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "timeline"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              Growth Timeline
            </button>
            <button
              onClick={() => setActiveTab("activities")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "activities"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              Activities (
              {(crop.tasks?.length || 0) +
                (crop.irrigationLogs?.length || 0) +
                (crop.fertilizerLogs?.length || 0)}
              )
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <FarmCard>
            <FarmCardHeader title="Basic Information" />
            <FarmCardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="farm-text-muted">Status</span>
                  {getStatusBadge(crop.status)}
                </div>

                <div className="flex justify-between items-center">
                  <span className="farm-text-muted">Variety</span>
                  <span className="farm-text-body font-medium">
                    {crop.variety || "Not specified"}
                  </span>
                </div>

                {crop.area && (
                  <div className="flex justify-between items-center">
                    <span className="farm-text-muted">Area</span>
                    <span className="farm-text-body font-medium">
                      {crop.area} m²
                    </span>
                  </div>
                )}

                {crop.field && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="farm-text-muted">Field</span>
                    </div>
                    <FarmButton
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/fields/${crop.field?.id}`)}
                      className="text-primary hover:text-primary-hover hover:bg-primary/10"
                    >
                      <MapPin className="w-3 h-3 mr-1" />
                      {crop.field.name}
                    </FarmButton>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="farm-text-muted">Created</span>
                  <span className="farm-text-body font-medium">
                    {formatDate(crop.createdAt)}
                  </span>
                </div>
              </div>
            </FarmCardContent>
          </FarmCard>

          {/* Growth Progress */}
          <FarmCard>
            <FarmCardHeader title="Growth Progress" />
            <FarmCardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="farm-text-muted">Planting Date</span>
                  </div>
                  <span className="farm-text-body font-medium">
                    {formatDate(crop.plantingDate)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="farm-text-muted">Days Since Planting</span>
                  <span className="farm-text-body font-medium">
                    {daysSincePlanting} days
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="farm-text-muted">Expected Harvest</span>
                  <span className="farm-text-body font-medium">
                    {formatDate(crop.expectedHarvestDate)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="farm-text-muted">Days to Harvest</span>
                  <span
                    className={`farm-text-body font-medium ${
                      isOverdue
                        ? "text-destructive"
                        : daysToHarvest <= 7
                          ? "text-warning"
                          : ""
                    }`}
                  >
                    {crop.actualHarvestDate
                      ? "Harvested"
                      : isOverdue
                        ? `${Math.abs(daysToHarvest)} days overdue`
                        : `${daysToHarvest} days`}
                  </span>
                </div>

                {crop.actualHarvestDate && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="farm-text-muted">Actual Harvest</span>
                    </div>
                    <span className="farm-text-body font-medium">
                      {formatDate(crop.actualHarvestDate)}
                    </span>
                  </div>
                )}
              </div>
            </FarmCardContent>
          </FarmCard>

          {/* Activity Summary */}
          <FarmCard>
            <FarmCardHeader title="Activity Summary" />
            <FarmCardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <span className="farm-text-muted">Total Tasks</span>
                  </div>
                  <span className="farm-text-body font-medium">
                    {crop.tasks?.length || 0}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-muted-foreground" />
                    <span className="farm-text-muted">Irrigation Logs</span>
                  </div>
                  <span className="farm-text-body font-medium">
                    {crop.irrigationLogs?.length || 0}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <span className="farm-text-muted">Fertilizer Logs</span>
                  </div>
                  <span className="farm-text-body font-medium">
                    {crop.fertilizerLogs?.length || 0}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Bug className="w-4 h-4 text-muted-foreground" />
                    <span className="farm-text-muted">Pest/Disease Logs</span>
                  </div>
                  <span className="farm-text-body font-medium">
                    {crop.pestDiseaseLogs?.length || 0}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-muted-foreground" />
                    <span className="farm-text-muted">Harvest Records</span>
                  </div>
                  <span className="farm-text-body font-medium">
                    {crop.harvestLogs?.length || 0}
                  </span>
                </div>
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
                    onClick={() => setShowTreatmentModal(true)}
                  >
                    <Bug className="w-5 h-5 text-destructive" />
                    <span className="text-sm">Record Treatment</span>
                  </FarmButton>

                  <FarmButton
                    variant="outline"
                    className="h-auto p-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/20"
                    onClick={() => setShowStatusModal(true)}
                  >
                    <Activity className="w-5 h-5 text-primary" />
                    <span className="text-sm">Update Status</span>
                  </FarmButton>

                  <FarmButton
                    variant="outline"
                    className="h-auto p-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/20"
                    onClick={() => setShowIrrigationModal(true)}
                  >
                    <Droplets className="w-5 h-5 text-blue-500" />
                    <span className="text-sm">Log Irrigation</span>
                  </FarmButton>

                  <FarmButton
                    variant="outline"
                    className="h-auto p-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/20"
                    onClick={() => setShowFertilizerModal(true)}
                  >
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Log Fertilizer</span>
                  </FarmButton>
                </div>

                {/* Secondary Actions */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FarmButton
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => router.push(`/tasks?crop=${cropId}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Tasks
                    </FarmButton>

                    <FarmButton
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => router.push(`/activities?crop=${cropId}`)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Task
                    </FarmButton>

                    <FarmButton
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => router.push(`/reports?crop=${cropId}`)}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Reports
                    </FarmButton>

                    <FarmButton
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => setActiveTab("activities")}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      View History
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
                      Delete Crop
                    </h4>
                    <p className="farm-text-muted">
                      Permanently delete this crop and all associated data. This
                      action cannot be undone.
                    </p>
                  </div>
                  <FarmButton variant="destructive" onClick={handleDeleteClick}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Crop
                  </FarmButton>
                </div>
              </FarmCardContent>
            </FarmCard>
          </div>
        </div>
      )}

      {activeTab === "timeline" && (
        <FarmCard>
          <FarmCardHeader title="Growth Timeline" />
          <FarmCardContent>
            <div className="space-y-6">
              {/* Timeline items would go here */}
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="farm-heading-card mb-2">Growth Timeline</h3>
                <p className="farm-text-muted">
                  Timeline feature will be implemented in a future update.
                </p>
              </div>
            </div>
          </FarmCardContent>
        </FarmCard>
      )}

      {activeTab === "activities" && (
        <div className="space-y-6">
          <ActivityTimeline
            activities={activities}
            entityType="crop"
            entityId={cropId}
            showFilters={true}
          />

          {activitiesError && (
            <FarmCard className="border-destructive/20 bg-destructive/5">
              <FarmCardContent>
                <div className="flex items-center gap-3 p-4">
                  <span className="text-destructive text-lg">⚠️</span>
                  <span className="text-destructive font-medium">
                    Failed to load activities: {activitiesError}
                  </span>
                  <FarmButton
                    variant="outline"
                    size="sm"
                    onClick={refetchActivities}
                  >
                    Retry
                  </FarmButton>
                </div>
              </FarmCardContent>
            </FarmCard>
          )}
        </div>
      )}

      {isError && crop && (
        <InlineDetailPageError
          error={error!}
          entityType="crop"
          onRetry={canRetry ? retry : undefined}
          showRetry={canRetry}
          className="mt-6"
        />
      )}

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        entityName={crop?.name || ""}
        entityType="Crop"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        dependencies={dependencies}
        loading={isDeleting}
      />

      {/* Quick Action Modals */}
      {crop && (
        <>
          <TreatmentModal
            isOpen={showTreatmentModal}
            onClose={() => setShowTreatmentModal(false)}
            cropId={cropId}
            cropName={crop.name}
            onSuccess={handleQuickActionSuccess}
          />

          <StatusUpdateModal
            isOpen={showStatusModal}
            onClose={() => setShowStatusModal(false)}
            cropId={cropId}
            cropName={crop.name}
            currentStatus={crop.status}
            onSuccess={handleQuickActionSuccess}
          />

          <IrrigationModal
            isOpen={showIrrigationModal}
            onClose={() => setShowIrrigationModal(false)}
            cropId={cropId}
            cropName={crop.name}
            onSuccess={handleQuickActionSuccess}
          />

          <FertilizerModal
            isOpen={showFertilizerModal}
            onClose={() => setShowFertilizerModal(false)}
            cropId={cropId}
            cropName={crop.name}
            onSuccess={handleQuickActionSuccess}
          />
        </>
      )}
    </PageContainer>
  );
}
