"use client";

import { useState } from "react";
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
  Wrench,
  ArrowLeft,
  Save,
  AlertTriangle,
  DollarSign,
  Calendar,
  Settings,
  Hash,
} from "lucide-react";
import { format } from "date-fns";

interface EquipmentFormData {
  name: string;
  equipmentType: string;
  category: string;
  manufacturer?: string;
  model?: string;
  year?: number;
  serialNumber?: string;
  status: string;
  condition: string;
  purchasePrice?: number;
  currentValue?: number;
  purchaseDate?: string;
  hoursUsed: number;
  lastServiceDate?: string;
  nextServiceDue?: string;
  serviceInterval?: number;
  notes?: string;
}

const EQUIPMENT_CATEGORIES = [
  "TRACTOR",
  "IMPLEMENT",
  "HARVESTER",
  "PLANTER",
  "CULTIVATOR",
  "OTHER",
];

const EQUIPMENT_TYPES = [
  "TRACTOR",
  "PLOW",
  "HARROW",
  "CULTIVATOR",
  "PLANTER",
  "COMBINE",
  "SPRAYER",
  "MOWER",
  "RAKE",
  "BALER",
  "SPREADER",
  "SEEDER",
  "CHISEL_PLOW",
  "DISK_HARROW",
  "FIELD_CULTIVATOR",
  "SUBSOILER",
  "ROTARY_TILLER",
  "OTHER",
];

const EQUIPMENT_STATUS = ["ACTIVE", "IDLE", "MAINTENANCE", "RETIRED"];

const EQUIPMENT_CONDITIONS = [
  "EXCELLENT",
  "GOOD",
  "FAIR",
  "POOR",
  "NEEDS_REPAIR",
];

export default function AddEquipment() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<EquipmentFormData>({
    name: "",
    equipmentType: "",
    category: "",
    manufacturer: "",
    model: "",
    year: undefined,
    serialNumber: "",
    status: "ACTIVE",
    condition: "GOOD",
    purchasePrice: undefined,
    currentValue: undefined,
    purchaseDate: "",
    hoursUsed: 0,
    lastServiceDate: "",
    nextServiceDue: "",
    serviceInterval: undefined,
    notes: "",
  });

  const handleInputChange = (name: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.name.trim()) errors.push("Equipment name is required");
    if (!formData.equipmentType) errors.push("Equipment type is required");
    if (!formData.category) errors.push("Category is required");
    if (
      formData.year &&
      (formData.year < 1900 || formData.year > new Date().getFullYear() + 1)
    ) {
      errors.push("Year must be between 1900 and next year");
    }
    if (formData.purchasePrice && formData.purchasePrice < 0) {
      errors.push("Purchase price cannot be negative");
    }
    if (formData.currentValue && formData.currentValue < 0) {
      errors.push("Current value cannot be negative");
    }
    if (formData.hoursUsed < 0) {
      errors.push("Hours used cannot be negative");
    }
    if (formData.serviceInterval && formData.serviceInterval <= 0) {
      errors.push("Service interval must be greater than 0");
    }

    return errors;
  };

  const calculateNextServiceDue = (): string | undefined => {
    if (!formData.lastServiceDate || !formData.serviceInterval)
      return undefined;

    const lastService = new Date(formData.lastServiceDate);
    const nextService = new Date(lastService);
    nextService.setDate(nextService.getDate() + formData.serviceInterval);

    return format(nextService, "yyyy-MM-dd");
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

      const submitData = {
        ...formData,
        year: formData.year || undefined,
        purchasePrice: formData.purchasePrice || undefined,
        currentValue: formData.currentValue || undefined,
        purchaseDate: formData.purchaseDate
          ? new Date(formData.purchaseDate).toISOString()
          : undefined,
        lastServiceDate: formData.lastServiceDate
          ? new Date(formData.lastServiceDate).toISOString()
          : undefined,
        nextServiceDue: formData.nextServiceDue
          ? new Date(formData.nextServiceDue).toISOString()
          : calculateNextServiceDue()
            ? new Date(calculateNextServiceDue()!).toISOString()
            : undefined,
        serviceInterval: formData.serviceInterval || undefined,
        hoursUsed: Number(formData.hoursUsed),
        manufacturer: formData.manufacturer || undefined,
        model: formData.model || undefined,
        serialNumber: formData.serialNumber || undefined,
        notes: formData.notes || undefined,
      };

      const response = await fetch("/api/land-preparation/equipment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add equipment");
      }

      router.push("/land-preparation/equipment");
    } catch (error) {
      console.error("Error adding equipment:", error);
      setError(
        error instanceof Error ? error.message : "Failed to add equipment"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
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
          <AlertDescription>Please sign in to add equipment.</AlertDescription>
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
          onClick={() => router.push("/land-preparation/equipment")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <Wrench className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">Add Equipment</h1>
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
                <Label htmlFor="name">Equipment Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., John Deere 8320R"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    handleInputChange("category", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category
                          .replace("_", " ")
                          .toLowerCase()
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="equipmentType">Equipment Type *</Label>
                <Select
                  value={formData.equipmentType}
                  onValueChange={(value) =>
                    handleInputChange("equipmentType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select equipment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_TYPES.map((type) => (
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      handleInputChange("status", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {EQUIPMENT_STATUS.map((status) => (
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

                <div>
                  <Label htmlFor="condition">Condition</Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value) =>
                      handleInputChange("condition", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {EQUIPMENT_CONDITIONS.map((condition) => (
                        <SelectItem key={condition} value={condition}>
                          {condition
                            .replace("_", " ")
                            .toLowerCase()
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Information */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Detailed Information</h3>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) =>
                    handleInputChange("manufacturer", e.target.value)
                  }
                  placeholder="e.g., John Deere, Case IH"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => handleInputChange("model", e.target.value)}
                    placeholder="e.g., 8320R"
                  />
                </div>

                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    value={formData.year || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "year",
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                    placeholder={new Date().getFullYear().toString()}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="serialNumber">Serial Number</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="serialNumber"
                    value={formData.serialNumber}
                    onChange={(e) =>
                      handleInputChange("serialNumber", e.target.value)
                    }
                    className="pl-10"
                    placeholder="Enter serial number"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="hoursUsed">Hours Used</Label>
                <Input
                  id="hoursUsed"
                  type="number"
                  min="0"
                  value={formData.hoursUsed}
                  onChange={(e) =>
                    handleInputChange(
                      "hoursUsed",
                      parseInt(e.target.value) || 0
                    )
                  }
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Financial Information</h3>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) =>
                      handleInputChange("purchaseDate", e.target.value)
                    }
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="purchasePrice">Purchase Price</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="purchasePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchasePrice || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "purchasePrice",
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                    className="pl-10"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="currentValue">Current Value</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="currentValue"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.currentValue || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "currentValue",
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                    className="pl-10"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Information */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Maintenance Information</h3>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="lastServiceDate">Last Service Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="lastServiceDate"
                    type="date"
                    value={formData.lastServiceDate}
                    onChange={(e) =>
                      handleInputChange("lastServiceDate", e.target.value)
                    }
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="serviceInterval">Service Interval (days)</Label>
                <div className="relative">
                  <Settings className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="serviceInterval"
                    type="number"
                    min="1"
                    value={formData.serviceInterval || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "serviceInterval",
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                    className="pl-10"
                    placeholder="e.g., 90"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="nextServiceDue">Next Service Due</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="nextServiceDue"
                    type="date"
                    value={formData.nextServiceDue}
                    onChange={(e) =>
                      handleInputChange("nextServiceDue", e.target.value)
                    }
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Will auto-calculate if service interval is set
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <h3 className="text-lg font-semibold">Additional Notes</h3>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Additional notes about this equipment..."
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
                Adding Equipment...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Add Equipment
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
