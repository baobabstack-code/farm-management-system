"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import FieldForm from "@/components/fields/FieldForm";
import {
  ArrowLeft,
  Edit,
  MapPin,
  TrendingUp,
  Wheat,
  DollarSign,
  Activity,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";

interface Field {
  id: string;
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
  createdAt: string;
  updatedAt: string;
  _count?: {
    crops: number;
    soilTests: number;
    soilAmendments: number;
    tillageOps: number;
    costEntries: number;
  };
  stats?: {
    activeCropsCount: number;
    totalCosts: number;
    recentActivity: Array<{
      operationType: string;
      operationDate: string;
      cropType?: string;
    }>;
  };
}

export default function FieldDetailsPage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const fieldId = params.id as string;

  const [field, setField] = useState<Field | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchField = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/fields/${fieldId}?includeStats=true`);
      if (!response.ok) {
        if (response.status === 404) {
          setError("Field not found");
        } else {
          throw new Error("Failed to fetch field");
        }
        return;
      }
      const data = await response.json();
      setField(data);
    } catch (error) {
      console.error("Error fetching field:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch field"
      );
    } finally {
      setLoading(false);
    }
  }, [fieldId]);

  useEffect(() => {
    if (user && fieldId) {
      fetchField();
    }
  }, [user, fieldId, fetchField]);

  const handleFieldUpdated = (updatedFieldData: any) => {
    // Merge the updated field data with existing field to preserve all properties
    setField((prev) =>
      prev ? { ...prev, ...updatedFieldData } : updatedFieldData
    );
    setShowEditForm(false);
  };

  const handleToggleStatus = async () => {
    if (!field) return;

    try {
      const response = await fetch(`/api/fields/${field.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...field,
          isActive: !field.isActive,
        }),
      });

      if (!response.ok) throw new Error("Failed to update field status");

      const updatedField = await response.json();
      setField(updatedField);
    } catch (error) {
      console.error("Error updating field status:", error);
    }
  };

  const handleDeleteField = async () => {
    if (!field) return;

    try {
      const response = await fetch(`/api/fields/${field.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete field");

      // Redirect to fields list after successful deletion
      router.push("/fields");
    } catch (error) {
      console.error("Error deleting field:", error);
      setError("Failed to delete field");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading field details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !field) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/fields")}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Fields
          </Button>
        </div>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-red-900">Error</h3>
            </div>
            <p className="text-red-800 mb-4">{error || "Field not found"}</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.push("/fields")}>
                Go to Fields List
              </Button>
              {error !== "Field not found" && (
                <Button
                  onClick={fetchField}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Try Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/fields")}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{field.name}</h1>
            <Badge
              variant={field.isActive ? "default" : "secondary"}
              className={field.isActive ? "bg-green-100 text-green-800" : ""}
            >
              {field.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleToggleStatus}
            className="flex items-center"
          >
            {field.isActive ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Deactivate
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Activate
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowEditForm(true)}
            className="flex items-center"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Field Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Field Area</p>
                <p className="text-2xl font-bold text-gray-900">
                  {field.area} {field.unit}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Crops
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {field.stats?.activeCropsCount || 0}
                </p>
              </div>
              <Wheat className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Investment
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(field.stats?.totalCosts || 0)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Operations
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {(field._count?.tillageOps || 0) + (field._count?.crops || 0)}
                </p>
              </div>
              <Activity className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Field Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Details */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Field Details</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {field.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Description
                    </p>
                    <p className="text-gray-900">{field.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Area</p>
                    <p className="text-gray-900">
                      {field.area} {field.unit}
                    </p>
                  </div>

                  {field.soilType && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Soil Type
                      </p>
                      <p className="text-gray-900">{field.soilType}</p>
                    </div>
                  )}

                  {field.drainageType && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Drainage
                      </p>
                      <p className="text-gray-900">{field.drainageType}</p>
                    </div>
                  )}

                  {field.irrigationType && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Irrigation
                      </p>
                      <p className="text-gray-900">{field.irrigationType}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Created</p>
                    <p className="text-gray-900">
                      {formatDate(field.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Last Updated
                    </p>
                    <p className="text-gray-900">
                      {formatDate(field.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          {(field.address || field.latitude || field.longitude) && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Location
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {field.address && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Address
                      </p>
                      <p className="text-gray-900">{field.address}</p>
                    </div>
                  )}

                  {(field.latitude || field.longitude) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {field.latitude && (
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Latitude
                          </p>
                          <p className="text-gray-900">{field.latitude}°</p>
                        </div>
                      )}
                      {field.longitude && (
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Longitude
                          </p>
                          <p className="text-gray-900">{field.longitude}°</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Activity & Stats */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Recent Activity
              </h3>
            </CardHeader>
            <CardContent>
              {field.stats?.recentActivity &&
              field.stats.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {field.stats.recentActivity.map((activity, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {activity.operationType}
                        </p>
                        {activity.cropType && (
                          <p className="text-sm text-gray-600">
                            {activity.cropType}
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {formatDate(activity.operationDate)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Operation Counts */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Operations Summary</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Crops</span>
                  <span className="font-medium">
                    {field._count?.crops || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tillage Operations</span>
                  <span className="font-medium">
                    {field._count?.tillageOps || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Soil Tests</span>
                  <span className="font-medium">
                    {field._count?.soilTests || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Soil Amendments</span>
                  <span className="font-medium">
                    {field._count?.soilAmendments || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Cost Entries</span>
                  <span className="font-medium">
                    {field._count?.costEntries || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Form Modal */}
      <FieldForm
        isOpen={showEditForm}
        mode="edit"
        field={field}
        onSave={handleFieldUpdated}
        onCancel={() => setShowEditForm(false)}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <h2 className="text-xl font-semibold text-red-900">
                Delete Field
              </h2>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
                <p className="text-gray-700">
                  Are you sure you want to delete &quot;{field.name}&quot;? This
                  action cannot be undone.
                </p>
              </div>

              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  This will also delete all associated crops, operations, and
                  data for this field.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteField}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Delete Field
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
