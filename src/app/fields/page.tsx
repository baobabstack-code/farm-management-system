"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import FieldForm from "@/components/fields/FieldForm";
import {
  PageHeader,
  FarmCard,
  FarmCardHeader,
  FarmCardContent,
  FarmButton,
  FarmBadge,
  LoadingState,
  EmptyState,
} from "@/components/ui/farm-theme";
import {
  Plus,
  MapPin,
  TrendingUp,
  Wheat,
  DollarSign,
  Activity,
  Eye,
  Edit,
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
  const router = useRouter();
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

  const handleFieldSaved = () => {
    fetchFields(); // Refresh the fields list
    setShowCreateForm(false);
  };

  const handleCreateCancel = () => {
    setShowCreateForm(false);
  };

  const getFieldStatusBadge = (field: Field) => {
    if (!field.isActive) {
      return <FarmBadge variant="neutral">Inactive</FarmBadge>;
    }
    if (field.stats?.activeCropsCount && field.stats.activeCropsCount > 0) {
      return <FarmBadge variant="success">Active Crops</FarmBadge>;
    }
    return <FarmBadge variant="info">Available</FarmBadge>;
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
    return <LoadingState message="Loading your fields..." />;
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="content-container padding-responsive-lg mobile-header-spacing content-spacing">
          <div className="farm-card border-destructive/20 bg-destructive/5">
            <div className="flex-center gap-content padding-responsive">
              <div className="flex-center w-10 h-10 bg-destructive/10 rounded-full">
                <span className="text-destructive text-lg">⚠️</span>
              </div>
              <div className="flex-1">
                <span className="text-destructive font-medium">
                  Error: {error}
                </span>
                <div className="mt-4">
                  <FarmButton onClick={fetchFields} variant="outline">
                    Try Again
                  </FarmButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="content-container padding-responsive-lg mobile-header-spacing content-spacing">
        <PageHeader
          title="Field Management"
          description="Manage your farm fields, track area, and monitor field activities"
          icon={<Map className="w-6 h-6" />}
          actions={
            <FarmButton
              variant="primary"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="w-4 h-4" />
              Add New Field
            </FarmButton>
          }
        />

        {/* Summary Statistics */}
        <div className="stats-container">
          <div className="stat-card">
            <div className="flex-start gap-content">
              <div className="w-12 h-12 bg-gradient-to-br from-info to-info/80 rounded-xl flex-center shadow-sm">
                <Map className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="stat-label">Total Fields</p>
                <p className="stat-value">{fields.length}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex-start gap-content">
              <div className="w-12 h-12 bg-gradient-to-br from-success to-success/80 rounded-xl flex-center shadow-sm">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="stat-label">Active Fields</p>
                <p className="stat-value">{activeFields}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex-start gap-content">
              <div className="w-12 h-12 bg-gradient-to-br from-warning to-warning/80 rounded-xl flex-center shadow-sm">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="stat-label">Total Area</p>
                <p className="stat-value">{totalArea}</p>
                <p className="stat-unit">acres</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex-start gap-content">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-hover rounded-xl flex-center shadow-sm">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="stat-label">Total Investment</p>
                <p className="stat-value">{formatCurrency(totalCosts)}</p>
              </div>
            </div>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Total Area</p>
          <p className="text-2xl font-bold text-gray-900">{totalArea}</p>
          <p className="text-xs text-gray-500">acres</p>
        </div>
        <TrendingUp className="w-8 h-8 text-yellow-500" />

        {/* Fields Grid */}
        {fields.length === 0 ? (
          <EmptyState
            icon={<Map className="text-4xl" />}
            title="No Fields Yet"
            description="Start by adding your first field to begin managing your farm operations."
            action={
              <FarmButton
                variant="success"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Field
              </FarmButton>
            }
          />
        ) : (
          <div className="farm-grid-auto">
            {fields.map((field) => (
              <FarmCard
                key={field.id}
                interactive
                onClick={() => router.push(`/fields/${field.id}`)}
              >
                <FarmCardHeader
                  title={field.name}
                  description={`${field.area} ${field.unit}`}
                  badge={getFieldStatusBadge(field)}
                />

                <FarmCardContent>
                  <div className="farm-card-content">
                    {field.address && (
                      <div className="flex-between py-2">
                        <div className="icon-text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="farm-text-muted">Address</span>
                        </div>
                        <span className="farm-text-body font-semibold">
                          {field.address}
                        </span>
                      </div>
                    )}

                    {field.soilType && (
                      <div className="flex-between py-2">
                        <span className="farm-text-muted">Soil Type</span>
                        <span className="farm-text-body font-semibold">
                          {field.soilType}
                        </span>
                      </div>
                    )}

                    {field.irrigationType && (
                      <div className="flex-between py-2">
                        <span className="farm-text-muted">Irrigation</span>
                        <span className="farm-text-body font-semibold">
                          {field.irrigationType}
                        </span>
                      </div>
                    )}

                    <div className="flex-between py-2">
                      <div className="icon-text-sm">
                        <Wheat className="w-4 h-4 text-muted-foreground" />
                        <span className="farm-text-muted">Active Crops</span>
                      </div>
                      <span className="farm-text-body font-semibold">
                        {field.stats?.activeCropsCount || 0}
                      </span>
                    </div>

                    <div className="flex-between py-2">
                      <div className="icon-text-sm">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="farm-text-muted">Total Costs</span>
                      </div>
                      <span className="farm-text-body font-semibold">
                        {formatCurrency(field.stats?.totalCosts || 0)}
                      </span>
                    </div>
                  </div>

                  <div className="farm-card-section">
                    <div className="action-buttons-sm">
                      <FarmButton
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/fields/${field.id}`);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </FarmButton>
                      <FarmButton
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/fields/${field.id}/edit`);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </FarmButton>
                    </div>
                  </div>
                </FarmCardContent>
              </FarmCard>
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
    </div>
  );
}
