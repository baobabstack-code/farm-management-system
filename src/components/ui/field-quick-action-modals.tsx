"use client";

import { useState, useEffect, useRef } from "react";
import {
  FarmCard,
  FarmCardHeader,
  FarmCardContent,
  FarmButton,
  FarmInput,
  FarmSelect,
  FarmTextarea,
} from "@/components/ui/farm-theme";
import { CropStatus } from "@prisma/client";
import {
  X,
  Loader2,
  Sprout,
  TestTube,
  Droplets,
  CloudRain,
} from "lucide-react";

// Base Modal Component (reused from crop modals)
interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function BaseModal({ isOpen, onClose, title, icon, children }: BaseModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={dialogRef}
        className="bg-background border border-border rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <FarmCard className="border-0 shadow-none">
          <FarmCardHeader
            title={title}
            badge={
              <div className="flex items-center gap-2">
                {icon}
                <FarmButton
                  ref={cancelButtonRef}
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </FarmButton>
              </div>
            }
          />
          <FarmCardContent>{children}</FarmCardContent>
        </FarmCard>
      </div>
    </div>
  );
}

// Add Crop Modal
interface AddCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldId: string;
  fieldName: string;
  onSuccess: () => void;
}

export function AddCropModal({
  isOpen,
  onClose,
  fieldId,
  fieldName,
  onSuccess,
}: AddCropModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    variety: "",
    plantingDate: new Date().toISOString().split("T")[0],
    expectedHarvestDate: "",
    area: "",
    status: CropStatus.PLANTED as CropStatus,
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/crops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          variety: formData.variety || undefined,
          fieldId: fieldId,
          plantingDate: formData.plantingDate,
          expectedHarvestDate: formData.expectedHarvestDate,
          area: formData.area ? parseFloat(formData.area) : undefined,
          status: formData.status,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          name: "",
          variety: "",
          plantingDate: new Date().toISOString().split("T")[0],
          expectedHarvestDate: "",
          area: "",
          status: CropStatus.PLANTED,
          notes: "",
        });
      } else {
        throw new Error(data.error || "Failed to add crop");
      }
    } catch (error) {
      console.error("Error adding crop:", error);
      alert(error instanceof Error ? error.message : "Failed to add crop");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Crop to ${fieldName}`}
      icon={<Sprout className="w-5 h-5 text-green-500" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Crop Name *</label>
          <FarmInput
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Tomatoes, Corn, etc."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Variety (Optional)
          </label>
          <FarmInput
            value={formData.variety}
            onChange={(e) =>
              setFormData({ ...formData, variety: e.target.value })
            }
            placeholder="e.g., Cherry, Sweet Corn, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Planting Date *
          </label>
          <FarmInput
            type="date"
            value={formData.plantingDate}
            onChange={(e) =>
              setFormData({ ...formData, plantingDate: e.target.value })
            }
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Expected Harvest Date *
          </label>
          <FarmInput
            type="date"
            value={formData.expectedHarvestDate}
            onChange={(e) =>
              setFormData({ ...formData, expectedHarvestDate: e.target.value })
            }
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Area (m²)</label>
          <FarmInput
            type="number"
            step="0.1"
            min="0"
            value={formData.area}
            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
            placeholder="100.0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Initial Status
          </label>
          <FarmSelect
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value as CropStatus })
            }
          >
            <option value={CropStatus.PLANTED}>Planted</option>
            <option value={CropStatus.GROWING}>Growing</option>
            <option value={CropStatus.FLOWERING}>Flowering</option>
            <option value={CropStatus.FRUITING}>Fruiting</option>
          </FarmSelect>
        </div>

        <div className="flex gap-3 pt-2">
          <FarmButton
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </FarmButton>
          <FarmButton type="submit" disabled={loading} className="flex-1">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Add Crop
          </FarmButton>
        </div>
      </form>
    </BaseModal>
  );
}

// Soil Test Modal
interface SoilTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldId: string;
  fieldName: string;
  onSuccess: () => void;
}

export function SoilTestModal({
  isOpen,
  onClose,
  fieldId,
  fieldName,
  onSuccess,
}: SoilTestModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sampleDate: new Date().toISOString().split("T")[0],
    labName: "",
    testType: "BASIC",
    pH: "",
    organicMatter: "",
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    cost: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/soil-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldId: fieldId,
          sampleDate: formData.sampleDate,
          labName: formData.labName,
          testType: formData.testType,
          pH: parseFloat(formData.pH),
          organicMatter: parseFloat(formData.organicMatter),
          nitrogen: parseFloat(formData.nitrogen),
          phosphorus: parseFloat(formData.phosphorus),
          potassium: parseFloat(formData.potassium),
          cost: formData.cost ? parseFloat(formData.cost) : undefined,
          notes: formData.notes || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          sampleDate: new Date().toISOString().split("T")[0],
          labName: "",
          testType: "BASIC",
          pH: "",
          organicMatter: "",
          nitrogen: "",
          phosphorus: "",
          potassium: "",
          cost: "",
          notes: "",
        });
      } else {
        throw new Error(data.error || "Failed to add soil test");
      }
    } catch (error) {
      console.error("Error adding soil test:", error);
      alert(error instanceof Error ? error.message : "Failed to add soil test");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Soil Test - ${fieldName}`}
      icon={<TestTube className="w-5 h-5 text-blue-500" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Sample Date *
          </label>
          <FarmInput
            type="date"
            value={formData.sampleDate}
            onChange={(e) =>
              setFormData({ ...formData, sampleDate: e.target.value })
            }
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Lab Name *</label>
          <FarmInput
            value={formData.labName}
            onChange={(e) =>
              setFormData({ ...formData, labName: e.target.value })
            }
            placeholder="e.g., AgriLab Services"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Test Type</label>
          <FarmSelect
            value={formData.testType}
            onChange={(e) =>
              setFormData({ ...formData, testType: e.target.value })
            }
          >
            <option value="BASIC">Basic</option>
            <option value="COMPREHENSIVE">Comprehensive</option>
            <option value="MICRONUTRIENT">Micronutrient</option>
            <option value="ORGANIC_MATTER">Organic Matter</option>
          </FarmSelect>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">pH *</label>
            <FarmInput
              type="number"
              step="0.1"
              min="0"
              max="14"
              value={formData.pH}
              onChange={(e) => setFormData({ ...formData, pH: e.target.value })}
              placeholder="7.0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Organic Matter (%) *
            </label>
            <FarmInput
              type="number"
              step="0.1"
              min="0"
              value={formData.organicMatter}
              onChange={(e) =>
                setFormData({ ...formData, organicMatter: e.target.value })
              }
              placeholder="3.5"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">N (ppm) *</label>
            <FarmInput
              type="number"
              step="0.1"
              min="0"
              value={formData.nitrogen}
              onChange={(e) =>
                setFormData({ ...formData, nitrogen: e.target.value })
              }
              placeholder="25"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">P (ppm) *</label>
            <FarmInput
              type="number"
              step="0.1"
              min="0"
              value={formData.phosphorus}
              onChange={(e) =>
                setFormData({ ...formData, phosphorus: e.target.value })
              }
              placeholder="15"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">K (ppm) *</label>
            <FarmInput
              type="number"
              step="0.1"
              min="0"
              value={formData.potassium}
              onChange={(e) =>
                setFormData({ ...formData, potassium: e.target.value })
              }
              placeholder="120"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Cost ($)</label>
          <FarmInput
            type="number"
            step="0.01"
            min="0"
            value={formData.cost}
            onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
            placeholder="50.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Notes (Optional)
          </label>
          <FarmTextarea
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Additional observations or recommendations..."
            rows={3}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <FarmButton
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </FarmButton>
          <FarmButton type="submit" disabled={loading} className="flex-1">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Add Soil Test
          </FarmButton>
        </div>
      </form>
    </BaseModal>
  );
}

// Field Treatment Modal (for field-level treatments like fertilization)
interface FieldTreatmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldId: string;
  fieldName: string;
  onSuccess: () => void;
}

export function FieldTreatmentModal({
  isOpen,
  onClose,
  fieldId,
  fieldName,
  onSuccess,
}: FieldTreatmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    treatmentType: "",
    product: "",
    rate: "",
    unit: "kg/ha",
    method: "",
    cost: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // This would need a field treatments API endpoint
      const response = await fetch("/api/field-treatments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldId: fieldId,
          date: formData.date,
          treatmentType: formData.treatmentType,
          product: formData.product,
          rate: parseFloat(formData.rate),
          unit: formData.unit,
          method: formData.method,
          cost: formData.cost ? parseFloat(formData.cost) : undefined,
          notes: formData.notes || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          date: new Date().toISOString().split("T")[0],
          treatmentType: "",
          product: "",
          rate: "",
          unit: "kg/ha",
          method: "",
          cost: "",
          notes: "",
        });
      } else {
        throw new Error(data.error || "Failed to schedule treatment");
      }
    } catch (error) {
      console.error("Error scheduling treatment:", error);
      alert(
        error instanceof Error ? error.message : "Failed to schedule treatment"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Schedule Treatment - ${fieldName}`}
      icon={<Droplets className="w-5 h-5 text-green-500" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Date *</label>
          <FarmInput
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Treatment Type *
          </label>
          <FarmSelect
            value={formData.treatmentType}
            onChange={(e) =>
              setFormData({ ...formData, treatmentType: e.target.value })
            }
            required
          >
            <option value="">Select treatment type</option>
            <option value="FERTILIZER">Fertilizer</option>
            <option value="HERBICIDE">Herbicide</option>
            <option value="PESTICIDE">Pesticide</option>
            <option value="FUNGICIDE">Fungicide</option>
            <option value="LIME">Lime Application</option>
            <option value="COMPOST">Compost</option>
          </FarmSelect>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Product/Material *
          </label>
          <FarmInput
            value={formData.product}
            onChange={(e) =>
              setFormData({ ...formData, product: e.target.value })
            }
            placeholder="e.g., NPK 10-10-10, Roundup, etc."
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              Application Rate *
            </label>
            <FarmInput
              type="number"
              step="0.1"
              min="0"
              value={formData.rate}
              onChange={(e) =>
                setFormData({ ...formData, rate: e.target.value })
              }
              placeholder="50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Unit</label>
            <FarmSelect
              value={formData.unit}
              onChange={(e) =>
                setFormData({ ...formData, unit: e.target.value })
              }
            >
              <option value="kg/ha">kg/ha</option>
              <option value="L/ha">L/ha</option>
              <option value="g/m²">g/m²</option>
              <option value="mL/m²">mL/m²</option>
            </FarmSelect>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Application Method
          </label>
          <FarmInput
            value={formData.method}
            onChange={(e) =>
              setFormData({ ...formData, method: e.target.value })
            }
            placeholder="e.g., Broadcast, Spray, Injection"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Cost ($)</label>
          <FarmInput
            type="number"
            step="0.01"
            min="0"
            value={formData.cost}
            onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
            placeholder="150.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Notes (Optional)
          </label>
          <FarmTextarea
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Weather conditions, equipment used, etc..."
            rows={3}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <FarmButton
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </FarmButton>
          <FarmButton type="submit" disabled={loading} className="flex-1">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Schedule Treatment
          </FarmButton>
        </div>
      </form>
    </BaseModal>
  );
}

// Weather Data Refresh Modal (simulated - would integrate with weather API)
interface WeatherRefreshModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldId: string;
  fieldName: string;
  latitude?: number;
  longitude?: number;
  onSuccess: () => void;
}

export function WeatherRefreshModal({
  isOpen,
  onClose,
  fieldId,
  fieldName,
  latitude,
  longitude,
  onSuccess,
}: WeatherRefreshModalProps) {
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);

  const handleRefresh = async () => {
    if (!latitude || !longitude) {
      alert("Field coordinates are required for weather data");
      return;
    }

    setLoading(true);

    try {
      // Simulate weather API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock weather data
      const mockWeather = {
        temperature: Math.round(Math.random() * 30 + 10),
        humidity: Math.round(Math.random() * 40 + 40),
        precipitation: Math.round(Math.random() * 10 * 10) / 10,
        windSpeed: Math.round(Math.random() * 20 * 10) / 10,
        description: ["Sunny", "Partly Cloudy", "Cloudy", "Light Rain"][
          Math.floor(Math.random() * 4)
        ],
        lastUpdated: new Date().toISOString(),
      };

      setWeatherData(mockWeather);
      onSuccess();
    } catch (error) {
      console.error("Error fetching weather data:", error);
      alert("Failed to fetch weather data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Weather Data - ${fieldName}`}
      icon={<CloudRain className="w-5 h-5 text-blue-500" />}
    >
      <div className="space-y-4">
        {!latitude || !longitude ? (
          <div className="text-center py-6">
            <CloudRain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Location Required</h3>
            <p className="text-sm text-muted-foreground">
              Field coordinates are needed to fetch weather data. Please update
              the field location first.
            </p>
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground">
              <p>
                Location: {latitude}°, {longitude}°
              </p>
            </div>

            {weatherData ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border border-border rounded-lg">
                    <span className="text-sm text-muted-foreground">
                      Temperature
                    </span>
                    <p className="font-medium">{weatherData.temperature}°C</p>
                  </div>
                  <div className="p-3 border border-border rounded-lg">
                    <span className="text-sm text-muted-foreground">
                      Humidity
                    </span>
                    <p className="font-medium">{weatherData.humidity}%</p>
                  </div>
                  <div className="p-3 border border-border rounded-lg">
                    <span className="text-sm text-muted-foreground">
                      Precipitation
                    </span>
                    <p className="font-medium">{weatherData.precipitation}mm</p>
                  </div>
                  <div className="p-3 border border-border rounded-lg">
                    <span className="text-sm text-muted-foreground">
                      Wind Speed
                    </span>
                    <p className="font-medium">{weatherData.windSpeed} km/h</p>
                  </div>
                </div>
                <div className="p-3 border border-border rounded-lg">
                  <span className="text-sm text-muted-foreground">
                    Conditions
                  </span>
                  <p className="font-medium">{weatherData.description}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  Last updated:{" "}
                  {new Date(weatherData.lastUpdated).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <CloudRain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Click refresh to get current weather data for this field.
                </p>
              </div>
            )}
          </>
        )}

        <div className="flex gap-3 pt-2">
          <FarmButton
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Close
          </FarmButton>
          {latitude && longitude && (
            <FarmButton
              onClick={handleRefresh}
              disabled={loading}
              className="flex-1"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {weatherData ? "Refresh" : "Get Weather"}
            </FarmButton>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
