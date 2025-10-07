"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FieldForm from "@/components/fields/FieldForm";
import {
  Plus,
  MapPin,
  TrendingUp,
  Wheat,
  DollarSign,
  Activity,
  Eye,
  Edit,
  MoreVertical,
  Map,
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
    }>;
  };
}

export default function FieldsPage() {
  const { user } = useUser();
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchFields();
    }
  }, [user]);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/fields?includeStats=true");
      if (!response.ok) throw new Error("Failed to fetch fields");
      const data = await response.json();
      setFields(data);
    } catch (error) {
      console.error("Error fetching fields:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch fields"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFieldSaved = (savedField: Field) => {
    fetchFields(); // Refresh the fields list
    setShowCreateForm(false);
  };

  const handleCreateCancel = () => {
    setShowCreateForm(false);
  };

  const getFieldStatusBadge = (field: Field) => {
    if (!field.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (field.stats?.activeCropsCount && field.stats.activeCropsCount > 0) {
      return (
        <Badge className="bg-green-100 text-green-800">Active Crops</Badge>
      );
    }
    return <Badge variant="outline">Available</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const totalArea = fields.reduce((sum, field) => sum + field.area, 0);
  const activeFields = fields.filter((field) => field.isActive).length;
  const totalCosts = fields.reduce(
    (sum, field) => sum + (field.stats?.totalCosts || 0),
    0
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your fields...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-800">Error: {error}</p>
            <Button onClick={fetchFields} variant="outline" className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Map className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">Field Management</h1>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Field
        </Button>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Fields
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {fields.length}
                </p>
              </div>
              <Map className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Fields
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {activeFields}
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Area</p>
                <p className="text-2xl font-bold text-gray-900">{totalArea}</p>
                <p className="text-xs text-gray-500">acres</p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-500" />
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
                  {formatCurrency(totalCosts)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fields Grid */}
      {fields.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Map className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Fields Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start by adding your first field to begin managing your farm
              operations.
            </p>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Field
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fields.map((field) => (
            <Card key={field.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{field.name}</h3>
                    <p className="text-sm text-gray-600">
                      {field.area} {field.unit}
                    </p>
                  </div>
                  {getFieldStatusBadge(field)}
                </div>
              </CardHeader>

              <CardContent>
                {/* Field Details */}
                <div className="space-y-3 mb-4">
                  {field.address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      {field.address}
                    </div>
                  )}

                  {field.soilType && (
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="w-4 h-4 mr-2 bg-amber-200 rounded" />
                      Soil: {field.soilType}
                    </div>
                  )}

                  {field.irrigationType && (
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="w-4 h-4 mr-2 bg-blue-200 rounded" />
                      Irrigation: {field.irrigationType}
                    </div>
                  )}
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <Wheat className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-lg font-semibold">
                      {field.stats?.activeCropsCount || 0}
                    </p>
                    <p className="text-xs text-gray-600">Active Crops</p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <DollarSign className="w-4 h-4 text-purple-500" />
                    </div>
                    <p className="text-lg font-semibold">
                      {formatCurrency(field.stats?.totalCosts || 0)}
                    </p>
                    <p className="text-xs text-gray-600">Total Costs</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      (window.location.href = `/fields/${field.id}`)
                    }
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      (window.location.href = `/fields/${field.id}/edit`)
                    }
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>

                {/* Recent Activity */}
                {field.stats?.recentActivity &&
                  field.stats.recentActivity.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs font-medium text-gray-600 mb-2">
                        Recent Activity
                      </p>
                      <div className="space-y-1">
                        {field.stats.recentActivity
                          .slice(0, 2)
                          .map((activity, idx) => (
                            <p key={idx} className="text-xs text-gray-500">
                              {activity.operationType} •{" "}
                              {new Date(
                                activity.operationDate
                              ).toLocaleDateString()}
                            </p>
                          ))}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Field Form */}
      <FieldForm
        isOpen={showCreateForm}
        mode="create"
        onSave={handleFieldSaved}
        onCancel={handleCreateCancel}
      />
    </div>
  );
}
