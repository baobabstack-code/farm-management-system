"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crop, PestDiseaseType, Severity } from "@/types";

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
    harvestDate: "",
    quantity: "",
    unit: "",
    qualityGrade: "",
    notes: "",
  });

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push("/sign-in");
      return;
    }

    if (user) {
      fetchCrops();
    }
  }, [user, isLoaded, router]);

  const fetchCrops = async () => {
    try {
      const response = await fetch("/api/crops");
      const data = await response.json();

      if (data.success) {
        console.log("Fetched crops:", data.data);
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

    // Validate form before submission
    if (!irrigationForm.cropId) {
      setError("Please select a crop");
      setFormLoading(false);
      return;
    }

    if (!irrigationForm.date) {
      setError("Please select a date");
      setFormLoading(false);
      return;
    }

    if (!irrigationForm.duration || isNaN(parseInt(irrigationForm.duration))) {
      setError("Please enter a valid duration");
      setFormLoading(false);
      return;
    }

    if (
      !irrigationForm.waterAmount ||
      isNaN(parseFloat(irrigationForm.waterAmount))
    ) {
      setError("Please enter a valid water amount");
      setFormLoading(false);
      return;
    }

    try {
      const requestData = {
        cropId: irrigationForm.cropId,
        date: irrigationForm.date,
        duration: parseInt(irrigationForm.duration),
        waterAmount: parseFloat(irrigationForm.waterAmount),
        method: irrigationForm.method || "SPRINKLER", // Default to SPRINKLER if not selected
        notes: irrigationForm.notes || undefined,
      };

      console.log("Submitting irrigation data:", requestData);

      const response = await fetch("/api/irrigation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Irrigation log created successfully!");
        setIrrigationForm({
          cropId: "",
          date: "",
          duration: "",
          waterAmount: "",
          method: "",
          notes: "",
        });
      } else {
        setError(data.error || "Failed to create irrigation log");
      }
    } catch {
      setError("Error creating irrigation log");
    } finally {
      setFormLoading(false);
    }
  };

  const handleFertilizerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    setSuccess("");

    // Validate form before submission
    if (!fertilizerForm.cropId) {
      setError("Please select a crop");
      setFormLoading(false);
      return;
    }

    if (!fertilizerForm.applicationMethod) {
      setError("Please select an application method");
      setFormLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/fertilizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropId: fertilizerForm.cropId,
          date: fertilizerForm.date,
          fertilizerType: fertilizerForm.fertilizerType,
          amount: parseFloat(fertilizerForm.amount),
          applicationMethod: fertilizerForm.applicationMethod,
          notes: fertilizerForm.notes || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Fertilizer log created successfully!");
        setFertilizerForm({
          cropId: "",
          date: "",
          fertilizerType: "",
          amount: "",
          applicationMethod: "",
          notes: "",
        });
      } else {
        setError(data.error || "Failed to create fertilizer log");
      }
    } catch {
      setError("Error creating fertilizer log");
    } finally {
      setFormLoading(false);
    }
  };

  const handlePestDiseaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    setSuccess("");

    // Validate form before submission
    if (!pestDiseaseForm.cropId) {
      setError("Please select a crop");
      setFormLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/pest-disease", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropId: pestDiseaseForm.cropId,
          date: pestDiseaseForm.date,
          type: pestDiseaseForm.type,
          name: pestDiseaseForm.name,
          severity: pestDiseaseForm.severity,
          affectedArea: parseFloat(pestDiseaseForm.affectedArea),
          treatment: pestDiseaseForm.treatment,
          notes: pestDiseaseForm.notes || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Pest/Disease log created successfully!");
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
        setError(data.error || "Failed to create pest/disease log");
      }
    } catch {
      setError("Error creating pest/disease log");
    } finally {
      setFormLoading(false);
    }
  };

  const handleHarvestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    setSuccess("");

    // Validate form before submission
    if (!harvestForm.cropId) {
      setError("Please select a crop");
      setFormLoading(false);
      return;
    }

    if (!harvestForm.qualityGrade) {
      setError("Please select a quality grade");
      setFormLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/harvest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropId: harvestForm.cropId,
          harvestDate: harvestForm.harvestDate,
          quantity: parseFloat(harvestForm.quantity),
          unit: harvestForm.unit,
          qualityGrade: harvestForm.qualityGrade,
          notes: harvestForm.notes || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Harvest log created successfully!");
        setHarvestForm({
          cropId: "",
          harvestDate: "",
          quantity: "",
          unit: "",
          qualityGrade: "",
          notes: "",
        });
      } else {
        setError(data.error || "Failed to create harvest log");
      }
    } catch {
      setError("Error creating harvest log");
    } finally {
      setFormLoading(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  // Show message if no crops are available
  if (crops.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Farm Activities
              </h1>
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                <p className="font-medium">No crops available</p>
                <p className="text-sm mt-1">
                  You need to create crops first before logging activities.{" "}
                  <Link href="/crops" className="underline font-medium">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="content-container py-4 sm:py-6 lg:py-8 mobile-header-spacing">
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center mb-4 sm:mb-6 gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
              <span className="text-white text-2xl">📋</span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">
                Activity Logging
              </h1>
              <p className="text-base sm:text-lg text-gray-600 mt-1">
                Record and track all your farming activities
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}

          {/* Tab Navigation */}
          <div className="mb-6 lg:mb-8">
            <div className="card-mobile overflow-x-auto">
              <nav className="flex space-x-1 sm:space-x-2 min-w-max">
                {[
                  {
                    key: "irrigation",
                    label: "💧 Irrigation",
                    color: "from-blue-500 to-cyan-600",
                  },
                  {
                    key: "fertilizer",
                    label: "🌿 Fertilizer",
                    color: "from-green-500 to-emerald-600",
                  },
                  {
                    key: "pest-disease",
                    label: "🐛 Pest & Disease",
                    color: "from-red-500 to-pink-600",
                  },
                  {
                    key: "harvest",
                    label: "🌾 Harvest",
                    color: "from-yellow-500 to-orange-600",
                  },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as ActivityType)}
                    className={`flex-1 py-3 px-2 sm:px-4 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap transition-all duration-200 ${
                      activeTab === tab.key
                        ? `bg-gradient-to-r ${tab.color} text-white shadow-md transform scale-105`
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="card-mobile fade-in">
            {/* Irrigation Form */}
            {activeTab === "irrigation" && (
              <form onSubmit={handleIrrigationSubmit} className="form-mobile">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white text-lg">💧</span>
                  </div>
                  <h2 className="text-heading text-gray-900">
                    Log Irrigation Activity
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Crop *
                    </label>
                    <select
                      value={irrigationForm.cropId}
                      onChange={(e) =>
                        setIrrigationForm({
                          ...irrigationForm,
                          cropId: e.target.value,
                        })
                      }
                      required
                      className="input-mobile"
                    >
                      <option value="">Select Crop</option>
                      {crops.map((crop) => (
                        <option key={crop.id} value={crop.id}>
                          {crop.name} {crop.variety && `(${crop.variety})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Date *
                    </label>
                    <Input
                      type="datetime-local"
                      value={irrigationForm.date}
                      onChange={(e) =>
                        setIrrigationForm({
                          ...irrigationForm,
                          date: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Duration (minutes) *
                    </label>
                    <Input
                      type="number"
                      value={irrigationForm.duration}
                      onChange={(e) =>
                        setIrrigationForm({
                          ...irrigationForm,
                          duration: e.target.value,
                        })
                      }
                      required
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Water Amount (liters) *
                    </label>
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
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Method
                    </label>
                    <select
                      value={irrigationForm.method}
                      onChange={(e) =>
                        setIrrigationForm({
                          ...irrigationForm,
                          method: e.target.value,
                        })
                      }
                      className="input-mobile"
                    >
                      <option value="">Select Method</option>
                      <option value="SPRINKLER">Sprinkler</option>
                      <option value="DRIP">Drip</option>
                      <option value="FLOOD">Flood</option>
                      <option value="MANUAL">Manual</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    value={irrigationForm.notes}
                    onChange={(e) =>
                      setIrrigationForm({
                        ...irrigationForm,
                        notes: e.target.value,
                      })
                    }
                    rows={3}
                    className="input-mobile"
                  />
                </div>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="btn-enhanced bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  <span className="mr-2">💧</span>
                  {formLoading ? "Logging..." : "Log Irrigation Activity"}
                </button>
              </form>
            )}

            {/* Fertilizer Form */}
            {activeTab === "fertilizer" && (
              <form onSubmit={handleFertilizerSubmit} className="space-y-6">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white text-lg">🌿</span>
                  </div>
                  <h2 className="text-heading text-gray-900">
                    Log Fertilizer Application
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Crop *
                    </label>
                    <select
                      value={fertilizerForm.cropId}
                      onChange={(e) =>
                        setFertilizerForm({
                          ...fertilizerForm,
                          cropId: e.target.value,
                        })
                      }
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Crop</option>
                      {crops.map((crop) => (
                        <option key={crop.id} value={crop.id}>
                          {crop.name} {crop.variety && `(${crop.variety})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Date *
                    </label>
                    <Input
                      type="datetime-local"
                      value={fertilizerForm.date}
                      onChange={(e) =>
                        setFertilizerForm({
                          ...fertilizerForm,
                          date: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Fertilizer Type *
                    </label>
                    <Input
                      type="text"
                      value={fertilizerForm.fertilizerType}
                      onChange={(e) =>
                        setFertilizerForm({
                          ...fertilizerForm,
                          fertilizerType: e.target.value,
                        })
                      }
                      required
                      placeholder="e.g., NPK 10-10-10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Amount (kg) *
                    </label>
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
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Application Method *
                    </label>
                    <select
                      value={fertilizerForm.applicationMethod}
                      onChange={(e) =>
                        setFertilizerForm({
                          ...fertilizerForm,
                          applicationMethod: e.target.value,
                        })
                      }
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Method</option>
                      <option value="BROADCAST">Broadcast</option>
                      <option value="BAND">Band</option>
                      <option value="FOLIAR">Foliar</option>
                      <option value="FERTIGATION">Fertigation</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    value={fertilizerForm.notes}
                    onChange={(e) =>
                      setFertilizerForm({
                        ...fertilizerForm,
                        notes: e.target.value,
                      })
                    }
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="btn-enhanced bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  <span className="mr-2">🌿</span>
                  {formLoading ? "Logging..." : "Log Fertilizer Application"}
                </button>
              </form>
            )}

            {/* Pest/Disease Form */}
            {activeTab === "pest-disease" && (
              <form onSubmit={handlePestDiseaseSubmit} className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">
                  Log Pest/Disease Issue
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Crop *
                    </label>
                    <select
                      value={pestDiseaseForm.cropId}
                      onChange={(e) =>
                        setPestDiseaseForm({
                          ...pestDiseaseForm,
                          cropId: e.target.value,
                        })
                      }
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Crop</option>
                      {crops.map((crop) => (
                        <option key={crop.id} value={crop.id}>
                          {crop.name} {crop.variety && `(${crop.variety})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Date *
                    </label>
                    <Input
                      type="datetime-local"
                      value={pestDiseaseForm.date}
                      onChange={(e) =>
                        setPestDiseaseForm({
                          ...pestDiseaseForm,
                          date: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Type *
                    </label>
                    <select
                      value={pestDiseaseForm.type}
                      onChange={(e) => {
                        const value = e.target.value as PestDiseaseType;
                        setPestDiseaseForm({
                          ...pestDiseaseForm,
                          type: value,
                        });
                      }}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {Object.values(PestDiseaseType).map((type) => (
                        <option key={type} value={type}>
                          {type.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Name *
                    </label>
                    <Input
                      type="text"
                      value={pestDiseaseForm.name}
                      onChange={(e) =>
                        setPestDiseaseForm({
                          ...pestDiseaseForm,
                          name: e.target.value,
                        })
                      }
                      required
                      placeholder="e.g., Aphids, Blight"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Severity *
                    </label>
                    <select
                      value={pestDiseaseForm.severity}
                      onChange={(e) => {
                        const value = e.target.value as keyof typeof Severity;
                        setPestDiseaseForm({
                          ...pestDiseaseForm,
                          severity: Severity[value],
                        });
                      }}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {Object.values(Severity).map((severity) => (
                        <option key={severity} value={severity}>
                          {severity}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Affected Area (m²) *
                    </label>
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
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Treatment *
                    </label>
                    <Input
                      type="text"
                      value={pestDiseaseForm.treatment}
                      onChange={(e) =>
                        setPestDiseaseForm({
                          ...pestDiseaseForm,
                          treatment: e.target.value,
                        })
                      }
                      required
                      placeholder="e.g., Neem oil spray"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    value={pestDiseaseForm.notes}
                    onChange={(e) =>
                      setPestDiseaseForm({
                        ...pestDiseaseForm,
                        notes: e.target.value,
                      })
                    }
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <Button type="submit" disabled={formLoading}>
                  {formLoading ? "Logging..." : "Log Issue"}
                </Button>
              </form>
            )}

            {/* Harvest Form */}
            {activeTab === "harvest" && (
              <form onSubmit={handleHarvestSubmit} className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Log Harvest</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Crop *
                    </label>
                    <select
                      value={harvestForm.cropId}
                      onChange={(e) =>
                        setHarvestForm({
                          ...harvestForm,
                          cropId: e.target.value,
                        })
                      }
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Crop</option>
                      {crops.map((crop) => (
                        <option key={crop.id} value={crop.id}>
                          {crop.name} {crop.variety && `(${crop.variety})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Harvest Date *
                    </label>
                    <Input
                      type="datetime-local"
                      value={harvestForm.harvestDate}
                      onChange={(e) =>
                        setHarvestForm({
                          ...harvestForm,
                          harvestDate: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Quantity *
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={harvestForm.quantity}
                      onChange={(e) =>
                        setHarvestForm({
                          ...harvestForm,
                          quantity: e.target.value,
                        })
                      }
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Unit *
                    </label>
                    <Input
                      type="text"
                      value={harvestForm.unit}
                      onChange={(e) =>
                        setHarvestForm({ ...harvestForm, unit: e.target.value })
                      }
                      required
                      placeholder="e.g., kg, lbs, pieces"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Quality Grade *
                    </label>
                    <select
                      value={harvestForm.qualityGrade}
                      onChange={(e) =>
                        setHarvestForm({
                          ...harvestForm,
                          qualityGrade: e.target.value,
                        })
                      }
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Grade</option>
                      <option value="EXCELLENT">Excellent</option>
                      <option value="GOOD">Good</option>
                      <option value="FAIR">Fair</option>
                      <option value="POOR">Poor</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    value={harvestForm.notes}
                    onChange={(e) =>
                      setHarvestForm({ ...harvestForm, notes: e.target.value })
                    }
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <Button type="submit" disabled={formLoading}>
                  {formLoading ? "Logging..." : "Log Harvest"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
