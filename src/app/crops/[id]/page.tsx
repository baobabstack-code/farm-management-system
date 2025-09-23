"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crop, CropStatus } from "@/types";

export default function CropDetailPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const cropId = params.id as string;

  const [crop, setCrop] = useState<Crop | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    variety: string;
    plantingDate: string;
    expectedHarvestDate: string;
    actualHarvestDate: string;
    status: CropStatus;
    area: string;
  }>({
    name: "",
    variety: "",
    plantingDate: "",
    expectedHarvestDate: "",
    actualHarvestDate: "",
    status: CropStatus.PLANTED,
    area: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchCrop = useCallback(async () => {
    try {
      const response = await fetch(`/api/crops/${cropId}`);
      const data = await response.json();

      if (data.success) {
        setCrop(data.data);
        setFormData({
          name: data.data.name,
          variety: data.data.variety || "",
          plantingDate: new Date(data.data.plantingDate)
            .toISOString()
            .split("T")[0],
          expectedHarvestDate: new Date(data.data.expectedHarvestDate)
            .toISOString()
            .split("T")[0],
          actualHarvestDate: data.data.actualHarvestDate
            ? new Date(data.data.actualHarvestDate).toISOString().split("T")[0]
            : "",
          status: data.data.status,
          area: data.data.area?.toString() || "",
        });
      } else {
        setError("Failed to fetch crop details");
      }
    } catch {
      setError("Error fetching crop details");
    } finally {
      setLoading(false);
    }
  }, [cropId]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push("/sign-in");
      return;
    }

    if (user && cropId) {
      fetchCrop();
    }
  }, [user, isLoaded, router, cropId, fetchCrop]);

  const handleUpdateCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");

    try {
      const updateData: Record<string, unknown> = {
        name: formData.name,
        variety: formData.variety || undefined,
        plantingDate: formData.plantingDate,
        expectedHarvestDate: formData.expectedHarvestDate,
        status: formData.status,
        area: formData.area ? parseFloat(formData.area) : undefined,
      };

      if (formData.actualHarvestDate) {
        updateData.actualHarvestDate = formData.actualHarvestDate;
      }

      const response = await fetch(`/api/crops/${cropId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (data.success) {
        setCrop(data.data);
        setEditing(false);
      } else {
        setError(data.error || "Failed to update crop");
      }
    } catch {
      setError("Error updating crop");
    } finally {
      setFormLoading(false);
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

  if (!crop) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center text-red-600">
              {error || "Crop not found"}
            </div>
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
            <div>
              <button
                onClick={() => router.push("/crops")}
                className="text-blue-600 hover:text-blue-800 mb-2"
              >
                ← Back to Crops
              </button>
              <h1 className="text-3xl font-bold text-gray-900">
                {crop.name} {crop.variety && `(${crop.variety})`}
              </h1>
            </div>
            <div className="space-x-4">
              {!editing && (
                <Button
                  onClick={() => setEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Edit Crop
                </Button>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="bg-white shadow rounded-lg p-6">
            {editing ? (
              <form onSubmit={handleUpdateCrop} className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">
                  Edit Crop Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as unknown as CropStatus,
                        })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {Object.values(CropStatus).map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
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
                      Actual Harvest Date
                    </label>
                    <Input
                      type="date"
                      value={formData.actualHarvestDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          actualHarvestDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex space-x-4">
                  <Button
                    type="submit"
                    disabled={formLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {formLoading ? "Updating..." : "Update Crop"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="bg-gray-600 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Status
                    </h3>
                    <span
                      className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                        crop.status
                      )}`}
                    >
                      {crop.status}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Planting Date
                    </h3>
                    <p className="text-sm text-gray-900">
                      {new Date(crop.plantingDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Expected Harvest
                    </h3>
                    <p className="text-sm text-gray-900">
                      {new Date(crop.expectedHarvestDate).toLocaleDateString()}
                    </p>
                  </div>
                  {crop.actualHarvestDate && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Actual Harvest
                      </h3>
                      <p className="text-sm text-gray-900">
                        {new Date(crop.actualHarvestDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Days to Harvest
                    </h3>
                    <p className="text-sm text-gray-900">
                      {crop.actualHarvestDate
                        ? "Harvested"
                        : `${getDaysToHarvest(crop.expectedHarvestDate)} days`}
                    </p>
                  </div>
                  {crop.area && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Area
                      </h3>
                      <p className="text-sm text-gray-900">{crop.area} m²</p>
                    </div>
                  )}
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      onClick={() => router.push(`/tasks?crop=${crop.id}`)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      View Tasks
                    </Button>
                    <Button
                      onClick={() => router.push(`/activities?crop=${crop.id}`)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Log Activity
                    </Button>
                    <Button
                      onClick={() => router.push(`/reports?crop=${crop.id}`)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      View Reports
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
