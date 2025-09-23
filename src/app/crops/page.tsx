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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Crop Management
            </h1>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              Add New Crop
            </Button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {showCreateForm && (
            <div className="mb-6 bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Add New Crop</h2>
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
                <div className="flex space-x-4">
                  <Button
                    type="submit"
                    disabled={formLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {formLoading ? "Creating..." : "Create Crop"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="bg-gray-600 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white shadow rounded-lg">
            {crops.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No crops found. Add your first crop to get started!
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Crop
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Planting Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Days to Harvest
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Area
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {crops.map((crop) => (
                      <tr key={crop.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {crop.name}
                            </div>
                            {crop.variety && (
                              <div className="text-sm text-gray-500">
                                {crop.variety}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              crop.status
                            )}`}
                          >
                            {crop.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(crop.plantingDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getDaysToHarvest(crop.expectedHarvestDate)} days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {crop.area ? `${crop.area} m²` : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => router.push(`/crops/${crop.id}`)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteCrop(crop.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
