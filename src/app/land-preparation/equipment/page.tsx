"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wrench,
  Plus,
  ArrowLeft,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Clock,
  AlertTriangle,
  Fuel,
  Settings,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Equipment {
  id: string;
  name: string;
  equipmentType: string;
  category: string;
  manufacturer?: string;
  model?: string;
  year?: number;
  serialNumber?: string;
  status: string;
  condition: string;
  purchasePrice?: number;
  currentValue?: number;
  hoursUsed: number;
  lastServiceDate?: string;
  nextServiceDue?: string;
  serviceInterval?: number;
  maintenanceRecords?: {
    id: string;
    date: string;
    type: string;
    cost: number;
    description?: string;
  }[];
  fuelLogs?: {
    id: string;
    date: string;
    gallons: number;
    cost: number;
    hoursAtFillup: number;
  }[];
}

interface EquipmentFilters {
  search: string;
  category: string;
  status: string;
  condition: string;
}

export default function EquipmentManagement() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EquipmentFilters>({
    search: "",
    category: "all",
    status: "all",
    condition: "all",
  });

  const categories = [
    "TRACTOR",
    "IMPLEMENT",
    "HARVESTER",
    "PLANTER",
    "CULTIVATOR",
    "OTHER",
  ];
  const statuses = ["ACTIVE", "IDLE", "MAINTENANCE", "RETIRED"];
  const conditions = ["EXCELLENT", "GOOD", "FAIR", "POOR", "NEEDS_REPAIR"];

  const applyFilters = useCallback(() => {
    let filtered = [...equipment];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (eq) =>
          eq.name.toLowerCase().includes(searchTerm) ||
          eq.equipmentType.toLowerCase().includes(searchTerm) ||
          eq.manufacturer?.toLowerCase().includes(searchTerm) ||
          eq.model?.toLowerCase().includes(searchTerm)
      );
    }

    // Category filter
    if (filters.category !== "all") {
      filtered = filtered.filter((eq) => eq.category === filters.category);
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((eq) => eq.status === filters.status);
    }

    // Condition filter
    if (filters.condition !== "all") {
      filtered = filtered.filter((eq) => eq.condition === filters.condition);
    }

    setFilteredEquipment(filtered);
  }, [equipment, filters]);

  useEffect(() => {
    if (isLoaded && user) {
      fetchEquipment();
    }
  }, [isLoaded, user]);

  useEffect(() => {
    applyFilters();
  }, [equipment, filters, applyFilters]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "/api/land-preparation/equipment?includeDetails=true"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch equipment");
      }

      const data = await response.json();
      setEquipment(data.data.equipment || []);
      setError(null);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch equipment"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof EquipmentFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "IDLE":
        return "bg-blue-100 text-blue-800";
      case "MAINTENANCE":
        return "bg-yellow-100 text-yellow-800";
      case "RETIRED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "EXCELLENT":
        return "bg-green-100 text-green-800";
      case "GOOD":
        return "bg-green-100 text-green-700";
      case "FAIR":
        return "bg-yellow-100 text-yellow-800";
      case "POOR":
        return "bg-orange-100 text-orange-800";
      case "NEEDS_REPAIR":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isMaintenanceDue = (equipment: Equipment): boolean => {
    if (!equipment.nextServiceDue) return false;
    const dueDate = new Date(equipment.nextServiceDue);
    const today = new Date();
    return dueDate <= today;
  };

  const isMaintenanceOverdue = (equipment: Equipment): boolean => {
    if (!equipment.nextServiceDue) return false;
    const dueDate = new Date(equipment.nextServiceDue);
    const today = new Date();
    const daysDiff = (today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24);
    return daysDiff > 7; // Consider overdue after 7 days
  };

  if (!isLoaded || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading equipment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            Please sign in to manage equipment.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          onClick={() => router.push("/land-preparation")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <Wrench className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Equipment Management
          </h1>
        </div>
        <div className="flex-1"></div>
        <Button
          onClick={() => router.push("/land-preparation/equipment/add")}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Equipment
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search equipment..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.category}
              onValueChange={(value) => handleFilterChange("category", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat
                      .replace("_", " ")
                      .toLowerCase()
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status
                      .replace("_", " ")
                      .toLowerCase()
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.condition}
              onValueChange={(value) => handleFilterChange("condition", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Conditions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conditions</SelectItem>
                {conditions.map((condition) => (
                  <SelectItem key={condition} value={condition}>
                    {condition
                      .replace("_", " ")
                      .toLowerCase()
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Grid */}
      {filteredEquipment.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {equipment.length === 0 ? "No Equipment Found" : "No Results"}
            </h3>
            <p className="text-gray-600 mb-6">
              {equipment.length === 0
                ? "Add your first piece of equipment to get started."
                : "Try adjusting your filters to see more results."}
            </p>
            {equipment.length === 0 && (
              <Button
                onClick={() => router.push("/land-preparation/equipment/add")}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Equipment
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipment.map((eq) => (
            <Card key={eq.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {eq.name}
                    </h3>
                    <p className="text-sm text-gray-600">{eq.equipmentType}</p>
                    {eq.manufacturer && eq.model && (
                      <p className="text-xs text-gray-500">
                        {eq.manufacturer} {eq.model} {eq.year && `(${eq.year})`}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge className={getStatusColor(eq.status)}>
                      {eq.status}
                    </Badge>
                    <Badge className={getConditionColor(eq.condition)}>
                      {eq.condition}
                    </Badge>
                  </div>
                </div>

                {/* Maintenance Alert */}
                {(isMaintenanceDue(eq) || isMaintenanceOverdue(eq)) && (
                  <div className="mb-4">
                    <Alert
                      className={`border-${isMaintenanceOverdue(eq) ? "red" : "yellow"}-200 bg-${isMaintenanceOverdue(eq) ? "red" : "yellow"}-50`}
                    >
                      <AlertTriangle
                        className={`w-4 h-4 text-${isMaintenanceOverdue(eq) ? "red" : "yellow"}-600`}
                      />
                      <AlertDescription
                        className={`text-${isMaintenanceOverdue(eq) ? "red" : "yellow"}-800 text-sm`}
                      >
                        {isMaintenanceOverdue(eq)
                          ? "Maintenance Overdue"
                          : "Maintenance Due"}
                        {eq.nextServiceDue &&
                          ` (${formatDate(eq.nextServiceDue)})`}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Stats */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Hours Used</span>
                    </div>
                    <span className="font-medium">
                      {eq.hoursUsed.toLocaleString()}
                    </span>
                  </div>

                  {eq.currentValue && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Value</span>
                      </div>
                      <span className="font-medium">
                        {formatCurrency(eq.currentValue)}
                      </span>
                    </div>
                  )}

                  {eq.lastServiceDate && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Last Service</span>
                      </div>
                      <span className="font-medium">
                        {formatDate(eq.lastServiceDate)}
                      </span>
                    </div>
                  )}

                  {eq.fuelLogs && eq.fuelLogs.length > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Fuel className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Fuel Records</span>
                      </div>
                      <span className="font-medium">{eq.fuelLogs.length}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push(`/land-preparation/equipment/${eq.id}`)
                    }
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push(`/land-preparation/equipment/${eq.id}/edit`)
                    }
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:border-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
