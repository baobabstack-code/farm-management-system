"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  PageContainer,
  FarmCard,
  FarmCardHeader,
  FarmCardContent,
  FarmButton,
  FarmBadge,
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/ui/farm-theme";
import { Wrench, Plus, Calendar, DollarSign, Gauge } from "lucide-react";

interface Equipment {
  id: string;
  name: string;
  equipmentType: string;
  category: string;
  brand?: string;
  model?: string;
  status: string;
  condition: string;
  hoursUsed: number;
  lastServiceDate?: string;
  nextServiceDue?: string;
  purchasePrice?: number;
  currentValue?: number;
  createdAt: string;
}

export default function EquipmentPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push("/sign-in");
      return;
    }

    fetchEquipment();
  }, [user, isLoaded, router]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "/api/land-preparation/equipment?includeStats=true"
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setEquipment(data.data || []);
      } else {
        setError(data.error || "Failed to fetch equipment");
      }
    } catch (err) {
      console.error("Equipment fetch error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch equipment"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <FarmBadge variant="success">Active</FarmBadge>;
      case "maintenance":
        return <FarmBadge variant="warning">Maintenance</FarmBadge>;
      case "repair":
        return <FarmBadge variant="error">Repair</FarmBadge>;
      case "retired":
        return <FarmBadge variant="neutral">Retired</FarmBadge>;
      default:
        return <FarmBadge variant="neutral">{status}</FarmBadge>;
    }
  };

  const getConditionBadge = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "excellent":
        return <FarmBadge variant="success">Excellent</FarmBadge>;
      case "good":
        return <FarmBadge variant="success">Good</FarmBadge>;
      case "fair":
        return <FarmBadge variant="warning">Fair</FarmBadge>;
      case "poor":
        return <FarmBadge variant="error">Poor</FarmBadge>;
      case "needs_repair":
        return <FarmBadge variant="error">Needs Repair</FarmBadge>;
      default:
        return <FarmBadge variant="neutral">{condition}</FarmBadge>;
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  if (!isLoaded || loading) {
    return <LoadingState message="Loading equipment..." />;
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorState
          title="Equipment Loading Error"
          message={error}
          onRetry={fetchEquipment}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="farm-page-header">
        <div className="farm-page-title-section">
          <div className="farm-page-title-group">
            <div className="farm-page-icon bg-gradient-to-br from-warning to-warning/80">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div className="farm-page-title-text">
              <h1 className="farm-heading-display">Equipment Management</h1>
              <p className="farm-text-muted mt-1">
                Track and manage your farm equipment, maintenance, and usage
              </p>
            </div>
          </div>
          <FarmButton
            variant="primary"
            onClick={() => router.push("/equipment/add")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Equipment
          </FarmButton>
        </div>
      </div>

      {equipment.length === 0 ? (
        <EmptyState
          icon={<Wrench className="text-4xl" />}
          title="No Equipment Found"
          description="Add your first piece of equipment to start tracking maintenance and usage."
          action={
            <FarmButton
              variant="primary"
              onClick={() => router.push("/equipment/add")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Equipment
            </FarmButton>
          }
        />
      ) : (
        <div className="farm-grid farm-grid-responsive">
          {equipment.map((item) => (
            <FarmCard
              key={item.id}
              interactive
              onClick={() => router.push(`/equipment/${item.id}`)}
            >
              <FarmCardHeader
                title={item.name}
                description={
                  `${item.brand || ""} ${item.model || ""}`.trim() ||
                  "Equipment"
                }
                badge={getStatusBadge(item.status)}
              />
              <FarmCardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="farm-text-muted">Type</span>
                    <span className="farm-text-body font-medium">
                      {item.equipmentType}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="farm-text-muted">Category</span>
                    <span className="farm-text-body font-medium">
                      {item.category}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="farm-text-muted">Condition</span>
                    {getConditionBadge(item.condition)}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-muted-foreground" />
                      <span className="farm-text-muted">Hours Used</span>
                    </div>
                    <span className="farm-text-body font-medium">
                      {item.hoursUsed.toLocaleString()}
                    </span>
                  </div>

                  {item.nextServiceDue && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="farm-text-muted">Next Service</span>
                      </div>
                      <span className="farm-text-body font-medium">
                        {formatDate(item.nextServiceDue)}
                      </span>
                    </div>
                  )}

                  {item.currentValue && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="farm-text-muted">Current Value</span>
                      </div>
                      <span className="farm-text-body font-medium">
                        {formatCurrency(item.currentValue)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex gap-2">
                    <FarmButton
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/equipment/${item.id}`);
                      }}
                    >
                      View Details
                    </FarmButton>
                    <FarmButton
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/equipment/${item.id}?tab=maintenance`);
                      }}
                    >
                      Maintenance
                    </FarmButton>
                  </div>
                </div>
              </FarmCardContent>
            </FarmCard>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
