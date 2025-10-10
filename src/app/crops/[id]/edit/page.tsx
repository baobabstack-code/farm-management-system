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
  FarmForm,
  FarmFormGroup,
  FarmInput,
  FarmSelect,
  LoadingState,
  ErrorState,
} from "@/components/ui/farm-theme";
import DeleteConfirmationDialog from "@/components/ui/delete-confirmation-dialog";
import { Sprout, ArrowLeft, Save, Trash2 } from "lucide-react";

interface Crop {
  id: string;
  name: string;
  variety?: string;
  plantingDate: string;
  expectedHarvestDate: string;
  actualHarvestDate?: string;
  status: string;
  area?: number;
  fieldId?: string;
}

interface Field {
  id: string;
  name: string;
  area: number;
  unit: string;
}

interface CropFormData {
  name: string;
  variety: string;
  plantingDate: string;
  expectedHarvestDate: string;
  actualHarvestDate: string;
  status: string;
  area: string;
  fieldId: string;
}

const CROP_STATUSES = [
  "PLANTED",
  "GROWING",
  "FLOWERING",
  "FRUITING",
  "HARVESTED",
  "COMPLETED",
];

export default function EditCropPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const cropId = params.id as string;

  const [crop, setCrop] = useState<Crop | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [formData, setFormData] = useState<CropFormData>({
    name: "",
    variety: "",
    plantingDate: "",
    expectedHarvestDate: "",
    actualHarvestDate: "",
    status: "PLANTED",
    area: "",
    fieldId: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [dependencies, setDependencies] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push("/sign-in");
      return;
    }

    if (cropId) {
      fetchCrop();
      fetchFields();
    }
  }, [user, isLoaded, router, cropId]);

  const fetchCrop = async () => {
    try {
      const response = await fetch(`/api/crops/${cropId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError("Crop not found");
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return;
      }

      const data = await response.json();

      if (data.success) {
        const cropData = data.data;
        setCrop(cropData);

        // Populate form data
        setFormData({
          name: cropData.name || "",
          variety: cropData.variety || "",
          plantingDate: cropData.plantingDate
            ? new Date(cropData.plantingDate).toISOString().split("T")[0]
            : "",
          expectedHarvestDate: cropData.expectedHarvestDate
            ? new Date(cropData.expectedHarvestDate).toISOString().split("T")[0]
            : "",
          actualHarvestDate: cropData.actualHarvestDate
            ? new Date(cropData.actualHarvestDate).toISOString().split("T")[0]
            : "",
          status: cropData.status || "PLANTED",
          area: cropData.area?.toString() || "",
          fieldId: cropData.fieldId || "",
        });
      } else {
        setError(data.error || "Failed to fetch crop");
      }
    } catch (err) {
      console.error("Crop fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch crop");
    } finally {
      setLoading(false);
    }
  };

  const fetchFields = async () => {
    try {
      const response = await fetch("/api/fields");
      const data = await response.json();

      if (data.success) {
        setFields(data.data || []);
      }
    } catch (err) {
      console.error("Fields fetch error:", err);
    }
  };

  const handleInputChange = (field: keyof CropFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const submitData = {
        name: formData.name,
        variety: formData.variety || undefined,
        plantingDate: formData.plantingDate,
        expectedHarvestDate: formData.expectedHarvestDate,
        actualHarvestDate: formData.actualHarvestDate || undefined,
        status: formData.status,
        area: formData.area ? parseFloat(formData.area) : undefined,
        fieldId: formData.fieldId || undefined,
      };

      const response = await fetch(`/api/crops/${cropId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Crop updated successfully!");
        setTimeout(() => {
          router.push(`/crops/${cropId}`);
        }, 1500);
      } else {
        setError(data.error || "Failed to update crop");
      }
    } catch (err) {
      console.error("Crop update error:", err);
      setError("Failed to update crop. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!crop) return;

    try {
      // Check dependencies first
      const response = await fetch(`/api/crops/${cropId}/dependencies`);
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
    if (!crop) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/crops/${cropId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        router.push("/crops");
      } else {
        setError(data.error || "Failed to delete crop");
        setShowDeleteDialog(false);
      }
    } catch (err) {
      console.error("Crop deletion error:", err);
      setError("Failed to delete crop. Please try again.");
      setShowDeleteDialog(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setDependencies([]);
  };

  if (!isLoaded || loading) {
    return <LoadingState message="Loading crop details..." />;
  }

  if (error && !crop) {
    return (
      <PageContainer>
        <ErrorState
          title="Crop Loading Error"
          message={error}
          onRetry={fetchCrop}
        />
      </PageContainer>
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

  return (
    <PageContainer>
      <div className="farm-page-header">
        <div className="farm-page-title-section">
          <div className="farm-page-title-group">
            <div className="farm-page-icon bg-gradient-to-br from-success to-success/80">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div className="farm-page-title-text">
              <h1 className="farm-heading-display">Edit Crop</h1>
              <p className="farm-text-muted mt-1">
                Update {crop.name} information and status
              </p>
            </div>
          </div>
          <FarmButton variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </FarmButton>
        </div>
      </div>

      {error && (
        <FarmCard className="border-destructive/20 bg-destructive/5 mb-6">
          <FarmCardContent>
            <div className="flex items-center gap-3 p-4">
              <span className="text-destructive text-lg">⚠️</span>
              <span className="text-destructive font-medium">{error}</span>
            </div>
          </FarmCardContent>
        </FarmCard>
      )}

      {success && (
        <FarmCard className="border-success/20 bg-success/5 mb-6">
          <FarmCardContent>
            <div className="flex items-center gap-3 p-4">
              <span className="text-success text-lg">✅</span>
              <span className="text-success font-medium">{success}</span>
            </div>
          </FarmCardContent>
        </FarmCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <FarmCard>
            <FarmCardHeader title="Crop Information" />
            <FarmCardContent>
              <FarmForm onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FarmFormGroup label="Crop Name" required>
                    <FarmInput
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="e.g., Tomatoes"
                      required
                    />
                  </FarmFormGroup>

                  <FarmFormGroup label="Variety">
                    <FarmInput
                      type="text"
                      value={formData.variety}
                      onChange={(e) =>
                        handleInputChange("variety", e.target.value)
                      }
                      placeholder="e.g., Cherry"
                    />
                  </FarmFormGroup>

                  <FarmFormGroup label="Status" required>
                    <FarmSelect
                      value={formData.status}
                      onChange={(e) =>
                        handleInputChange("status", e.target.value)
                      }
                      required
                    >
                      {CROP_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status.replace("_", " ")}
                        </option>
                      ))}
                    </FarmSelect>
                  </FarmFormGroup>

                  <FarmFormGroup label="Field">
                    <FarmSelect
                      value={formData.fieldId}
                      onChange={(e) =>
                        handleInputChange("fieldId", e.target.value)
                      }
                    >
                      <option value="">No specific field</option>
                      {fields.map((field) => (
                        <option key={field.id} value={field.id}>
                          {field.name} ({field.area} {field.unit})
                        </option>
                      ))}
                    </FarmSelect>
                  </FarmFormGroup>

                  <FarmFormGroup label="Planting Date" required>
                    <FarmInput
                      type="date"
                      value={formData.plantingDate}
                      onChange={(e) =>
                        handleInputChange("plantingDate", e.target.value)
                      }
                      required
                    />
                  </FarmFormGroup>

                  <FarmFormGroup label="Expected Harvest Date" required>
                    <FarmInput
                      type="date"
                      value={formData.expectedHarvestDate}
                      onChange={(e) =>
                        handleInputChange("expectedHarvestDate", e.target.value)
                      }
                      required
                    />
                  </FarmFormGroup>

                  <FarmFormGroup label="Actual Harvest Date">
                    <FarmInput
                      type="date"
                      value={formData.actualHarvestDate}
                      onChange={(e) =>
                        handleInputChange("actualHarvestDate", e.target.value)
                      }
                    />
                  </FarmFormGroup>

                  <FarmFormGroup label="Area (square meters)">
                    <FarmInput
                      type="number"
                      step="0.01"
                      value={formData.area}
                      onChange={(e) =>
                        handleInputChange("area", e.target.value)
                      }
                      placeholder="e.g., 100"
                    />
                  </FarmFormGroup>
                </div>

                <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
                  <FarmButton
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteClick}
                    disabled={deleting}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Crop
                  </FarmButton>

                  <div className="flex gap-4">
                    <FarmButton
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                    >
                      Cancel
                    </FarmButton>
                    <FarmButton
                      type="submit"
                      variant="primary"
                      loading={saving}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? "Saving..." : "Save Changes"}
                    </FarmButton>
                  </div>
                </div>
              </FarmForm>
            </FarmCardContent>
          </FarmCard>
        </div>

        {/* Crop Summary */}
        <div>
          <FarmCard>
            <FarmCardHeader title="Crop Summary" />
            <FarmCardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="farm-text-muted">Current Status</span>
                  <span className="farm-text-body font-medium">
                    {crop.status.replace("_", " ")}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="farm-text-muted">Days Since Planting</span>
                  <span className="farm-text-body font-medium">
                    {Math.floor(
                      (new Date().getTime() -
                        new Date(crop.plantingDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}{" "}
                    days
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="farm-text-muted">Days to Harvest</span>
                  <span className="farm-text-body font-medium">
                    {Math.ceil(
                      (new Date(crop.expectedHarvestDate).getTime() -
                        new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}{" "}
                    days
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

                <div className="pt-4 border-t border-border">
                  <p className="farm-text-caption">
                    Created: {new Date(crop.plantingDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </FarmCardContent>
          </FarmCard>

          {/* Quick Actions */}
          <FarmCard className="mt-6">
            <FarmCardHeader title="Quick Actions" />
            <FarmCardContent>
              <div className="space-y-3">
                <FarmButton
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/crops/${cropId}`)}
                >
                  👁️ View Details
                </FarmButton>
                <FarmButton
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/tasks?crop=${cropId}`)}
                >
                  ✅ View Tasks
                </FarmButton>
                <FarmButton
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/activities?crop=${cropId}`)}
                >
                  📋 Log Activity
                </FarmButton>
              </div>
            </FarmCardContent>
          </FarmCard>
        </div>
      </div>

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        entityName={crop?.name || ""}
        entityType="Crop"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        dependencies={dependencies}
        loading={deleting}
      />
    </PageContainer>
  );
}
