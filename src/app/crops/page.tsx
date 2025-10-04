"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crop, CropStatus } from "@/types";

export default function CropsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    variety: "",
    plantingDate: "",
    expectedHarvestDate: "",
    area: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

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

  const handleCreateCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");

    try {
      const response = await fetch("/api/crops", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          variety: formData.variety || undefined,
          plantingDate: formData.plantingDate,
          expectedHarvestDate: formData.expectedHarvestDate,
          area: formData.area ? parseFloat(formData.area) : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCrops([data.data, ...crops]);
        setShowCreateForm(false);
        setFormData({
          name: "",
          variety: "",
          plantingDate: "",
          expectedHarvestDate: "",
          area: "",
        });
      } else {
        setError(data.error || "Failed to create crop");
      }
    } catch {
      setError("Error creating crop");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCrop = async (cropId: string) => {
    if (!confirm("Are you sure you want to delete this crop?")) {
      return;
    }

    try {
      const response = await fetch(`/api/crops/${cropId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setCrops(crops.filter((crop) => crop.id !== cropId));
      } else {
        setError(data.error || "Failed to delete crop");
      }
    } catch {
      setError("Error deleting crop");
    }
  };

  const getStatusColor = (status: CropStatus) => {
    switch (status) {
      case CropStatus.PLANTED:
        return "bg-blue-100 text-blue-800";
      case CropStatus.GROWING:
        return "bg-green-100 text-green-800";
      case CropStatus.FLOWERING:
        return "bg-yellow-100 text-yellow-800";
      case CropStatus.FRUITING:
        return "bg-orange-100 text-orange-800";
      case CropStatus.HARVESTED:
        return "bg-purple-100 text-purple-800";
      case CropStatus.COMPLETED:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDaysToHarvest = (expectedHarvestDate: Date) => {
    const today = new Date();
    const harvestDate = new Date(expectedHarvestDate);
    const diffTime = harvestDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="content-container py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <span className="text-white text-2xl">🌱</span>
              </div>
              <div>
                <h1 className="text-display text-gray-900">Crop Management</h1>
                <p className="text-gray-600 mt-1">
                  Monitor and manage your crops from planting to harvest
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-enhanced bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-lg hover:shadow-xl"
            >
              <span className="mr-2">➕</span>
              Add New Crop
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {showCreateForm && (
            <div className="mb-8 card-enhanced p-6 fade-in">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-sm">🌱</span>
                </div>
                <h2 className="text-heading text-gray-900">Add New Crop</h2>
              </div>
              <form onSubmit={handleCreateCrop} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Crop Name *
                    </label>
                    <Input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g., Tomatoes"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Variety
                    </label>
                    <Input
                      type="text"
                      value={formData.variety}
                      onChange={(e) =>
                        setFormData({ ...formData, variety: e.target.value })
                      }
                      placeholder="e.g., Cherry"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Planting Date *
                    </label>
                    <Input
                      type="date"
                      required
                      value={formData.plantingDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          plantingDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Expected Harvest Date *
                    </label>
                    <Input
                      type="date"
                      required
                      value={formData.expectedHarvestDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          expectedHarvestDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Area (square meters)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.area}
                      onChange={(e) =>
                        setFormData({ ...formData, area: e.target.value })
                      }
                      placeholder="e.g., 100"
                    />
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="btn-enhanced bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-sm hover:shadow disabled:opacity-50"
                  >
                    {formLoading ? "Creating..." : "Create Crop"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="btn-enhanced bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-500 shadow-sm hover:shadow"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {crops.length === 0 ? (
            <div className="card-enhanced p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🌱</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No crops found
              </h3>
              <p className="text-gray-600">
                Add your first crop to get started with farm management!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {crops.map((crop, index) => {
                const daysToHarvest = getDaysToHarvest(
                  crop.expectedHarvestDate
                );
                return (
                  <div
                    key={crop.id}
                    className={`card-enhanced p-6 stagger-item fade-in hover:scale-105 transition-transform duration-200 cursor-pointer`}
                    onClick={() => router.push(`/crops/${crop.id}`)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center">
                          <span className="text-white text-xl">🌱</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {crop.name}
                          </h3>
                          {crop.variety && (
                            <p className="text-sm text-gray-600">
                              {crop.variety}
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(crop.status)}`}
                      >
                        {crop.status}
                      </span>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Planted</span>
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(crop.plantingDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Harvest in
                        </span>
                        <span
                          className={`text-sm font-medium ${
                            daysToHarvest <= 7
                              ? "text-orange-600"
                              : daysToHarvest <= 30
                                ? "text-yellow-600"
                                : "text-green-600"
                          }`}
                        >
                          {daysToHarvest} days
                        </span>
                      </div>
                      {crop.area && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Area</span>
                          <span className="text-sm font-medium text-gray-900">
                            {crop.area} m²
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/crops/${crop.id}`);
                        }}
                        className="flex-1 btn-enhanced bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 text-sm py-2"
                      >
                        <span className="mr-1">👁️</span>
                        View Details
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCrop(crop.id);
                        }}
                        className="btn-enhanced bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 text-sm py-2 px-3"
                      >
                        <span>🗑️</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
