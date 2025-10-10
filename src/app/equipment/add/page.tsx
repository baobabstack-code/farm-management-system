"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
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
} from "@/components/ui/farm-theme";
import { Wrench, ArrowLeft, Save } from "lucide-react";

interface EquipmentFormData {
  name: string;
  equipmentType: string;
  category: string;
  brand: string;
  model: string;
  serialNumber: string;
  yearManufactured: string;
  purchaseDate: string;
  purchasePrice: string;
  currentValue: string;
  status: string;
  condition: string;
  fuelType: string;
  horsepower: string;
  workingWidth: string;
  weight: string;
  hoursUsed: string;
  lastServiceDate: string;
  nextServiceDue: string;
  serviceInterval: string;
  insuranceExpiry: string;
  warrantyExpiry: string;
  location: string;
  dailyRate: string;
  notes: string;
}

const EQUIPMENT_TYPES = [
  "TRACTOR",
  "HARVESTER",
  "PLANTER",
  "CULTIVATOR",
  "SPRAYER",
  "SPREADER",
  "MOWER",
  "DISC",
  "PLOW",
  "HARROW",
  "SEEDER",
  "TRAILER",
  "LOADER",
  "OTHER",
];

const EQUIPMENT_CATEGORIES = [
  "TILLAGE",
  "PLANTING",
  "HARVESTING",
  "SPRAYING",
  "IRRIGATION",
  "TRANSPORT",
  "MAINTENANCE",
  "OTHER",
];

const EQUIPMENT_STATUS = [
  "ACTIVE",
  "MAINTENANCE",
  "REPAIR",
  "RETIRED",
  "RENTED",
  "LEASED",
];

const EQUIPMENT_CONDITIONS = [
  "EXCELLENT",
  "GOOD",
  "FAIR",
  "POOR",
  "NEEDS_REPAIR",
];

const FUEL_TYPES = ["DIESEL", "GASOLINE", "PROPANE", "ELECTRIC", "HYBRID"];

export default function AddEquipmentPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [formData, setFormData] = useState<EquipmentFormData>({
    name: "",
    equipmentType: "TRACTOR",
    category: "TILLAGE",
    brand: "",
    model: "",
    serialNumber: "",
    yearManufactured: "",
    purchaseDate: "",
    purchasePrice: "",
    currentValue: "",
    status: "ACTIVE",
    condition: "GOOD",
    fuelType: "DIESEL",
    horsepower: "",
    workingWidth: "",
    weight: "",
    hoursUsed: "0",
    lastServiceDate: "",
    nextServiceDue: "",
    serviceInterval: "",
    insuranceExpiry: "",
    warrantyExpiry: "",
    location: "",
    dailyRate: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (field: keyof EquipmentFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Prepare the data for submission
      const submitData = {
        name: formData.name,
        equipmentType: formData.equipmentType,
        category: formData.category,
        brand: formData.brand || undefined,
        model: formData.model || undefined,
        serialNumber: formData.serialNumber || undefined,
        yearManufactured: formData.yearManufactured
          ? parseInt(formData.yearManufactured)
          : undefined,
        purchaseDate: formData.purchaseDate || undefined,
        purchasePrice: formData.purchasePrice
          ? parseFloat(formData.purchasePrice)
          : undefined,
        currentValue: formData.currentValue
          ? parseFloat(formData.currentValue)
          : undefined,
        status: formData.status,
        condition: formData.condition,
        fuelType: formData.fuelType || undefined,
        horsepower: formData.horsepower
          ? parseFloat(formData.horsepower)
          : undefined,
        workingWidth: formData.workingWidth
          ? parseFloat(formData.workingWidth)
          : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        hoursUsed: formData.hoursUsed ? parseFloat(formData.hoursUsed) : 0,
        lastServiceDate: formData.lastServiceDate || undefined,
        nextServiceDue: formData.nextServiceDue || undefined,
        serviceInterval: formData.serviceInterval
          ? parseFloat(formData.serviceInterval)
          : undefined,
        insuranceExpiry: formData.insuranceExpiry || undefined,
        warrantyExpiry: formData.warrantyExpiry || undefined,
        location: formData.location || undefined,
        dailyRate: formData.dailyRate
          ? parseFloat(formData.dailyRate)
          : undefined,
        notes: formData.notes || undefined,
      };

      const response = await fetch("/api/land-preparation/equipment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/equipment");
      } else {
        setError(data.error || "Failed to create equipment");
      }
    } catch (err) {
      console.error("Equipment creation error:", err);
      setError("Failed to create equipment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!user) {
    router.push("/sign-in");
    return null;
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
              <h1 className="farm-heading-display">Add Equipment</h1>
              <p className="farm-text-muted mt-1">
                Add new equipment to your farm inventory
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

      <FarmCard>
        <FarmCardHeader title="Equipment Information" />
        <FarmCardContent>
          <FarmForm onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="farm-heading-card">Basic Information</h3>

                <FarmFormGroup label="Equipment Name" required>
                  <FarmInput
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g., John Deere 8320R"
                    required
                  />
                </FarmFormGroup>

                <FarmFormGroup label="Equipment Type" required>
                  <FarmSelect
                    value={formData.equipmentType}
                    onChange={(e) =>
                      handleInputChange("equipmentType", e.target.value)
                    }
                    required
                  >
                    {EQUIPMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type.replace("_", " ")}
                      </option>
                    ))}
                  </FarmSelect>
                </FarmFormGroup>

                <FarmFormGroup label="Category" required>
                  <FarmSelect
                    value={formData.category}
                    onChange={(e) =>
                      handleInputChange("category", e.target.value)
                    }
                    required
                  >
                    {EQUIPMENT_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category.replace("_", " ")}
                      </option>
                    ))}
                  </FarmSelect>
                </FarmFormGroup>

                <div className="grid grid-cols-2 gap-4">
                  <FarmFormGroup label="Brand">
                    <FarmInput
                      type="text"
                      value={formData.brand}
                      onChange={(e) =>
                        handleInputChange("brand", e.target.value)
                      }
                      placeholder="e.g., John Deere"
                    />
                  </FarmFormGroup>

                  <FarmFormGroup label="Model">
                    <FarmInput
                      type="text"
                      value={formData.model}
                      onChange={(e) =>
                        handleInputChange("model", e.target.value)
                      }
                      placeholder="e.g., 8320R"
                    />
                  </FarmFormGroup>
                </div>

                <FarmFormGroup label="Serial Number">
                  <FarmInput
                    type="text"
                    value={formData.serialNumber}
                    onChange={(e) =>
                      handleInputChange("serialNumber", e.target.value)
                    }
                    placeholder="Equipment serial number"
                  />
                </FarmFormGroup>

                <FarmFormGroup label="Year Manufactured">
                  <FarmInput
                    type="number"
                    value={formData.yearManufactured}
                    onChange={(e) =>
                      handleInputChange("yearManufactured", e.target.value)
                    }
                    placeholder="e.g., 2020"
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </FarmFormGroup>
              </div>

              {/* Status and Condition */}
              <div className="space-y-4">
                <h3 className="farm-heading-card">Status & Condition</h3>

                <FarmFormGroup label="Status" required>
                  <FarmSelect
                    value={formData.status}
                    onChange={(e) =>
                      handleInputChange("status", e.target.value)
                    }
                    required
                  >
                    {EQUIPMENT_STATUS.map((status) => (
                      <option key={status} value={status}>
                        {status.replace("_", " ")}
                      </option>
                    ))}
                  </FarmSelect>
                </FarmFormGroup>

                <FarmFormGroup label="Condition" required>
                  <FarmSelect
                    value={formData.condition}
                    onChange={(e) =>
                      handleInputChange("condition", e.target.value)
                    }
                    required
                  >
                    {EQUIPMENT_CONDITIONS.map((condition) => (
                      <option key={condition} value={condition}>
                        {condition.replace("_", " ")}
                      </option>
                    ))}
                  </FarmSelect>
                </FarmFormGroup>

                <FarmFormGroup label="Hours Used">
                  <FarmInput
                    type="number"
                    value={formData.hoursUsed}
                    onChange={(e) =>
                      handleInputChange("hoursUsed", e.target.value)
                    }
                    placeholder="0"
                    min="0"
                    step="0.1"
                  />
                </FarmFormGroup>

                <FarmFormGroup label="Location">
                  <FarmInput
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      handleInputChange("location", e.target.value)
                    }
                    placeholder="e.g., Main Barn, Field 3"
                  />
                </FarmFormGroup>
              </div>

              {/* Financial Information */}
              <div className="space-y-4">
                <h3 className="farm-heading-card">Financial Information</h3>

                <FarmFormGroup label="Purchase Date">
                  <FarmInput
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) =>
                      handleInputChange("purchaseDate", e.target.value)
                    }
                  />
                </FarmFormGroup>

                <FarmFormGroup label="Purchase Price">
                  <FarmInput
                    type="number"
                    value={formData.purchasePrice}
                    onChange={(e) =>
                      handleInputChange("purchasePrice", e.target.value)
                    }
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </FarmFormGroup>

                <FarmFormGroup label="Current Value">
                  <FarmInput
                    type="number"
                    value={formData.currentValue}
                    onChange={(e) =>
                      handleInputChange("currentValue", e.target.value)
                    }
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </FarmFormGroup>

                <FarmFormGroup label="Daily Rental Rate">
                  <FarmInput
                    type="number"
                    value={formData.dailyRate}
                    onChange={(e) =>
                      handleInputChange("dailyRate", e.target.value)
                    }
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </FarmFormGroup>
              </div>

              {/* Technical Specifications */}
              <div className="space-y-4">
                <h3 className="farm-heading-card">Technical Specifications</h3>

                <FarmFormGroup label="Fuel Type">
                  <FarmSelect
                    value={formData.fuelType}
                    onChange={(e) =>
                      handleInputChange("fuelType", e.target.value)
                    }
                  >
                    {FUEL_TYPES.map((fuel) => (
                      <option key={fuel} value={fuel}>
                        {fuel.replace("_", " ")}
                      </option>
                    ))}
                  </FarmSelect>
                </FarmFormGroup>

                <FarmFormGroup label="Horsepower">
                  <FarmInput
                    type="number"
                    value={formData.horsepower}
                    onChange={(e) =>
                      handleInputChange("horsepower", e.target.value)
                    }
                    placeholder="e.g., 320"
                    min="0"
                    step="0.1"
                  />
                </FarmFormGroup>

                <FarmFormGroup label="Working Width (feet)">
                  <FarmInput
                    type="number"
                    value={formData.workingWidth}
                    onChange={(e) =>
                      handleInputChange("workingWidth", e.target.value)
                    }
                    placeholder="e.g., 12.5"
                    min="0"
                    step="0.1"
                  />
                </FarmFormGroup>

                <FarmFormGroup label="Weight (pounds)">
                  <FarmInput
                    type="number"
                    value={formData.weight}
                    onChange={(e) =>
                      handleInputChange("weight", e.target.value)
                    }
                    placeholder="e.g., 25000"
                    min="0"
                    step="1"
                  />
                </FarmFormGroup>
              </div>

              {/* Maintenance & Warranty */}
              <div className="space-y-4">
                <h3 className="farm-heading-card">Maintenance & Warranty</h3>

                <FarmFormGroup label="Last Service Date">
                  <FarmInput
                    type="date"
                    value={formData.lastServiceDate}
                    onChange={(e) =>
                      handleInputChange("lastServiceDate", e.target.value)
                    }
                  />
                </FarmFormGroup>

                <FarmFormGroup label="Next Service Due">
                  <FarmInput
                    type="date"
                    value={formData.nextServiceDue}
                    onChange={(e) =>
                      handleInputChange("nextServiceDue", e.target.value)
                    }
                  />
                </FarmFormGroup>

                <FarmFormGroup label="Service Interval (hours)">
                  <FarmInput
                    type="number"
                    value={formData.serviceInterval}
                    onChange={(e) =>
                      handleInputChange("serviceInterval", e.target.value)
                    }
                    placeholder="e.g., 250"
                    min="0"
                    step="1"
                  />
                </FarmFormGroup>

                <FarmFormGroup label="Insurance Expiry">
                  <FarmInput
                    type="date"
                    value={formData.insuranceExpiry}
                    onChange={(e) =>
                      handleInputChange("insuranceExpiry", e.target.value)
                    }
                  />
                </FarmFormGroup>

                <FarmFormGroup label="Warranty Expiry">
                  <FarmInput
                    type="date"
                    value={formData.warrantyExpiry}
                    onChange={(e) =>
                      handleInputChange("warrantyExpiry", e.target.value)
                    }
                  />
                </FarmFormGroup>
              </div>

              {/* Notes */}
              <div className="lg:col-span-2">
                <FarmFormGroup label="Notes">
                  <FarmTextarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Additional notes about this equipment..."
                    rows={4}
                  />
                </FarmFormGroup>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-border">
              <FarmButton
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </FarmButton>
              <FarmButton type="submit" variant="primary" loading={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Creating..." : "Create Equipment"}
              </FarmButton>
            </div>
          </FarmForm>
        </FarmCardContent>
      </FarmCard>
    </PageContainer>
  );
}
