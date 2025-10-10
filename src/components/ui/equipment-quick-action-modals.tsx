"use client";

import { useState, useEffect, useRef } from "react";
import {
  FarmCard,
  FarmCardHeader,
  FarmCardContent,
  FarmButton,
  FarmInput,
  FarmSelect,
  FarmTextarea,
} from "@/components/ui/farm-theme";
import { X, Loader2, Wrench, Fuel, Clock, Calendar } from "lucide-react";

// Base Modal Component (reused from other modals)
interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function BaseModal({ isOpen, onClose, title, icon, children }: BaseModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={dialogRef}
        className="bg-background border border-border rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <FarmCard className="border-0 shadow-none">
          <FarmCardHeader
            title={title}
            badge={
              <div className="flex items-center gap-2">
                {icon}
                <FarmButton
                  ref={cancelButtonRef}
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </FarmButton>
              </div>
            }
          />
          <FarmCardContent>{children}</FarmCardContent>
        </FarmCard>
      </div>
    </div>
  );
}

// Maintenance Log Modal
interface MaintenanceLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentId: string;
  equipmentName: string;
  onSuccess: () => void;
}

export function MaintenanceLogModal({
  isOpen,
  onClose,
  equipmentId,
  equipmentName,
  onSuccess,
}: MaintenanceLogModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    maintenanceType: "",
    description: "",
    cost: "",
    performedBy: "",
    hoursAtMaintenance: "",
    nextServiceDue: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/maintenance-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipmentId,
          date: formData.date,
          maintenanceType: formData.maintenanceType,
          description: formData.description,
          cost: formData.cost ? parseFloat(formData.cost) : undefined,
          performedBy: formData.performedBy || undefined,
          hoursAtMaintenance: formData.hoursAtMaintenance
            ? parseInt(formData.hoursAtMaintenance)
            : undefined,
          nextServiceDue: formData.nextServiceDue || undefined,
          notes: formData.notes || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          date: new Date().toISOString().split("T")[0],
          maintenanceType: "",
          description: "",
          cost: "",
          performedBy: "",
          hoursAtMaintenance: "",
          nextServiceDue: "",
          notes: "",
        });
      } else {
        throw new Error(data.error || "Failed to log maintenance");
      }
    } catch (error) {
      console.error("Error logging maintenance:", error);
      alert(
        error instanceof Error ? error.message : "Failed to log maintenance"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Log Maintenance - ${equipmentName}`}
      icon={<Wrench className="w-5 h-5 text-orange-500" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Date *</label>
          <FarmInput
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Maintenance Type *
          </label>
          <FarmSelect
            value={formData.maintenanceType}
            onChange={(e) =>
              setFormData({ ...formData, maintenanceType: e.target.value })
            }
            required
          >
            <option value="">Select maintenance type</option>
            <option value="ROUTINE">Routine Service</option>
            <option value="REPAIR">Repair</option>
            <option value="INSPECTION">Inspection</option>
            <option value="OIL_CHANGE">Oil Change</option>
            <option value="FILTER_REPLACEMENT">Filter Replacement</option>
            <option value="TIRE_MAINTENANCE">Tire Maintenance</option>
            <option value="HYDRAULIC_SERVICE">Hydraulic Service</option>
            <option value="ENGINE_SERVICE">Engine Service</option>
            <option value="OTHER">Other</option>
          </FarmSelect>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Description *
          </label>
          <FarmInput
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Brief description of maintenance performed"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Cost ($)</label>
            <FarmInput
              type="number"
              step="0.01"
              min="0"
              value={formData.cost}
              onChange={(e) =>
                setFormData({ ...formData, cost: e.target.value })
              }
              placeholder="150.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Hours at Maintenance
            </label>
            <FarmInput
              type="number"
              min="0"
              value={formData.hoursAtMaintenance}
              onChange={(e) =>
                setFormData({ ...formData, hoursAtMaintenance: e.target.value })
              }
              placeholder="1250"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Performed By</label>
          <FarmInput
            value={formData.performedBy}
            onChange={(e) =>
              setFormData({ ...formData, performedBy: e.target.value })
            }
            placeholder="Technician name or service center"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Next Service Due
          </label>
          <FarmInput
            type="date"
            value={formData.nextServiceDue}
            onChange={(e) =>
              setFormData({ ...formData, nextServiceDue: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Notes (Optional)
          </label>
          <FarmTextarea
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Additional details, parts replaced, observations..."
            rows={3}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <FarmButton
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </FarmButton>
          <FarmButton type="submit" disabled={loading} className="flex-1">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Log Maintenance
          </FarmButton>
        </div>
      </form>
    </BaseModal>
  );
}

// Fuel Log Modal
interface FuelLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentId: string;
  equipmentName: string;
  onSuccess: () => void;
}

export function FuelLogModal({
  isOpen,
  onClose,
  equipmentId,
  equipmentName,
  onSuccess,
}: FuelLogModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    fuelType: "DIESEL",
    quantity: "",
    unit: "LITERS",
    costPerUnit: "",
    totalCost: "",
    hoursAtFueling: "",
    location: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/fuel-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipmentId,
          date: formData.date,
          fuelType: formData.fuelType,
          quantity: parseFloat(formData.quantity),
          unit: formData.unit,
          costPerUnit: formData.costPerUnit
            ? parseFloat(formData.costPerUnit)
            : undefined,
          totalCost: formData.totalCost
            ? parseFloat(formData.totalCost)
            : undefined,
          hoursAtFueling: formData.hoursAtFueling
            ? parseInt(formData.hoursAtFueling)
            : undefined,
          location: formData.location || undefined,
          notes: formData.notes || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          date: new Date().toISOString().split("T")[0],
          fuelType: "DIESEL",
          quantity: "",
          unit: "LITERS",
          costPerUnit: "",
          totalCost: "",
          hoursAtFueling: "",
          location: "",
          notes: "",
        });
      } else {
        throw new Error(data.error || "Failed to log fuel usage");
      }
    } catch (error) {
      console.error("Error logging fuel usage:", error);
      alert(
        error instanceof Error ? error.message : "Failed to log fuel usage"
      );
    } finally {
      setLoading(false);
    }
  };

  // Auto-calculate total cost when quantity and cost per unit change
  useEffect(() => {
    if (formData.quantity && formData.costPerUnit) {
      const total =
        parseFloat(formData.quantity) * parseFloat(formData.costPerUnit);
      setFormData((prev) => ({ ...prev, totalCost: total.toFixed(2) }));
    }
  }, [formData.quantity, formData.costPerUnit]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Log Fuel Usage - ${equipmentName}`}
      icon={<Fuel className="w-5 h-5 text-blue-500" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Date *</label>
          <FarmInput
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Fuel Type</label>
            <FarmSelect
              value={formData.fuelType}
              onChange={(e) =>
                setFormData({ ...formData, fuelType: e.target.value })
              }
            >
              <option value="DIESEL">Diesel</option>
              <option value="GASOLINE">Gasoline</option>
              <option value="PROPANE">Propane</option>
              <option value="ELECTRIC">Electric</option>
            </FarmSelect>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Unit</label>
            <FarmSelect
              value={formData.unit}
              onChange={(e) =>
                setFormData({ ...formData, unit: e.target.value })
              }
            >
              <option value="LITERS">Liters</option>
              <option value="GALLONS">Gallons</option>
              <option value="KWH">kWh (Electric)</option>
            </FarmSelect>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Quantity *</label>
          <FarmInput
            type="number"
            step="0.1"
            min="0"
            value={formData.quantity}
            onChange={(e) =>
              setFormData({ ...formData, quantity: e.target.value })
            }
            placeholder="50.0"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              Cost per Unit ($)
            </label>
            <FarmInput
              type="number"
              step="0.01"
              min="0"
              value={formData.costPerUnit}
              onChange={(e) =>
                setFormData({ ...formData, costPerUnit: e.target.value })
              }
              placeholder="1.25"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Total Cost ($)
            </label>
            <FarmInput
              type="number"
              step="0.01"
              min="0"
              value={formData.totalCost}
              onChange={(e) =>
                setFormData({ ...formData, totalCost: e.target.value })
              }
              placeholder="62.50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Hours at Fueling
          </label>
          <FarmInput
            type="number"
            min="0"
            value={formData.hoursAtFueling}
            onChange={(e) =>
              setFormData({ ...formData, hoursAtFueling: e.target.value })
            }
            placeholder="1250"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <FarmInput
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            placeholder="Gas station, on-site tank, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Notes (Optional)
          </label>
          <FarmTextarea
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Additional details about fuel usage..."
            rows={3}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <FarmButton
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </FarmButton>
          <FarmButton type="submit" disabled={loading} className="flex-1">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Log Fuel Usage
          </FarmButton>
        </div>
      </form>
    </BaseModal>
  );
}

// Hours Update Modal
interface HoursUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentId: string;
  equipmentName: string;
  currentHours: number;
  onSuccess: () => void;
}

export function HoursUpdateModal({
  isOpen,
  onClose,
  equipmentId,
  equipmentName,
  currentHours,
  onSuccess,
}: HoursUpdateModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    newHours: currentHours.toString(),
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `/api/land-preparation/equipment/${equipmentId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hoursUsed: parseInt(formData.newHours),
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
        setFormData({
          newHours: currentHours.toString(),
          date: new Date().toISOString().split("T")[0],
          notes: "",
        });
      } else {
        throw new Error(data.error || "Failed to update hours");
      }
    } catch (error) {
      console.error("Error updating hours:", error);
      alert(error instanceof Error ? error.message : "Failed to update hours");
    } finally {
      setLoading(false);
    }
  };

  const hoursAdded = parseInt(formData.newHours) - currentHours;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Update Hours - ${equipmentName}`}
      icon={<Clock className="w-5 h-5 text-green-500" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Current Hours
          </label>
          <div className="text-sm text-muted-foreground mb-2">
            {currentHours.toLocaleString()} hours
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">New Hours *</label>
          <FarmInput
            type="number"
            min={currentHours}
            value={formData.newHours}
            onChange={(e) =>
              setFormData({ ...formData, newHours: e.target.value })
            }
            required
          />
          {hoursAdded > 0 && (
            <div className="text-sm text-muted-foreground mt-1">
              Adding {hoursAdded} hours
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <FarmInput
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Notes (Optional)
          </label>
          <FarmTextarea
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Reason for hours update, work performed, etc..."
            rows={3}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <FarmButton
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </FarmButton>
          <FarmButton
            type="submit"
            disabled={loading || parseInt(formData.newHours) < currentHours}
            className="flex-1"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Update Hours
          </FarmButton>
        </div>
      </form>
    </BaseModal>
  );
}
