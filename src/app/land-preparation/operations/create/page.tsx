"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tractor,
  ArrowLeft,
  Save,
  AlertTriangle,
  Calendar,
  DollarSign,
  Gauge,
  Ruler,
  Fuel,
  Target,
  MapPin,
} from "lucide-react";
import { format } from "date-fns";

interface Field {
  id: string;
  name: string;
  area: number;
}

interface Equipment {
  id: string;
  name: string;
  equipmentType: string;
  category: string;
  status: string;
}

interface OperationFormData {
  operationType: string;
  operationDate: string;
  fieldId: string;
  equipmentId: string;
  depth: number;
  speed: number;
  area: number;
  status: string;
  cost: number;
  fuelUsed: number;
  effectiveness?: number;
  notes?: string;
  weatherConditions?: string;
  soilMoisture?: string;
}

const OPERATION_TYPES = [
  "PRIMARY_TILLAGE",
  "SECONDARY_TILLAGE",
  "DEEP_TILLAGE",
  "CHISEL_PLOW",
  "DISK_HARROW",
  "FIELD_CULTIVATOR",
  "ROTARY_TILLER",
  "SUBSOILER",
  "STRIP_TILL",
  "NO_TILL",
];

const OPERATION_STATUS = [
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "DELAYED",
  "CANCELLED",
];

const SOIL_MOISTURE_LEVELS = ["TOO_WET", "OPTIMAL", "TOO_DRY", "UNKNOWN"];

export default function CreateTillageOperation() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [fields, setFields] = useState<Field[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<OperationFormData>({
    operationType: "",
    operationDate: format(new Date(), "yyyy-MM-dd"),
    fieldId: "",
    equipmentId: "",
    depth: 0,
    speed: 0,
    area: 0,
    status: "PLANNED",
    cost: 0,
    fuelUsed: 0,
    effectiveness: undefined,
    notes: "",
    weatherConditions: "",
    soilMoisture: "OPTIMAL",
  });

  useEffect(() => {
    if (isLoaded && user) {
      fetchFormData();
    }
  }, [isLoaded, user]);

  const fetchFormData = async () => {
    try {
      setLoading(true);

      const [fieldsResponse, equipmentResponse] = await Promise.all([
        fetch("/api/fields"),
        fetch("/api/land-preparation/equipment"),
      ]);

      if (!fieldsResponse.ok || !equipmentResponse.ok) {
        throw new Error("Failed to fetch form data");
      }

      const fieldsData = await fieldsResponse.json();
      const equipmentData = await equipmentResponse.json();

      setFields(fieldsData.data?.fields || []);
      setEquipment(
        equipmentData.data?.equipment?.filter(
          (eq: Equipment) => eq.status === "ACTIVE" || eq.status === "IDLE"
        ) || []
      );

      setError(null);
    } catch (error) {
      console.error("Error fetching form data:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch form data"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    name: string,
    value: string | number | undefined
  ) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-fill area from selected field
    if (name === "fieldId" && value) {
      const selectedField = fields.find((f) => f.id === value);
      if (selectedField && !formData.area) {
        setFormData((prev) => ({
          ...prev,
          area: selectedField.area,
        }));
      }
    }
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.operationType) errors.push("Operation type is required");
    if (!formData.operationDate) errors.push("Operation date is required");
    if (!formData.fieldId) errors.push("Field selection is required");
    if (!formData.equipmentId) errors.push("Equipment selection is required");
    if (formData.depth <= 0) errors.push("Depth must be greater than 0");
    if (formData.speed <= 0) errors.push("Speed must be greater than 0");
    if (formData.area <= 0) errors.push("Area must be greater than 0");
    if (formData.cost < 0) errors.push("Cost cannot be negative");
    if (formData.fuelUsed < 0) errors.push("Fuel used cannot be negative");
    if (
      formData.effectiveness &&
      (formData.effectiveness < 1 || formData.effectiveness > 10)
    ) {
      errors.push("Effectiveness must be between 1 and 10");
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(", "));
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch("/api/land-preparation/tillage-operations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          depth: Number(formData.depth),
          speed: Number(formData.speed),
          area: Number(formData.area),
          cost: Number(formData.cost),
          fuelUsed: Number(formData.fuelUsed),
          effectiveness: formData.effectiveness
            ? Number(formData.effectiveness)
            : undefined,
          operationDate: new Date(formData.operationDate).toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create operation");
      }

      router.push("/land-preparation");
    } catch (error) {
      console.error("Error creating operation:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create operation"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading form...</p>
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
            Please sign in to create tillage operations.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          onClick={() => router.push("/land-preparation")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <Tractor className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Log Tillage Operation
          </h1>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Basic Information</h3>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="operationType">Operation Type</Label>
                <Select
                  value={formData.operationType}
                  onValueChange={(value) =>
                    handleInputChange("operationType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select operation type" />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type
                          .replace("_", " ")
                          .toLowerCase()
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="operationDate">Operation Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="operationDate"
                    type="date"
                    value={formData.operationDate}
                    onChange={(e) =>
                      handleInputChange("operationDate", e.target.value)
                    }
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="fieldId">Field</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400 z-10" />
                  <Select
                    value={formData.fieldId}
                    onValueChange={(value) =>
                      handleInputChange("fieldId", value)
                    }
                  >
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {fields.map((field) => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.name} ({field.area} acres)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="equipmentId">Equipment</Label>
                <Select
                  value={formData.equipmentId}
                  onValueChange={(value) =>
                    handleInputChange("equipmentId", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select equipment" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipment.map((eq) => (
                      <SelectItem key={eq.id} value={eq.id}>
                        {eq.name} ({eq.equipmentType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATION_STATUS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status
                          .replace("_", " ")
                          .toLowerCase()
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Operation Details */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Operation Details</h3>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="depth">Depth (inches)</Label>
                  <div className="relative">
                    <Ruler className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="depth"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.depth}
                      onChange={(e) =>
                        handleInputChange(
                          "depth",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="speed">Speed (mph)</Label>
                  <div className="relative">
                    <Gauge className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="speed"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.speed}
                      onChange={(e) =>
                        handleInputChange(
                          "speed",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="area">Area (acres)</Label>
                <Input
                  id="area"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.area}
                  onChange={(e) =>
                    handleInputChange("area", parseFloat(e.target.value) || 0)
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cost">Cost ($)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.cost}
                      onChange={(e) =>
                        handleInputChange(
                          "cost",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="fuelUsed">Fuel Used (gallons)</Label>
                  <div className="relative">
                    <Fuel className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="fuelUsed"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.fuelUsed}
                      onChange={(e) =>
                        handleInputChange(
                          "fuelUsed",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="effectiveness">
                  Effectiveness (1-10, optional)
                </Label>
                <div className="relative">
                  <Target className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="effectiveness"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.effectiveness || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "effectiveness",
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                    className="pl-10"
                    placeholder="Rate 1-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <h3 className="text-lg font-semibold">Additional Information</h3>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="soilMoisture">Soil Moisture</Label>
                  <Select
                    value={formData.soilMoisture}
                    onValueChange={(value) =>
                      handleInputChange("soilMoisture", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select soil moisture level" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOIL_MOISTURE_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level
                            .replace("_", " ")
                            .toLowerCase()
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="weatherConditions">Weather Conditions</Label>
                  <Input
                    id="weatherConditions"
                    value={formData.weatherConditions}
                    onChange={(e) =>
                      handleInputChange("weatherConditions", e.target.value)
                    }
                    placeholder="e.g., Sunny, 72°F, light wind"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Additional notes about the operation..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end mt-8">
          <Button
            type="submit"
            disabled={submitting}
            className="bg-green-600 hover:bg-green-700 px-8"
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Operation
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
