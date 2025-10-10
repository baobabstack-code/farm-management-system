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
  FarmTextarea,
  LoadingState,
  ErrorState,
} from "@/components/ui/farm-theme";
import DeleteConfirmationDialog from "@/components/ui/delete-confirmation-dialog";
import { Wrench, ArrowLeft, Save, Trash2 } from "lucide-react";

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
}

export default function EditEquipmentPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const equipmentId = params.id as string;

  const [equipment, setEquipment] = useState<Equipment | null>(null);
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

    if (equipmentId) {
      fetchEquipment();
    }
  }, [user, isLoaded, router, equipmentId]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/land-preparation/equipment/${equipmentId}`
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

  const handleSave = async () => {
    if (!equipment) return;

    try {
      setSaving(true);
      const response = await fetch(
        `/api/land-preparation/equipment/${equipmentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(equipment),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setSuccess("Equipment updated successfully!");
        setTimeout(() => {
          router.push(`/equipment/${equipmentId}`);
        }, 1500);
      } else {
        setError(data.error || "Failed to update equipment");
      }
    } catch (err) {
      console.error("Equipment update error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update equipment"
      );
    } finally {
      setSaving(false);
    }
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

  const updateEquipment = (field: keyof Equipment, value: any) => {
    if (!equipment) return;
    setEquipment({ ...equipment, [field]: value });
  };

  if (!isLoaded || loading) {
    return <LoadingState message="Loading equipment..." />;
  }

  if (error && !equipment) {
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
      <div className="farm-page-header">
        <div className="farm-page-title-section">
          <div className="farm-page-title-group">
            <div className="farm-page-icon bg-gradient-to-br from-warning to-warning/80">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div className="farm-page-title-text">
              <h1 className="farm-heading-display">Edit Equipment</h1>
              <p className="farm-text-muted mt-1">
                Update equipment information and specifications
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <FarmButton variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cancel
            </FarmButton>
            <FarmButton
              variant="primary"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </FarmButton>
          </div>
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

      <FarmForm
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <FarmCard>
            <FarmCardHeader title="Basic Information" />
            <FarmCardContent>
              <div className="space-y-4">
                <FarmFormGroup label="Equipment Name" required>
                  <FarmInput
                    type="text"
                    value={equipment.name}
                    onChange={(e) => updateEquipment("name", e.target.value)}
                    required
                  />
                </FarmFormGroup>

                <FarmFormGroup label="Equipment Type" required>
                  <FarmSelect
                    value={equipment.equipmentType}
                    onChange={(e) =>
                      updateEquipment("equipmentType", e.target.value)
                    }
                    required
                  >
                    <option value="tractor">Tractor</option>
                    <option value="harvester">Harvester</option>
                    <option value="planter">Planter</option>
                    <option value="cultivator">Cultivator</option>
                    <option value="sprayer">Sprayer</option>
                    <option value="mower">Mower</option>
                    <option value="other">Other</option>
                  </FarmSelect>
                </FarmFormGroup>

                <FarmFormGroup label="Category" required>
                  <FarmSelect
                    value={equipment.category}
                    onChange={(e) =>
                      updateEquipment("category", e.target.value)
                    }
                    required
                  >
                    <option value="tillage">Tillage</option>
                    <option value="planting">Planting</option>
                    <option value="harvesting">Harvesting</option>
                    <option value="spraying">Spraying</option>
                    <option value="transport">Transport</option>
                    <option value="maintenance">Maintenance</option>
                  </FarmSelect>
                </FarmFormGroup>

                <FarmFormGroup label="Brand">
                  <FarmInput
                    type="text"
                    value={equipment.brand || ""}
                    onChange={(e) => updateEquipment("brand", e.target.value)}
                  />
                </FarmFormGroup>

                <FarmFormGroup label="Model">
                  <FarmInput
                    type="text"
                    value={equipment.model || ""}
                    onChange={(e) => updateEquipment("model", e.target.value)}
                  />
                </FarmFormGroup>

                <FarmFormGroup label="Serial Number">
                  <FarmInput
                    type="text"
                    value={equipment.serialNumber || ""}
                    onChange={(e) =>
                      updateEquipment("serialNumber", e.target.value)
                    }
                  />
                </FarmFormGroup>
              </div>
            </FarmCardContent>
          </FarmCard>

          {/* Specifications */}
          <FarmCard>
            <FarmCardHeader title="Specifications" />
            <FarmCardContent>
              <div className="space-y-4">
                <FarmFormGroup label="Year Manufactured">
                  <FarmInput
                    type="number"
                    value={equipment.yearManufactured?.toString() || ""}
                    onChange={(e) =>
                      updateEquipment(
                        "yearManufactured",
                        parseInt(e.target.value) || undefined
                      )
                    }
                  />
                </FarmFormGroup>

                <FarmFormGroup label="Horsepower">
                  <FarmInput
                    type="number"
                    value={equipment.horsepower?.toString() || ""}
                    onChange={(e) =>
                      updateEquipment(
                        "horsepower",
                        parseFloat(e.target.value) || undefined
                      )
                    }
                  />
                </FarmFormGroup>

                <FarmFormGroup label="Working Width (ft)">
                  <FarmInput
                    type="number"
                    step="0.1"
                    value={equipment.workingWidth?.toString() || ""}
                    onChange={(e) =>
                      updateEquipment(
                        "workingWidth",
                        parseFloat(e.target.value) || undefined
                      )
                    }
                  />
                </FarmFormGroup>

                <FarmFormGroup label="Weight (lbs)">
                  <FarmInput
                    type="number"
                    value={equipment.weight?.toString() || ""}
                    onChange={(e) =>
                      updateEquipment(
                        "weight",
                        parseFloat(e.target.value) || undefined
                      )
                    }
                  />
                </FarmFormGroup>

                <FarmFormGroup label="Fuel Type">
                  <FarmSelect
                    value={equipment.fuelType || ""}
                    onChange={(e) =>
                      updateEquipment("fuelType", e.target.value || undefined)
                    }
                  >
                    <option value="">Select fuel type</option>
                    <option value="diesel">Diesel</option>
                    <option value="gasoline">Gasoline</option>
                    <option value="electric">Electric</option>
                    <option value="hybrid">Hybrid</option>
                  </FarmSelect>
                </FarmFormGroup>

                <FarmFormGroup label="Hours Used" required>
                  <FarmInput
                    type="number"
                    value={equipment.hoursUsed.toString()}
                    onChange={(e) =>
                      updateEquipment(
                        "hoursUsed",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    required
                  />
                </FarmFormGroup>
              </div>
            </FarmCardContent>
          </FarmCard>

          {/* Status & Condition */}
          <FarmCard>
            <FarmCardHeader title="Status & Condition" />
            <FarmCardContent>
              <div className="space-y-4">
                <FarmFormGroup label="Status" required>
                  <FarmSelect
                    value={equipment.status}
                    onChange={(e) => updateEquipment("status", e.target.value)}
                    required
                  >
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="repair">Repair</option>
                    <option value="retired">Retired</option>
                  </FarmSelect>
                </FarmFormGroup>

                <FarmFormGroup label="Condition" required>
                  <FarmSelect
                    value={equipment.condition}
                    onChange={(e) =>
                      updateEquipment("condition", e.target.value)
                    }
                    required
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                    <option value="needs_repair">Needs Repair</option>
                  </FarmSelect>
                </FarmFormGroup>

                <FarmFormGroup label="Location">
                  <FarmInput
                    type="text"
                    value={equipment.location || ""}
                    onChange={(e) =>
                      updateEquipment("location", e.target.value)
                    }
                  />
                </FarmFormGroup>
              </div>
            </FarmCardContent>
          </FarmCard>

          {/* Financial Information */}
          <FarmCard>
            <FarmCardHeader title="Financial Information" />
            <FarmCardContent>
              <div className="space-y-4">
                <FarmFormGroup label="Purchase Date">
                  <FarmInput
                    type="date"
                    value={
                      equipment.purchaseDate
                        ? new Date(equipment.purchaseDate)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      updateEquipment(
                        "purchaseDate",
                        e.target.value || undefined
                      )
                    }
                  />
                </FarmFormGroup>

                <FarmFormGroup label="Purchase Price">
                  <FarmInput
                    type="number"
                    step="0.01"
                    value={equipment.purchasePrice?.toString() || ""}
                    onChange={(e) =>
                      updateEquipment(
                        "purchasePrice",
                        parseFloat(e.target.value) || undefined
                      )
                    }
                  />
                </FarmFormGroup>

                <FarmFormGroup label="Current Value">
                  <FarmInput
                    type="number"
                    step="0.01"
                    value={equipment.currentValue?.toString() || ""}
                    onChange={(e) =>
                      updateEquipment(
                        "currentValue",
                        parseFloat(e.target.value) || undefined
                      )
                    }
                  />
                </FarmFormGroup>

                <FarmFormGroup label="Daily Rate">
                  <FarmInput
                    type="number"
                    step="0.01"
                    value={equipment.dailyRate?.toString() || ""}
                    onChange={(e) =>
                      updateEquipment(
                        "dailyRate",
                        parseFloat(e.target.value) || undefined
                      )
                    }
                  />
                </FarmFormGroup>
              </div>
            </FarmCardContent>
          </FarmCard>

          {/* Maintenance */}
          <FarmCard className="lg:col-span-2">
            <FarmCardHeader title="Maintenance Information" />
            <FarmCardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <FarmFormGroup label="Last Service Date">
                  <FarmInput
                    type="date"
                    value={
                      equipment.lastServiceDate
                        ? new Date(equipment.lastServiceDate)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      updateEquipment(
                        "lastServiceDate",
                        e.target.value || undefined
                      )
                    }
                  />
                </FarmFormGroup>

                <FarmFormGroup label="Next Service Due">
                  <FarmInput
                    type="date"
                    value={
                      equipment.nextServiceDue
                        ? new Date(equipment.nextServiceDue)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      updateEquipment(
                        "nextServiceDue",
                        e.target.value || undefined
                      )
                    }
                  />
                </FarmFormGroup>

                <FarmFormGroup label="Service Interval (hours)">
                  <FarmInput
                    type="number"
                    value={equipment.serviceInterval?.toString() || ""}
                    onChange={(e) =>
                      updateEquipment(
                        "serviceInterval",
                        parseFloat(e.target.value) || undefined
                      )
                    }
                  />
                </FarmFormGroup>
              </div>

              <FarmFormGroup label="Notes">
                <FarmTextarea
                  value={equipment.notes || ""}
                  onChange={(e) => updateEquipment("notes", e.target.value)}
                  rows={4}
                  placeholder="Equipment notes, maintenance history, or other important information..."
                />
              </FarmFormGroup>
            </FarmCardContent>
          </FarmCard>
        </div>

        <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
          <FarmButton
            type="button"
            variant="destructive"
            onClick={handleDeleteClick}
            disabled={deleting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Equipment
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

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        entityName={equipment?.name || ""}
        entityType="Equipment"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        dependencies={dependencies}
        loading={deleting}
      />
    </PageContainer>
  );
}
