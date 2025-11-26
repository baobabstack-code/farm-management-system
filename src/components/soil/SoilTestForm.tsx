"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SoilTestType } from "@/types";

interface SoilFormData {
  cropId: string;
  fieldId: string;
  sampleDate: string;
  labName: string;
  testType: SoilTestType;
  pH: number;
  organicMatter: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  calcium: number;
  magnesium: number;
  sulfur: number;
  cationExchangeCapacity: number;
  soilTexture: string;
  recommendations: string;
  cost: number;
  notes: string;
}

interface SoilTestFormProps {
  onSubmit: (data: SoilFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface Crop {
  id: string;
  name: string;
  variety?: string;
}

interface Field {
  id: string;
  name: string;
}

export default function SoilTestForm({
  onSubmit,
  onCancel,
  loading = false,
}: SoilTestFormProps) {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [formData, setFormData] = useState<SoilFormData>({
    cropId: "",
    fieldId: "",
    sampleDate: new Date().toISOString().split("T")[0],
    labName: "",
    testType: SoilTestType.BASIC,
    pH: 7.0,
    organicMatter: 3.0,
    nitrogen: 30.0,
    phosphorus: 25.0,
    potassium: 200.0,
    calcium: 1000.0,
    magnesium: 150.0,
    sulfur: 10.0,
    cationExchangeCapacity: 15.0,
    soilTexture: "Loam",
    recommendations: "",
    cost: 0,
    notes: "",
  });

  useEffect(() => {
    fetchCrops();
    fetchFields();
  }, []);

  const fetchCrops = async () => {
    try {
      const response = await fetch("/api/crops");
      if (response.ok) {
        const result = await response.json();
        setCrops(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching crops:", error);
    }
  };

  const fetchFields = async () => {
    try {
      const response = await fetch("/api/fields");
      if (response.ok) {
        const result = await response.json();
        setFields(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching fields:", error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (
    field: keyof SoilFormData,
    value: SoilFormData[keyof SoilFormData]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">New Soil Test</h2>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sample Date *
              </label>
              <Input
                type="date"
                value={formData.sampleDate}
                onChange={(e) =>
                  handleInputChange("sampleDate", e.target.value)
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Laboratory Name *
              </label>
              <Input
                type="text"
                value={formData.labName}
                onChange={(e) => handleInputChange("labName", e.target.value)}
                placeholder="Enter laboratory name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Type
              </label>
              <select
                value={formData.testType}
                onChange={(e) => handleInputChange("testType", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.values(SoilTestType).map((type) => (
                  <option key={type} value={type}>
                    {type.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost ($)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.cost}
                onChange={(e) =>
                  handleInputChange("cost", parseFloat(e.target.value) || 0)
                }
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Field and Crop Association */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field (Optional)
              </label>
              <select
                value={formData.fieldId}
                onChange={(e) => handleInputChange("fieldId", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a field</option>
                {fields.map((field) => (
                  <option key={field.id} value={field.id}>
                    {field.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Crop (Optional)
              </label>
              <select
                value={formData.cropId}
                onChange={(e) => handleInputChange("cropId", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a crop</option>
                {crops.map((crop) => (
                  <option key={crop.id} value={crop.id}>
                    {crop.name} {crop.variety ? `(${crop.variety})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Soil Properties */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Soil Properties</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  pH *
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="14"
                  value={formData.pH}
                  onChange={(e) =>
                    handleInputChange("pH", parseFloat(e.target.value) || 0)
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organic Matter (%) *
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.organicMatter}
                  onChange={(e) =>
                    handleInputChange(
                      "organicMatter",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Soil Texture *
                </label>
                <select
                  value={formData.soilTexture}
                  onChange={(e) =>
                    handleInputChange("soilTexture", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="Sand">Sand</option>
                  <option value="Loamy Sand">Loamy Sand</option>
                  <option value="Sandy Loam">Sandy Loam</option>
                  <option value="Loam">Loam</option>
                  <option value="Silt Loam">Silt Loam</option>
                  <option value="Silt">Silt</option>
                  <option value="Sandy Clay Loam">Sandy Clay Loam</option>
                  <option value="Clay Loam">Clay Loam</option>
                  <option value="Silty Clay Loam">Silty Clay Loam</option>
                  <option value="Sandy Clay">Sandy Clay</option>
                  <option value="Silty Clay">Silty Clay</option>
                  <option value="Clay">Clay</option>
                </select>
              </div>
            </div>
          </div>

          {/* Nutrients */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Nutrient Levels</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nitrogen (ppm) *
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.nitrogen}
                  onChange={(e) =>
                    handleInputChange(
                      "nitrogen",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phosphorus (ppm) *
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.phosphorus}
                  onChange={(e) =>
                    handleInputChange(
                      "phosphorus",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Potassium (ppm) *
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.potassium}
                  onChange={(e) =>
                    handleInputChange(
                      "potassium",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calcium (ppm) *
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.calcium}
                  onChange={(e) =>
                    handleInputChange(
                      "calcium",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Magnesium (ppm) *
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.magnesium}
                  onChange={(e) =>
                    handleInputChange(
                      "magnesium",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sulfur (ppm) *
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.sulfur}
                  onChange={(e) =>
                    handleInputChange("sulfur", parseFloat(e.target.value) || 0)
                  }
                  required
                />
              </div>
            </div>
          </div>

          {/* Additional Properties */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cation Exchange Capacity *
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.cationExchangeCapacity}
                  onChange={(e) =>
                    handleInputChange(
                      "cationExchangeCapacity",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  required
                />
              </div>
            </div>
          </div>

          {/* Lab Recommendations and Notes */}
          <div className="mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lab Recommendations
                </label>
                <textarea
                  value={formData.recommendations}
                  onChange={(e) =>
                    handleInputChange("recommendations", e.target.value)
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter laboratory recommendations"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional notes"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? "Creating..." : "Create Soil Test"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
