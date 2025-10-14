"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Crop, CropStatus } from "@/types";
import { usePullToRefresh, useIsMobile } from "@/hooks/useMobileGestures";
import {
  PageHeader,
  FarmCard,
  FarmCardHeader,
  FarmCardContent,
  FarmButton,
  FarmBadge,
  LoadingState,
  EmptyState,
} from "@/components/ui/farm-theme";
import { Sprout, Plus, Calendar, MapPin } from "lucide-react";

export default function CropsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    variety: "",
    plantingDate: "",
    expectedHarvestDate: "",
    area: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const isMobile = useIsMobile();

  const fetchCrops = useCallback(async () => {
    try {
      const response = await fetch("/api/crops");
      const data = await response.json();

      if (data.success) {
        setCrops(data.data);
      } else {
        setError("Failed to fetch crops");
      }
    } catch {
      setError("Error fetching crops");
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

    if (user) {
      fetchCrops();
    }
  }, [user, isLoaded, router, fetchCrops]);

  const pullToRefresh = usePullToRefresh<HTMLDivElement>({
    onRefresh: fetchCrops,
    threshold: 80,
  });

  const handleCreateCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");

    try {
      const response = await fetch("/api/crops", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          variety: formData.variety || undefined,
          plantingDate: formData.plantingDate,
          expectedHarvestDate: formData.expectedHarvestDate,
          area: formData.area ? parseFloat(formData.area) : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCrops([data.data, ...crops]);
        setShowCreateForm(false);
        setFormData({
          name: "",
          variety: "",
          plantingDate: "",
          expectedHarvestDate: "",
          area: "",
        });
      } else {
        setError(data.error || "Failed to create crop");
      }
    } catch {
      setError("Error creating crop");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCrop = async (cropId: string) => {
    if (!confirm("Are you sure you want to delete this crop?")) {
      return;
    }

    try {
      const response = await fetch(`/api/crops/${cropId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setCrops(crops.filter((crop) => crop.id !== cropId));
      } else {
        setError(data.error || "Failed to delete crop");
      }
    } catch {
      setError("Error deleting crop");
    }
  };

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

  const getDaysToHarvest = (expectedHarvestDate: Date) => {
    const today = new Date();
    const harvestDate = new Date(expectedHarvestDate);
    const diffTime = harvestDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (!isLoaded || loading) {
    return <LoadingState message="Loading crops..." />;
  }

  return (
    <div
      ref={isMobile ? pullToRefresh.elementRef : null}
      className="page-container"
    >
      {isMobile && pullToRefresh.refreshIndicator}
      <div className="content-container padding-responsive-lg mobile-header-spacing content-spacing">
        <PageHeader
          title="Crop Management"
          description="Monitor and manage your crops from planting to harvest"
          icon={<Sprout className="w-6 h-6" />}
          actions={
            <FarmButton
              variant="success"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="w-4 h-4" />
              Add New Crop
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

        {showCreateForm && (
          <FarmCard>
            <FarmCardHeader
              title="Add New Crop"
              description="Create a new crop entry for tracking"
            />
            <FarmCardContent>
              <form onSubmit={handleCreateCrop} className="farm-form">
                <div className="farm-grid grid-cols-1 md:grid-cols-2">
                  <div>
                    <label className="farm-label">Crop Name *</label>
                    <Input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g., Tomatoes"
                    />
                  </div>
                  <div>
                    <label className="farm-label">Variety</label>
                    <Input
                      type="text"
                      value={formData.variety}
                      onChange={(e) =>
                        setFormData({ ...formData, variety: e.target.value })
                      }
                      placeholder="e.g., Cherry"
                    />
                  </div>
                  <div>
                    <label className="farm-label">Planting Date *</label>
                    <Input
                      type="date"
                      required
                      value={formData.plantingDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          plantingDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="farm-label">
                      Expected Harvest Date *
                    </label>
                    <Input
                      type="date"
                      required
                      value={formData.expectedHarvestDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          expectedHarvestDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="farm-label">Area (square meters)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.area}
                      onChange={(e) =>
                        setFormData({ ...formData, area: e.target.value })
                      }
                      placeholder="e.g., 100"
                    />
                  </div>
                </div>
                <div className="action-buttons">
                  <FarmButton
                    type="submit"
                    variant="success"
                    disabled={formLoading}
                  >
                    {formLoading ? "Creating..." : "Create Crop"}
                  </FarmButton>
                  <FarmButton
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </FarmButton>
                </div>
              </form>
            </FarmCardContent>
          </FarmCard>
        )}

        {crops.length === 0 ? (
          <EmptyState
            icon={<Sprout className="text-4xl" />}
            title="No Crops Found"
            description="Add your first crop to get started with farm management!"
            action={
              <FarmButton
                variant="success"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Crop
              </FarmButton>
            }
          />
        ) : (
          <div className="farm-grid-auto">
            {crops.map((crop) => {
              const daysToHarvest = getDaysToHarvest(crop.expectedHarvestDate);
              return (
                <FarmCard
                  key={crop.id}
                  interactive
                  onClick={() => router.push(`/crops/${crop.id}`)}
                >
                  <FarmCardHeader
                    title={crop.name}
                    description={crop.variety || "Crop"}
                    badge={getStatusBadge(crop.status)}
                  />
                  <FarmCardContent>
                    <div className="farm-card-content">
                      <div className="flex-between py-2">
                        <div className="icon-text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="farm-text-muted">Planted</span>
                        </div>
                        <span className="farm-text-body font-semibold">
                          {new Date(crop.plantingDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex-between py-2">
                        <div className="icon-text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="farm-text-muted">Harvest in</span>
                        </div>
                        <span
                          className={`farm-text-body font-semibold ${
                            daysToHarvest <= 7
                              ? "text-warning"
                              : daysToHarvest <= 30
                                ? "text-warning"
                                : "text-success"
                          }`}
                        >
                          {daysToHarvest} days
                        </span>
                      </div>
                      {crop.area && (
                        <div className="flex-between py-2">
                          <div className="icon-text-sm">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="farm-text-muted">Area</span>
                          </div>
                          <span className="farm-text-body font-semibold">
                            {crop.area} m²
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="farm-card-section">
                      <div className="action-buttons-sm">
                        <FarmButton
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/crops/${crop.id}`);
                          }}
                        >
                          View Details
                        </FarmButton>
                        <FarmButton
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCrop(crop.id);
                          }}
                        >
                          Delete
                        </FarmButton>
                      </div>
                    </div>
                  </FarmCardContent>
                </FarmCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
