"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Save, X, Loader2, AlertCircle } from "lucide-react";

interface Field {
  id?: string;
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
}

interface FieldFormProps {
  field?: Field;
  onSave?: (field: Field) => void;
  onCancel?: () => void;
  isOpen?: boolean;
  mode?: "create" | "edit";
}

const soilTypes = [
  "Clay",
  "Sandy",
  "Loam",
  "Silt",
  "Clay Loam",
  "Sandy Loam",
  "Silt Loam",
  "Sandy Clay",
  "Sandy Clay Loam",
  "Silty Clay",
  "Silty Clay Loam",
];

const drainageTypes = [
  "Well Drained",
  "Moderately Well Drained",
  "Somewhat Poorly Drained",
  "Poorly Drained",
  "Very Poorly Drained",
];

const irrigationTypes = [
  "Center Pivot",
  "Drip Irrigation",
  "Sprinkler",
  "Flood Irrigation",
  "Furrow Irrigation",
  "Rain-fed",
  "Other",
];

const units = ["acres", "hectares", "square feet", "square meters"];

export default function FieldForm({
  field,
  onSave,
  onCancel,
  isOpen = true,
  mode = "create",
}: FieldFormProps) {
  const [formData, setFormData] = useState<Field>({
    name: field?.name || "",
    description: field?.description || "",
    area: field?.area || 0,
    unit: field?.unit || "acres",
    latitude: field?.latitude || undefined,
    longitude: field?.longitude || undefined,
    address: field?.address || "",
    soilType: field?.soilType || "",
    drainageType: field?.drainageType || "",
    irrigationType: field?.irrigationType || "",
    isActive: field?.isActive ?? true,
    ...field,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: keyof Field, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return "Field name is required";
    }
    if (formData.area <= 0) {
      return "Area must be greater than 0";
    }
    if (
      formData.latitude &&
      (formData.latitude < -90 || formData.latitude > 90)
    ) {
      return "Latitude must be between -90 and 90";
    }
    if (
      formData.longitude &&
      (formData.longitude < -180 || formData.longitude > 180)
    ) {
      return "Longitude must be between -180 and 180";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const url =
        mode === "edit" && formData.id
          ? `/api/fields/${formData.id}`
          : "/api/fields";

      const method = mode === "edit" ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save field");
      }

      const savedField = await response.json();
      setSuccess(true);

      setTimeout(() => {
        if (onSave) {
          onSave(savedField);
        }
      }, 1000);
    } catch (error) {
      console.error("Error saving field:", error);
      setError(error instanceof Error ? error.message : "Failed to save field");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Field {mode === "edit" ? "Updated" : "Created"} Successfully!
            </h3>
            <p className="text-gray-600">
              Your field &quot;{formData.name}&quot; has been{" "}
              {mode === "edit" ? "updated" : "created"}.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-2xl my-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {mode === "edit" ? "Edit Field" : "Add New Field"}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={loading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Field Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., North Pasture"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.isActive ? "active" : "inactive"}
                  onChange={(e) =>
                    handleInputChange("isActive", e.target.value === "active")
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  disabled={loading}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.area}
                  onChange={(e) =>
                    handleInputChange("area", parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="0.00"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => handleInputChange("unit", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  disabled={loading}
                >
                  {units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Optional description of the field..."
                disabled={loading}
              />
            </div>

            {/* Location */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Location
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="123 Farm Road, City, State"
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="-90"
                      max="90"
                      value={formData.latitude || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "latitude",
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="e.g., 40.7128"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="-180"
                      max="180"
                      value={formData.longitude || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "longitude",
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="e.g., -74.0060"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Field Characteristics */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Field Characteristics
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Soil Type
                  </label>
                  <select
                    value={formData.soilType}
                    onChange={(e) =>
                      handleInputChange("soilType", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    disabled={loading}
                  >
                    <option value="">Select soil type</option>
                    {soilTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Drainage
                  </label>
                  <select
                    value={formData.drainageType}
                    onChange={(e) =>
                      handleInputChange("drainageType", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    disabled={loading}
                  >
                    <option value="">Select drainage</option>
                    {drainageTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Irrigation
                  </label>
                  <select
                    value={formData.irrigationType}
                    onChange={(e) =>
                      handleInputChange("irrigationType", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    disabled={loading}
                  >
                    <option value="">Select irrigation</option>
                    {irrigationTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {mode === "edit" ? "Update Field" : "Create Field"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
