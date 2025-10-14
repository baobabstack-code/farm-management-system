"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Crop, PestDiseaseType, Severity } from "@/types";
import {
  PageHeader,
  FarmCard,
  FarmCardHeader,
  FarmCardContent,
  FarmButton,
  FarmBadge,
  LoadingState,
} from "@/components/ui/farm-theme";
import { Activity, Plus, Droplets, Sprout, Bug, Wheat } from "lucide-react";

type ActivityType = "irrigation" | "fertilizer" | "pest-disease" | "harvest";

export default function ActivitiesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<ActivityType>("irrigation");

  const [irrigationForm, setIrrigationForm] = useState({
    cropId: "",
    date: "",
    duration: "",
    waterAmount: "",
    method: "",
    notes: "",
  });

  const [fertilizerForm, setFertilizerForm] = useState({
    cropId: "",
    date: "",
    fertilizerType: "",
    amount: "",
    applicationMethod: "",
    notes: "",
  });

  const [pestDiseaseForm, setPestDiseaseForm] = useState<{
    cropId: string;
    date: string;
    type: PestDiseaseType;
    name: string;
    severity: Severity;
    affectedArea: string;
    treatment: string;
    notes: string;
  }>({
    cropId: "",
    date: "",
    type: PestDiseaseType.PEST,
    name: "",
    severity: Severity.LOW,
    affectedArea: "",
    treatment: "",
    notes: "",
  });

  const [harvestForm, setHarvestForm] = useState({
    cropId: "",
    date: "",
    quantity: "",
    unit: "",
    quality: "",
    notes: "",
  });

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push("/sign-in");
      return;
    }

    fetchCrops();
  }, [user, isLoaded, router]);

  const fetchCrops = async () => {
    try {
      const response = await fetch("/api/crops");
      const data = await response.json();

      if (data.success) {
        setCrops(data.data);
      } else {
        setError("Failed to fetch crops");
      }
    } catch {
      setError("Error fetching crops");
    } finally {
      setLoading(false);
    }
  };

  const handleIrrigationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/irrigation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...irrigationForm,
          duration: parseFloat(irrigationForm.duration),
          waterAmount: parseFloat(irrigationForm.waterAmount),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Irrigation activity logged successfully!");
        setIrrigationForm({
          cropId: "",
          date: "",
          duration: "",
          waterAmount: "",
          method: "",
          notes: "",
        });
      } else {
        setError(data.error || "Failed to log irrigation activity");
      }
    } catch {
      setError("Error logging irrigation activity");
    } finally {
      setFormLoading(false);
    }
  };

  const handleFertilizerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/fertilizer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...fertilizerForm,
          amount: parseFloat(fertilizerForm.amount),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Fertilizer application logged successfully!");
        setFertilizerForm({
          cropId: "",
          date: "",
          fertilizerType: "",
          amount: "",
          applicationMethod: "",
          notes: "",
        });
      } else {
        setError(data.error || "Failed to log fertilizer application");
      }
    } catch {
      setError("Error logging fertilizer application");
    } finally {
      setFormLoading(false);
    }
  };

  const handlePestDiseaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/pest-disease", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...pestDiseaseForm,
          affectedArea: parseFloat(pestDiseaseForm.affectedArea),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Pest/Disease issue logged successfully!");
        setPestDiseaseForm({
          cropId: "",
          date: "",
          type: PestDiseaseType.PEST,
          name: "",
          severity: Severity.LOW,
          affectedArea: "",
          treatment: "",
          notes: "",
        });
      } else {
        setError(data.error || "Failed to log pest/disease issue");
      }
    } catch {
      setError("Error logging pest/disease issue");
    } finally {
      setFormLoading(false);
    }
  };

  const handleHarvestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/harvest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...harvestForm,
          quantity: parseFloat(harvestForm.quantity),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Harvest logged successfully!");
        setHarvestForm({
          cropId: "",
          date: "",
          quantity: "",
          unit: "",
          quality: "",
          notes: "",
        });
      } else {
        setError(data.error || "Failed to log harvest");
      }
    } catch {
      setError("Error logging harvest");
    } finally {
      setFormLoading(false);
    }
  };

  if (!isLoaded || loading) {
    return <LoadingState message="Loading activities..." />;
  }

  // Show message if no crops are available
  if (crops.length === 0) {
    return (
      <div className="page-container">
        <div className="content-container padding-responsive-lg mobile-header-spacing content-spacing">
          <PageHeader
            title="Farm Activities"
            description="Log and track your farming activities"
            icon={<Activity className="w-6 h-6" />}
          />
          <div className="farm-card border-warning/20 bg-warning/5">
            <div className="flex-center gap-content padding-responsive">
              <div className="flex-center w-10 h-10 bg-warning/10 rounded-full">
                <span className="text-warning text-lg">⚠️</span>
              </div>
              <div className="flex-1">
                <span className="text-warning font-medium">
                  No crops available
                </span>
                <p className="text-sm mt-1 text-muted-foreground">
                  You need to create crops first before logging activities.{" "}
                  <Link
                    href="/crops"
                    className="underline font-medium hover:text-warning"
                  >
                    Go to Crops Management
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      key: "irrigation",
      label: "Irrigation",
      icon: <Droplets className="w-4 h-4" />,
      color: "from-blue-500 to-cyan-600",
    },
    {
      key: "fertilizer",
      label: "Fertilizer",
      icon: <Sprout className="w-4 h-4" />,
      color: "from-green-500 to-emerald-600",
    },
    {
      key: "pest-disease",
      label: "Pest & Disease",
      icon: <Bug className="w-4 h-4" />,
      color: "from-red-500 to-pink-600",
    },
    {
      key: "harvest",
      label: "Harvest",
      icon: <Wheat className="w-4 h-4" />,
      color: "from-yellow-500 to-orange-600",
    },
  ];

  return (
    <div className="page-container">
      <div className="content-container padding-responsive-lg mobile-header-spacing content-spacing">
        <PageHeader
          title="Activity Logging"
          description="Record and track all your farming activities"
          icon={<Activity className="w-6 h-6" />}
        />

        {error && (
          <div className="farm-card border-destructive/20 bg-destructive/5">
            <div className="flex-center gap-content padding-responsive">
              <div className="flex-center w-10 h-10 bg-destructive/10 rounded-full">
                <span className="text-destructive text-lg">⚠️</span>
              </div>
              <span className="text-destructive font-medium">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="farm-card border-success/20 bg-success/5">
            <div className="flex-center gap-content padding-responsive">
              <div className="flex-center w-10 h-10 bg-success/10 rounded-full">
                <span className="text-success text-lg">✅</span>
              </div>
              <span className="text-success font-medium">{success}</span>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <FarmCard>
          <FarmCardContent>
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <FarmButton
                  key={tab.key}
                  variant={activeTab === tab.key ? "success" : "outline"}
                  onClick={() => setActiveTab(tab.key as ActivityType)}
                  className="flex-1 min-w-[120px]"
                >
                  {tab.icon}
                  {tab.label}
                </FarmButton>
              ))}
            </div>
          </FarmCardContent>
        </FarmCard>

        {/* Activity Forms */}
        <FarmCard>
          <FarmCardHeader
            title={`Log ${tabs.find((t) => t.key === activeTab)?.label} Activity`}
            description={`Record ${activeTab} activities for your crops`}
          />
          <FarmCardContent>
            {/* Irrigation Form */}
            {activeTab === "irrigation" && (
              <form onSubmit={handleIrrigationSubmit} className="farm-form">
                <div className="farm-grid grid-cols-1 md:grid-cols-2">
                  <div>
                    <label className="farm-label">Crop *</label>
                    <select
                      required
                      value={irrigationForm.cropId}
                      onChange={(e) =>
                        setIrrigationForm({
                          ...irrigationForm,
                          cropId: e.target.value,
                        })
                      }
                      className="farm-input"
                    >
                      <option value="">Select a crop</option>
                      {crops.map((crop) => (
                        <option key={crop.id} value={crop.id}>
                          {crop.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="farm-label">Date *</label>
                    <Input
                      type="date"
                      required
                      value={irrigationForm.date}
                      onChange={(e) =>
                        setIrrigationForm({
                          ...irrigationForm,
                          date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="farm-label">Duration (hours)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={irrigationForm.duration}
                      onChange={(e) =>
                        setIrrigationForm({
                          ...irrigationForm,
                          duration: e.target.value,
                        })
                      }
                      placeholder="e.g., 2.5"
                    />
                  </div>
                  <div>
                    <label className="farm-label">Water Amount (liters)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={irrigationForm.waterAmount}
                      onChange={(e) =>
                        setIrrigationForm({
                          ...irrigationForm,
                          waterAmount: e.target.value,
                        })
                      }
                      placeholder="e.g., 100"
                    />
                  </div>
                  <div>
                    <label className="farm-label">Method</label>
                    <select
                      value={irrigationForm.method}
                      onChange={(e) =>
                        setIrrigationForm({
                          ...irrigationForm,
                          method: e.target.value,
                        })
                      }
                      className="farm-input"
                    >
                      <option value="">Select method</option>
                      <option value="sprinkler">Sprinkler</option>
                      <option value="drip">Drip Irrigation</option>
                      <option value="flood">Flood Irrigation</option>
                      <option value="manual">Manual Watering</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="farm-label">Notes</label>
                    <textarea
                      value={irrigationForm.notes}
                      onChange={(e) =>
                        setIrrigationForm({
                          ...irrigationForm,
                          notes: e.target.value,
                        })
                      }
                      placeholder="Additional notes..."
                      className="farm-input min-h-[100px]"
                    />
                  </div>
                </div>
                <div className="action-buttons">
                  <FarmButton
                    type="submit"
                    variant="success"
                    disabled={formLoading}
                  >
                    <Droplets className="w-4 h-4" />
                    {formLoading ? "Logging..." : "Log Irrigation Activity"}
                  </FarmButton>
                </div>
              </form>
            )}

            {/* Fertilizer Form */}
            {activeTab === "fertilizer" && (
              <form onSubmit={handleFertilizerSubmit} className="farm-form">
                <div className="farm-grid grid-cols-1 md:grid-cols-2">
                  <div>
                    <label className="farm-label">Crop *</label>
                    <select
                      required
                      value={fertilizerForm.cropId}
                      onChange={(e) =>
                        setFertilizerForm({
                          ...fertilizerForm,
                          cropId: e.target.value,
                        })
                      }
                      className="farm-input"
                    >
                      <option value="">Select a crop</option>
                      {crops.map((crop) => (
                        <option key={crop.id} value={crop.id}>
                          {crop.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="farm-label">Date *</label>
                    <Input
                      type="date"
                      required
                      value={fertilizerForm.date}
                      onChange={(e) =>
                        setFertilizerForm({
                          ...fertilizerForm,
                          date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="farm-label">Fertilizer Type *</label>
                    <Input
                      type="text"
                      required
                      value={fertilizerForm.fertilizerType}
                      onChange={(e) =>
                        setFertilizerForm({
                          ...fertilizerForm,
                          fertilizerType: e.target.value,
                        })
                      }
                      placeholder="e.g., NPK 10-10-10"
                    />
                  </div>
                  <div>
                    <label className="farm-label">Amount (kg)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={fertilizerForm.amount}
                      onChange={(e) =>
                        setFertilizerForm({
                          ...fertilizerForm,
                          amount: e.target.value,
                        })
                      }
                      placeholder="e.g., 5"
                    />
                  </div>
                  <div>
                    <label className="farm-label">Application Method</label>
                    <select
                      value={fertilizerForm.applicationMethod}
                      onChange={(e) =>
                        setFertilizerForm({
                          ...fertilizerForm,
                          applicationMethod: e.target.value,
                        })
                      }
                      className="farm-input"
                    >
                      <option value="">Select method</option>
                      <option value="broadcast">Broadcast</option>
                      <option value="side-dress">Side Dress</option>
                      <option value="foliar">Foliar Spray</option>
                      <option value="fertigation">Fertigation</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="farm-label">Notes</label>
                    <textarea
                      value={fertilizerForm.notes}
                      onChange={(e) =>
                        setFertilizerForm({
                          ...fertilizerForm,
                          notes: e.target.value,
                        })
                      }
                      placeholder="Additional notes..."
                      className="farm-input min-h-[100px]"
                    />
                  </div>
                </div>
                <div className="action-buttons">
                  <FarmButton
                    type="submit"
                    variant="success"
                    disabled={formLoading}
                  >
                    <Sprout className="w-4 h-4" />
                    {formLoading ? "Logging..." : "Log Fertilizer Application"}
                  </FarmButton>
                </div>
              </form>
            )}

            {/* Pest & Disease Form */}
            {activeTab === "pest-disease" && (
              <form onSubmit={handlePestDiseaseSubmit} className="farm-form">
                <div className="farm-grid grid-cols-1 md:grid-cols-2">
                  <div>
                    <label className="farm-label">Crop *</label>
                    <select
                      required
                      value={pestDiseaseForm.cropId}
                      onChange={(e) =>
                        setPestDiseaseForm({
                          ...pestDiseaseForm,
                          cropId: e.target.value,
                        })
                      }
                      className="farm-input"
                    >
                      <option value="">Select a crop</option>
                      {crops.map((crop) => (
                        <option key={crop.id} value={crop.id}>
                          {crop.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="farm-label">Date *</label>
                    <Input
                      type="date"
                      required
                      value={pestDiseaseForm.date}
                      onChange={(e) =>
                        setPestDiseaseForm({
                          ...pestDiseaseForm,
                          date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="farm-label">Type *</label>
                    <select
                      required
                      value={pestDiseaseForm.type}
                      onChange={(e) =>
                        setPestDiseaseForm({
                          ...pestDiseaseForm,
                          type: e.target.value as PestDiseaseType,
                        })
                      }
                      className="farm-input"
                    >
                      <option value={PestDiseaseType.PEST}>Pest</option>
                      <option value={PestDiseaseType.DISEASE}>Disease</option>
                    </select>
                  </div>
                  <div>
                    <label className="farm-label">Name *</label>
                    <Input
                      type="text"
                      required
                      value={pestDiseaseForm.name}
                      onChange={(e) =>
                        setPestDiseaseForm({
                          ...pestDiseaseForm,
                          name: e.target.value,
                        })
                      }
                      placeholder="e.g., Aphids, Blight"
                    />
                  </div>
                  <div>
                    <label className="farm-label">Severity *</label>
                    <select
                      required
                      value={pestDiseaseForm.severity}
                      onChange={(e) =>
                        setPestDiseaseForm({
                          ...pestDiseaseForm,
                          severity: e.target.value as Severity,
                        })
                      }
                      className="farm-input"
                    >
                      <option value={Severity.LOW}>Low</option>
                      <option value={Severity.MEDIUM}>Medium</option>
                      <option value={Severity.HIGH}>High</option>
                    </select>
                  </div>
                  <div>
                    <label className="farm-label">Affected Area (m²)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={pestDiseaseForm.affectedArea}
                      onChange={(e) =>
                        setPestDiseaseForm({
                          ...pestDiseaseForm,
                          affectedArea: e.target.value,
                        })
                      }
                      placeholder="e.g., 10"
                    />
                  </div>
                  <div>
                    <label className="farm-label">Treatment</label>
                    <Input
                      type="text"
                      value={pestDiseaseForm.treatment}
                      onChange={(e) =>
                        setPestDiseaseForm({
                          ...pestDiseaseForm,
                          treatment: e.target.value,
                        })
                      }
                      placeholder="e.g., Neem oil spray"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="farm-label">Notes</label>
                    <textarea
                      value={pestDiseaseForm.notes}
                      onChange={(e) =>
                        setPestDiseaseForm({
                          ...pestDiseaseForm,
                          notes: e.target.value,
                        })
                      }
                      placeholder="Additional notes..."
                      className="farm-input min-h-[100px]"
                    />
                  </div>
                </div>
                <div className="action-buttons">
                  <FarmButton
                    type="submit"
                    variant="success"
                    disabled={formLoading}
                  >
                    <Bug className="w-4 h-4" />
                    {formLoading ? "Logging..." : "Log Issue"}
                  </FarmButton>
                </div>
              </form>
            )}

            {/* Harvest Form */}
            {activeTab === "harvest" && (
              <form onSubmit={handleHarvestSubmit} className="farm-form">
                <div className="farm-grid grid-cols-1 md:grid-cols-2">
                  <div>
                    <label className="farm-label">Crop *</label>
                    <select
                      required
                      value={harvestForm.cropId}
                      onChange={(e) =>
                        setHarvestForm({
                          ...harvestForm,
                          cropId: e.target.value,
                        })
                      }
                      className="farm-input"
                    >
                      <option value="">Select a crop</option>
                      {crops.map((crop) => (
                        <option key={crop.id} value={crop.id}>
                          {crop.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="farm-label">Date *</label>
                    <Input
                      type="date"
                      required
                      value={harvestForm.date}
                      onChange={(e) =>
                        setHarvestForm({ ...harvestForm, date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="farm-label">Quantity *</label>
                    <Input
                      type="number"
                      step="0.1"
                      required
                      value={harvestForm.quantity}
                      onChange={(e) =>
                        setHarvestForm({
                          ...harvestForm,
                          quantity: e.target.value,
                        })
                      }
                      placeholder="e.g., 50"
                    />
                  </div>
                  <div>
                    <label className="farm-label">Unit *</label>
                    <select
                      required
                      value={harvestForm.unit}
                      onChange={(e) =>
                        setHarvestForm({ ...harvestForm, unit: e.target.value })
                      }
                      className="farm-input"
                    >
                      <option value="">Select unit</option>
                      <option value="kg">Kilograms (kg)</option>
                      <option value="lbs">Pounds (lbs)</option>
                      <option value="tons">Tons</option>
                      <option value="pieces">Pieces</option>
                    </select>
                  </div>
                  <div>
                    <label className="farm-label">Quality</label>
                    <select
                      value={harvestForm.quality}
                      onChange={(e) =>
                        setHarvestForm({
                          ...harvestForm,
                          quality: e.target.value,
                        })
                      }
                      className="farm-input"
                    >
                      <option value="">Select quality</option>
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="farm-label">Notes</label>
                    <textarea
                      value={harvestForm.notes}
                      onChange={(e) =>
                        setHarvestForm({
                          ...harvestForm,
                          notes: e.target.value,
                        })
                      }
                      placeholder="Additional notes..."
                      className="farm-input min-h-[100px]"
                    />
                  </div>
                </div>
                <div className="action-buttons">
                  <FarmButton
                    type="submit"
                    variant="success"
                    disabled={formLoading}
                  >
                    <Wheat className="w-4 h-4" />
                    {formLoading ? "Logging..." : "Log Harvest"}
                  </FarmButton>
                </div>
              </form>
            )}
          </FarmCardContent>
        </FarmCard>
      </div>
    </div>
  );
}
