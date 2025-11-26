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
  FarmForm,
  FarmFormGroup,
  FarmInput,
  FarmSelect,
  FarmTextarea,
  LoadingState,
  ErrorState,
} from "@/components/ui/farm-theme";
import DeleteConfirmationDialog from "@/components/ui/delete-confirmation-dialog";
import { Map, ArrowLeft, Save, Trash2, MapPin } from "lucide-react";

interface Field {
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
}

interface FieldFormData {
  name: string;
  description: string;
  area: string;
  unit: string;
  latitude: string;
  longitude: string;
  address: string;
  soilType: string;
  drainageType: string;
  irrigationType: string;
  isActive: boolean;
}

const AREA_UNITS = ["acres", "hectares", "square_meters", "square_feet"];
const SOIL_TYPES = [
  "clay",
  "sandy",
  "loam",
  "silt",
  "clay_loam",
  "sandy_loam",
  "silty_loam",
  "peat",
  "chalk",
  "other",
];
const DRAINAGE_TYPES = [
  "well_drained",
  "moderately_drained",
  "poorly_drained",
  "very_poorly_drained",
  "excessively_drained",
];
const IRRIGATION_TYPES = [
  "drip",
  "sprinkler",
  "flood",
  "furrow",
  "center_pivot",
  "lateral_move",
  "micro_spray",
  "none",
];

export default function EditFieldPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const fieldId = params.id as string;

  const [field, setField] = useState<Field | null>(null);
  const [formData, setFormData] = useState<FieldFormData>({
    name: "",
    description: "",
    area: "",
    unit: "acres",
    latitude: "",
    longitude: "",
    address: "",
    soilType: "",
    drainageType: "",
    irrigationType: "",
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [dependencies, setDependencies] = useState<unknown[]>([]);

  const fetchField = useCallback(async () => {
    try {
      const response = await fetch(`/api/fields/${fieldId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError("Field not found");
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return;
      }

      const data = await response.json();

      if (data.success) {
        const fieldData = data.data;
        setField(fieldData);

        // Populate form data
        setFormData({
          name: fieldData.name || "",
          description: fieldData.description || "",
          area: fieldData.area?.toString() || "",
          unit: fieldData.unit || "acres",
          latitude: fieldData.latitude?.toString() || "",
          longitude: fieldData.longitude?.toString() || "",
          address: fieldData.address || "",
          soilType: fieldData.soilType || "",
          drainageType: fieldData.drainageType || "",
          irrigationType: fieldData.irrigationType || "",
          isActive: fieldData.isActive ?? true,
        });
      } else {
        setError(data.error || "Failed to fetch field");
      }
    } catch (err) {
      console.error("Field fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch field");
    } finally {
      setLoading(false);
    }
  }, [fieldId, setField, setFormData, setError, setLoading]);

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

  const handleInputChange = useCallback(
    (field: keyof FieldFormData, value: string | boolean) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [setFormData]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const submitData = {
        name: formData.name,
        description: formData.description || undefined,
        area: parseFloat(formData.area),
        unit: formData.unit,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude
          ? parseFloat(formData.longitude)
          : undefined,
        address: formData.address || undefined,
        soilType: formData.soilType || undefined,
        drainageType: formData.drainageType || undefined,
        irrigationType: formData.irrigationType || undefined,
        isActive: formData.isActive,
      };

      const response = await fetch(`/api/fields/${fieldId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Field updated successfully!");
        setTimeout(() => {
          router.push(`/fields/${fieldId}`);
        }, 1500);
      } else {
        setError(data.error || "Failed to update field");
      }
    } catch (err) {
      console.error("Field update error:", err);
      setError("Failed to update field. Please try again.");
    } finally {
      setSaving(false);
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

  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }));
        },
        (error) => {
          console.error("Error getting location:", error);
          setError(
            "Unable to get your location. Please enter coordinates manually."
          );
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };

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
      <div className="farm-page-header">
        <div className="farm-page-title-section">
          <div className="farm-page-title-group">
            <div className="farm-page-icon bg-gradient-to-br from-primary to-primary-hover">
              <Map className="w-6 h-6 text-white" />
            </div>
            <div className="farm-page-title-text">
              <h1 className="farm-heading-display">Edit Field</h1>
              <p className="farm-text-muted mt-1">
                Update {field.name} information and settings
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

      <FarmCard>
        <FarmCardHeader title="Field Information" />
        <FarmCardContent>
          <FarmForm onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="farm-heading-card">Basic Information</h3>

                <FarmFormGroup label="Field Name" required>
                  <FarmInput
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g., North Field"
                    required
                  />
                </FarmFormGroup>

                <FarmFormGroup label="Description">
                  <FarmTextarea
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Field description and notes..."
                    rows={3}
                  />
                </FarmFormGroup>

                <div className="grid grid-cols-2 gap-4">
                  <FarmFormGroup label="Area" required>
                    <FarmInput
                      type="number"
                      step="0.01"
                      value={formData.area}
                      onChange={(e) =>
                        handleInputChange("area", e.target.value)
                      }
                      placeholder="e.g., 10.5"
                      required
                    />
                  </FarmFormGroup>

                  <FarmFormGroup label="Unit" required>
                    <FarmSelect
                      value={formData.unit}
                      onChange={(e) =>
                        handleInputChange("unit", e.target.value)
                      }
                      required
                    >
                      {AREA_UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit.replace("_", " ")}
                        </option>
                      ))}
                    </FarmSelect>
                  </FarmFormGroup>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      handleInputChange("isActive", e.target.checked)
                    }
                    className="rounded border-border"
                  />
                  <label htmlFor="isActive" className="farm-form-label">
                    Field is active
                  </label>
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h3 className="farm-heading-card">Location Information</h3>

                <FarmFormGroup label="Address">
                  <FarmTextarea
                    value={formData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    placeholder="Field address or location description..."
                    rows={3}
                  />
                </FarmFormGroup>

                <div className="grid grid-cols-2 gap-4">
                  <FarmFormGroup label="Latitude">
                    <FarmInput
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) =>
                        handleInputChange("latitude", e.target.value)
                      }
                      placeholder="e.g., 40.7128"
                    />
                  </FarmFormGroup>

                  <FarmFormGroup label="Longitude">
                    <FarmInput
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) =>
                        handleInputChange("longitude", e.target.value)
                      }
                      placeholder="e.g., -74.0060"
                    />
                  </FarmFormGroup>
                </div>

                <FarmButton
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                  className="w-full"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Use My Current Location
                </FarmButton>
              </div>

              {/* Soil and Drainage */}
              <div className="space-y-4">
                <h3 className="farm-heading-card">Soil & Drainage</h3>

                <FarmFormGroup label="Soil Type">
                  <FarmSelect
                    value={formData.soilType}
                    onChange={(e) =>
                      handleInputChange("soilType", e.target.value)
                    }
                  >
                    <option value="">Select soil type</option>
                    {SOIL_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type.replace("_", " ")}
                      </option>
                    ))}
                  </FarmSelect>
                </FarmFormGroup>

                <FarmFormGroup label="Drainage Type">
                  <FarmSelect
                    value={formData.drainageType}
                    onChange={(e) =>
                      handleInputChange("drainageType", e.target.value)
                    }
                  >
                    <option value="">Select drainage type</option>
                    {DRAINAGE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type.replace("_", " ")}
                      </option>
                    ))}
                  </FarmSelect>
                </FarmFormGroup>
              </div>

              {/* Irrigation */}
              <div className="space-y-4">
                <h3 className="farm-heading-card">Irrigation</h3>

                <FarmFormGroup label="Irrigation Type">
                  <FarmSelect
                    value={formData.irrigationType}
                    onChange={(e) =>
                      handleInputChange("irrigationType", e.target.value)
                    }
                  >
                    <option value="">Select irrigation type</option>
                    {IRRIGATION_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type.replace("_", " ")}
                      </option>
                    ))}
                  </FarmSelect>
                </FarmFormGroup>
              </div>
            </div>

            <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
              <FarmButton
                type="button"
                variant="destructive"
                onClick={handleDeleteClick}
                disabled={deleting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Field
              </FarmButton>

              <div className="flex gap-4">
                <FarmButton
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </FarmButton>
                <FarmButton type="submit" variant="primary" loading={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </FarmButton>
              </div>
            </div>
          </FarmForm>
        </FarmCardContent>
      </FarmCard>

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        entityName={field?.name || ""}
        entityType="Field"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        dependencies={dependencies as any}
        loading={deleting}
      />
    </PageContainer>
  );
}
