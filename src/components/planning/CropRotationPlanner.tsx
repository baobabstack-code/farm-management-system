"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Recycle,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Calendar,
  Leaf,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

interface RotationPhase {
  id?: string;
  phaseNumber: number;
  cropName: string;
  variety?: string;
  plantingWindow: string;
  expectedDuration: number;
  soilRequirements?: any;
  nutrients?: any;
  waterRequirements?: number;
  laborRequirements?: number;
  expectedYield?: number;
  marketValue?: number;
  notes?: string;
}

interface SoilBenefit {
  id?: string;
  benefitType: string;
  description: string;
  measurableImpact?: string;
  timeFrame: string;
}

interface CropRotationPlan {
  id?: string;
  fieldId: string;
  planId?: string;
  rotationName: string;
  description?: string;
  rotationYears: number;
  startYear: number;
  rotationType: string;
  currentPhase: number;
  isActive: boolean;
  rotationPhases: RotationPhase[];
  soilBenefits: SoilBenefit[];
  field?: {
    id: string;
    name: string;
    area: number;
    unit: string;
    soilType?: string;
  };
}

interface Field {
  id: string;
  name: string;
  area: number;
  unit: string;
  soilType?: string;
}

interface CropRotationPlannerProps {
  planId?: string;
  fieldId?: string;
  onSave?: (rotation: CropRotationPlan) => void;
  onCancel?: () => void;
  existingRotation?: CropRotationPlan;
}

const rotationTypes = [
  {
    value: "SEQUENTIAL",
    label: "Sequential",
    description: "One crop after another in sequence",
  },
  {
    value: "INTERCROPPING",
    label: "Intercropping",
    description: "Multiple crops grown together",
  },
  {
    value: "COVER_CROP",
    label: "Cover Crop",
    description: "Including cover crops for soil health",
  },
  {
    value: "FALLOW",
    label: "Fallow",
    description: "Including fallow periods for soil rest",
  },
  {
    value: "MIXED",
    label: "Mixed",
    description: "Combination of different approaches",
  },
];

const soilBenefitTypes = [
  { value: "NITROGEN_FIXATION", label: "Nitrogen Fixation", icon: "🌱" },
  { value: "ORGANIC_MATTER", label: "Organic Matter", icon: "🌿" },
  { value: "EROSION_CONTROL", label: "Erosion Control", icon: "🛡️" },
  { value: "PEST_SUPPRESSION", label: "Pest Suppression", icon: "🐛" },
  { value: "WEED_SUPPRESSION", label: "Weed Suppression", icon: "🌾" },
  { value: "SOIL_STRUCTURE", label: "Soil Structure", icon: "🏗️" },
  { value: "WATER_RETENTION", label: "Water Retention", icon: "💧" },
  { value: "NUTRIENT_CYCLING", label: "Nutrient Cycling", icon: "♻️" },
];

const plantingWindows = [
  "Early Spring",
  "Late Spring",
  "Early Summer",
  "Mid Summer",
  "Late Summer",
  "Early Fall",
  "Late Fall",
  "Winter",
];

const cropSuggestions = [
  "Corn",
  "Soybeans",
  "Wheat",
  "Barley",
  "Oats",
  "Rye",
  "Alfalfa",
  "Clover",
  "Ryegrass",
  "Buckwheat",
  "Sunflower",
  "Canola",
  "Peas",
  "Beans",
];

export default function CropRotationPlanner({
  planId,
  fieldId,
  onSave,
  onCancel,
  existingRotation,
}: CropRotationPlannerProps) {
  const [fields, setFields] = useState<Field[]>([]);
  const [rotationData, setRotationData] = useState<Partial<CropRotationPlan>>({
    fieldId: fieldId || "",
    planId,
    rotationName: "",
    description: "",
    rotationYears: 4,
    startYear: new Date().getFullYear(),
    rotationType: "SEQUENTIAL",
    currentPhase: 1,
    isActive: true,
    rotationPhases: [],
    soilBenefits: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"phases" | "benefits">("phases");

  useEffect(() => {
    fetchFields();
    if (existingRotation) {
      setRotationData(existingRotation);
    } else {
      // Initialize with default phases
      setRotationData((prev) => ({
        ...prev,
        rotationPhases: Array.from(
          { length: prev.rotationYears || 4 },
          (_, i) => ({
            phaseNumber: i + 1,
            cropName: "",
            plantingWindow: "Early Spring",
            expectedDuration: 365 / (prev.rotationYears || 4),
          })
        ),
      }));
    }
  }, [existingRotation]);

  const fetchFields = async () => {
    try {
      const response = await fetch("/api/fields");
      if (!response.ok) throw new Error("Failed to fetch fields");
      const data = await response.json();
      setFields(data);
    } catch (error) {
      console.error("Error fetching fields:", error);
    }
  };

  const updateRotationYears = (years: number) => {
    const currentPhases = rotationData.rotationPhases || [];
    let newPhases: RotationPhase[];

    if (years > currentPhases.length) {
      // Add new phases
      newPhases = [...currentPhases];
      for (let i = currentPhases.length; i < years; i++) {
        newPhases.push({
          phaseNumber: i + 1,
          cropName: "",
          plantingWindow: "Early Spring",
          expectedDuration: 365 / years,
        });
      }
    } else {
      // Remove excess phases
      newPhases = currentPhases.slice(0, years);
    }

    setRotationData((prev) => ({
      ...prev,
      rotationYears: years,
      rotationPhases: newPhases,
    }));
  };

  const updatePhase = (phaseIndex: number, updates: Partial<RotationPhase>) => {
    const newPhases = [...(rotationData.rotationPhases || [])];
    newPhases[phaseIndex] = { ...newPhases[phaseIndex], ...updates };
    setRotationData((prev) => ({ ...prev, rotationPhases: newPhases }));
  };

  const addSoilBenefit = () => {
    const newBenefit: SoilBenefit = {
      benefitType: "NITROGEN_FIXATION",
      description: "",
      timeFrame: "1 year",
    };
    setRotationData((prev) => ({
      ...prev,
      soilBenefits: [...(prev.soilBenefits || []), newBenefit],
    }));
  };

  const updateSoilBenefit = (
    benefitIndex: number,
    updates: Partial<SoilBenefit>
  ) => {
    const newBenefits = [...(rotationData.soilBenefits || [])];
    newBenefits[benefitIndex] = { ...newBenefits[benefitIndex], ...updates };
    setRotationData((prev) => ({ ...prev, soilBenefits: newBenefits }));
  };

  const removeSoilBenefit = (benefitIndex: number) => {
    const newBenefits = [...(rotationData.soilBenefits || [])];
    newBenefits.splice(benefitIndex, 1);
    setRotationData((prev) => ({ ...prev, soilBenefits: newBenefits }));
  };

  const validateRotation = () => {
    if (!rotationData.rotationName?.trim()) {
      return "Rotation name is required";
    }
    if (!rotationData.fieldId) {
      return "Please select a field";
    }
    if (
      !rotationData.rotationPhases ||
      rotationData.rotationPhases.length < 2
    ) {
      return "At least 2 rotation phases are required";
    }
    if (rotationData.rotationPhases.some((phase) => !phase.cropName.trim())) {
      return "All phases must have a crop name";
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validateRotation();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = existingRotation
        ? `/api/planning/crop-rotation/${existingRotation.id}`
        : "/api/planning/crop-rotation";

      const method = existingRotation ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rotationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save rotation plan");
      }

      const savedRotation = await response.json();

      if (onSave) {
        onSave(savedRotation.data);
      }
    } catch (error) {
      console.error("Error saving rotation plan:", error);
      setError(
        error instanceof Error ? error.message : "Failed to save rotation plan"
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedField = fields.find((f) => f.id === rotationData.fieldId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Recycle className="w-6 h-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            {existingRotation ? "Edit" : "Create"} Crop Rotation Plan
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : "Save Rotation"}
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Basic Information</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rotation Name *
              </label>
              <input
                type="text"
                value={rotationData.rotationName || ""}
                onChange={(e) =>
                  setRotationData((prev) => ({
                    ...prev,
                    rotationName: e.target.value,
                  }))
                }
                placeholder="e.g., Corn-Soybean Rotation"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Field *
              </label>
              <select
                value={rotationData.fieldId || ""}
                onChange={(e) =>
                  setRotationData((prev) => ({
                    ...prev,
                    fieldId: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={!!fieldId}
              >
                <option value="">Select a field</option>
                {fields.map((field) => (
                  <option key={field.id} value={field.id}>
                    {field.name} ({field.area} {field.unit})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rotation Years
              </label>
              <select
                value={rotationData.rotationYears || 4}
                onChange={(e) => updateRotationYears(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {[2, 3, 4, 5, 6, 7, 8].map((years) => (
                  <option key={years} value={years}>
                    {years} Years
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Year
              </label>
              <input
                type="number"
                value={rotationData.startYear || new Date().getFullYear()}
                onChange={(e) =>
                  setRotationData((prev) => ({
                    ...prev,
                    startYear: parseInt(e.target.value),
                  }))
                }
                min={new Date().getFullYear()}
                max={new Date().getFullYear() + 10}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rotation Type
              </label>
              <select
                value={rotationData.rotationType || "SEQUENTIAL"}
                onChange={(e) =>
                  setRotationData((prev) => ({
                    ...prev,
                    rotationType: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {rotationTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={rotationData.description || ""}
              onChange={(e) =>
                setRotationData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
              placeholder="Describe the rotation strategy and goals..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {selectedField && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Field Info:</strong> {selectedField.name} -{" "}
                {selectedField.area} {selectedField.unit}
                {selectedField.soilType && ` - ${selectedField.soilType} soil`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex space-x-1 border-b">
        {[
          {
            id: "phases",
            label: "Rotation Phases",
            icon: <Calendar className="w-4 h-4" />,
          },
          {
            id: "benefits",
            label: "Soil Benefits",
            icon: <Leaf className="w-4 h-4" />,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? "bg-green-100 text-green-700 border-b-2 border-green-600"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Rotation Phases */}
      {activeTab === "phases" && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Rotation Phases</h3>
            <p className="text-sm text-gray-600">
              Define the crops and timing for each phase of the rotation.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {(rotationData.rotationPhases || []).map((phase, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-green-100 text-green-800">
                        Phase {phase.phaseNumber}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        Year{" "}
                        {(((rotationData.startYear ||
                          new Date().getFullYear()) +
                          index -
                          1) %
                          (rotationData.rotationYears || 4)) +
                          1}
                      </span>
                    </div>
                    {index < (rotationData.rotationPhases || []).length - 1 && (
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Crop *
                      </label>
                      <input
                        type="text"
                        value={phase.cropName}
                        onChange={(e) =>
                          updatePhase(index, { cropName: e.target.value })
                        }
                        placeholder="e.g., Corn"
                        list={`crops-${index}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                      <datalist id={`crops-${index}`}>
                        {cropSuggestions.map((crop) => (
                          <option key={crop} value={crop} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Variety
                      </label>
                      <input
                        type="text"
                        value={phase.variety || ""}
                        onChange={(e) =>
                          updatePhase(index, { variety: e.target.value })
                        }
                        placeholder="e.g., Pioneer 1234"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Planting Window
                      </label>
                      <select
                        value={phase.plantingWindow}
                        onChange={(e) =>
                          updatePhase(index, { plantingWindow: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        {plantingWindows.map((window) => (
                          <option key={window} value={window}>
                            {window}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration (days)
                      </label>
                      <input
                        type="number"
                        value={phase.expectedDuration}
                        onChange={(e) =>
                          updatePhase(index, {
                            expectedDuration: parseInt(e.target.value) || 0,
                          })
                        }
                        min={1}
                        max={365}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expected Yield
                      </label>
                      <input
                        type="number"
                        value={phase.expectedYield || ""}
                        onChange={(e) =>
                          updatePhase(index, {
                            expectedYield:
                              parseFloat(e.target.value) || undefined,
                          })
                        }
                        step="0.1"
                        min={0}
                        placeholder="tons/acre"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Market Value ($)
                      </label>
                      <input
                        type="number"
                        value={phase.marketValue || ""}
                        onChange={(e) =>
                          updatePhase(index, {
                            marketValue:
                              parseFloat(e.target.value) || undefined,
                          })
                        }
                        step="0.01"
                        min={0}
                        placeholder="per unit"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Labor Hours
                      </label>
                      <input
                        type="number"
                        value={phase.laborRequirements || ""}
                        onChange={(e) =>
                          updatePhase(index, {
                            laborRequirements:
                              parseFloat(e.target.value) || undefined,
                          })
                        }
                        step="0.1"
                        min={0}
                        placeholder="hours"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={phase.notes || ""}
                      onChange={(e) =>
                        updatePhase(index, { notes: e.target.value })
                      }
                      rows={2}
                      placeholder="Special requirements, considerations..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Soil Benefits */}
      {activeTab === "benefits" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Soil Benefits</h3>
                <p className="text-sm text-gray-600">
                  Document the expected soil health benefits from this rotation.
                </p>
              </div>
              <Button onClick={addSoilBenefit} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Benefit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(rotationData.soilBenefits || []).length === 0 ? (
                <div className="text-center py-8">
                  <Leaf className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No soil benefits added yet.</p>
                  <p className="text-sm text-gray-400">
                    Add expected benefits from your rotation plan.
                  </p>
                </div>
              ) : (
                (rotationData.soilBenefits || []).map((benefit, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {
                            soilBenefitTypes.find(
                              (t) => t.value === benefit.benefitType
                            )?.icon
                          }
                        </span>
                        <h4 className="font-medium">
                          {
                            soilBenefitTypes.find(
                              (t) => t.value === benefit.benefitType
                            )?.label
                          }
                        </h4>
                      </div>
                      <Button
                        onClick={() => removeSoilBenefit(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Benefit Type
                        </label>
                        <select
                          value={benefit.benefitType}
                          onChange={(e) =>
                            updateSoilBenefit(index, {
                              benefitType: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          {soilBenefitTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Time Frame
                        </label>
                        <input
                          type="text"
                          value={benefit.timeFrame}
                          onChange={(e) =>
                            updateSoilBenefit(index, {
                              timeFrame: e.target.value,
                            })
                          }
                          placeholder="e.g., 2 years"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Measurable Impact
                        </label>
                        <input
                          type="text"
                          value={benefit.measurableImpact || ""}
                          onChange={(e) =>
                            updateSoilBenefit(index, {
                              measurableImpact: e.target.value,
                            })
                          }
                          placeholder="e.g., 15% increase in OM"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={benefit.description}
                        onChange={(e) =>
                          updateSoilBenefit(index, {
                            description: e.target.value,
                          })
                        }
                        rows={2}
                        placeholder="Describe how this rotation will provide this benefit..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
