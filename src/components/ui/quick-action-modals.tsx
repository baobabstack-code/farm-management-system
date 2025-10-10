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
import {
  IrrigationMethod,
  ApplicationMethod,
  PestDiseaseType,
  Severity,
  CropStatus,
} from "@prisma/client";
import { X, Loader2, Bug, Droplets, TrendingUp, Activity } from "lucide-react";

// Base Modal Component
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

  // Handle escape key and focus management
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

// Treatment (Pest/Disease) Modal
interface TreatmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cropId: string;
  cropName: string;
  onSuccess: () => void;
}

export function TreatmentModal({
  isOpen,
  onClose,
  cropId,
  cropName,
  onSuccess,
}: TreatmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    type: PestDiseaseType.PEST as PestDiseaseType,
    name: "",
    severity: Severity.LOW as Severity,
    affectedArea: "",
    treatment: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/pest-disease", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropId,
          date: formData.date,
          type: formData.type,
          name: formData.name,
          severity: formData.severity,
          affectedArea: parseFloat(formData.affectedArea),
          treatment: formData.treatment,
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
          type: PestDiseaseType.PEST,
          name: "",
          severity: Severity.LOW,
          affectedArea: "",
          treatment: "",
          notes: "",
        });
      } else {
        throw new Error(data.error || "Failed to record treatment");
      }
    } catch (error) {
      console.error("Error recording treatment:", error);
      alert(
        error instanceof Error ? error.message : "Failed to record treatment"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Treatment - ${cropName}`}
      icon={<Bug className="w-5 h-5 text-destructive" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <FarmInput
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <FarmSelect
            value={formData.type}
            onChange={(e) =>
              setFormData({
                ...formData,
                type: e.target.value as PestDiseaseType,
              })
            }
          >
            <option value={PestDiseaseType.PEST}>Pest</option>
            <option value={PestDiseaseType.DISEASE}>Disease</option>
          </FarmSelect>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Name/Description
          </label>
          <FarmInput
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Aphids, Blight, etc."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Severity</label>
          <FarmSelect
            value={formData.severity}
            onChange={(e) =>
              setFormData({ ...formData, severity: e.target.value as Severity })
            }
          >
            <option value={Severity.LOW}>Low</option>
            <option value={Severity.MEDIUM}>Medium</option>
            <option value={Severity.HIGH}>High</option>
          </FarmSelect>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Affected Area (m²)
          </label>
          <FarmInput
            type="number"
            step="0.1"
            min="0"
            value={formData.affectedArea}
            onChange={(e) =>
              setFormData({ ...formData, affectedArea: e.target.value })
            }
            placeholder="0.0"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Treatment Applied
          </label>
          <FarmInput
            value={formData.treatment}
            onChange={(e) =>
              setFormData({ ...formData, treatment: e.target.value })
            }
            placeholder="Treatment method or product used"
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
            placeholder="Additional observations or details..."
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
            Record Treatment
          </FarmButton>
        </div>
      </form>
    </BaseModal>
  );
}

// Status Update Modal
interface StatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  cropId: string;
  cropName: string;
  currentStatus: CropStatus;
  onSuccess: () => void;
}

export function StatusUpdateModal({
  isOpen,
  onClose,
  cropId,
  cropName,
  currentStatus,
  onSuccess,
}: StatusUpdateModalProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/crops/${cropId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
        setNotes("");
      } else {
        throw new Error(data.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert(error instanceof Error ? error.message : "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Update Status - ${cropName}`}
      icon={<Activity className="w-5 h-5 text-primary" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Current Status
          </label>
          <div className="text-sm text-muted-foreground mb-2">
            {currentStatus.replace("_", " ").toLowerCase()}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">New Status</label>
          <FarmSelect
            value={status}
            onChange={(e) => setStatus(e.target.value as CropStatus)}
          >
            <option value={CropStatus.PLANTED}>Planted</option>
            <option value={CropStatus.GROWING}>Growing</option>
            <option value={CropStatus.FLOWERING}>Flowering</option>
            <option value={CropStatus.FRUITING}>Fruiting</option>
            <option value={CropStatus.HARVESTED}>Harvested</option>
            <option value={CropStatus.COMPLETED}>Completed</option>
          </FarmSelect>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Notes (Optional)
          </label>
          <FarmTextarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Reason for status change or additional notes..."
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
            disabled={loading || status === currentStatus}
            className="flex-1"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Update Status
          </FarmButton>
        </div>
      </form>
    </BaseModal>
  );
}

// Irrigation Modal
interface IrrigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  cropId: string;
  cropName: string;
  onSuccess: () => void;
}

export function IrrigationModal({
  isOpen,
  onClose,
  cropId,
  cropName,
  onSuccess,
}: IrrigationModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    duration: "",
    waterAmount: "",
    method: IrrigationMethod.SPRINKLER as IrrigationMethod,
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/irrigation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropId,
          date: formData.date,
          duration: parseFloat(formData.duration),
          waterAmount: parseFloat(formData.waterAmount),
          method: formData.method,
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
          duration: "",
          waterAmount: "",
          method: IrrigationMethod.SPRINKLER,
          notes: "",
        });
      } else {
        throw new Error(data.error || "Failed to log irrigation");
      }
    } catch (error) {
      console.error("Error logging irrigation:", error);
      alert(
        error instanceof Error ? error.message : "Failed to log irrigation"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Log Irrigation - ${cropName}`}
      icon={<Droplets className="w-5 h-5 text-blue-500" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <FarmInput
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Duration (minutes)
          </label>
          <FarmInput
            type="number"
            min="1"
            value={formData.duration}
            onChange={(e) =>
              setFormData({ ...formData, duration: e.target.value })
            }
            placeholder="30"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Water Amount (liters)
          </label>
          <FarmInput
            type="number"
            step="0.1"
            min="0"
            value={formData.waterAmount}
            onChange={(e) =>
              setFormData({ ...formData, waterAmount: e.target.value })
            }
            placeholder="100.0"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Method</label>
          <FarmSelect
            value={formData.method}
            onChange={(e) =>
              setFormData({
                ...formData,
                method: e.target.value as IrrigationMethod,
              })
            }
          >
            <option value={IrrigationMethod.SPRINKLER}>Sprinkler</option>
            <option value={IrrigationMethod.DRIP}>Drip</option>
            <option value={IrrigationMethod.FLOOD}>Flood</option>
            <option value={IrrigationMethod.MANUAL}>Manual</option>
          </FarmSelect>
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
            placeholder="Weather conditions, observations, etc..."
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
            Log Irrigation
          </FarmButton>
        </div>
      </form>
    </BaseModal>
  );
}

// Fertilizer Modal
interface FertilizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cropId: string;
  cropName: string;
  onSuccess: () => void;
}

export function FertilizerModal({
  isOpen,
  onClose,
  cropId,
  cropName,
  onSuccess,
}: FertilizerModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    fertilizerType: "",
    amount: "",
    applicationMethod: ApplicationMethod.BROADCAST as ApplicationMethod,
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/fertilizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropId,
          date: formData.date,
          fertilizerType: formData.fertilizerType,
          amount: parseFloat(formData.amount),
          applicationMethod: formData.applicationMethod,
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
          fertilizerType: "",
          amount: "",
          applicationMethod: ApplicationMethod.BROADCAST,
          notes: "",
        });
      } else {
        throw new Error(data.error || "Failed to log fertilizer application");
      }
    } catch (error) {
      console.error("Error logging fertilizer:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to log fertilizer application"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Log Fertilizer - ${cropName}`}
      icon={<TrendingUp className="w-5 h-5 text-green-500" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <FarmInput
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Fertilizer Type
          </label>
          <FarmInput
            value={formData.fertilizerType}
            onChange={(e) =>
              setFormData({ ...formData, fertilizerType: e.target.value })
            }
            placeholder="e.g., NPK 10-10-10, Compost, etc."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Amount (kg)</label>
          <FarmInput
            type="number"
            step="0.1"
            min="0"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            placeholder="5.0"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Application Method
          </label>
          <FarmSelect
            value={formData.applicationMethod}
            onChange={(e) =>
              setFormData({
                ...formData,
                applicationMethod: e.target.value as ApplicationMethod,
              })
            }
          >
            <option value={ApplicationMethod.BROADCAST}>Broadcast</option>
            <option value={ApplicationMethod.BAND}>Band</option>
            <option value={ApplicationMethod.FOLIAR}>Foliar</option>
            <option value={ApplicationMethod.FERTIGATION}>Fertigation</option>
          </FarmSelect>
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
            placeholder="Weather conditions, soil conditions, etc..."
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
            Log Fertilizer
          </FarmButton>
        </div>
      </form>
    </BaseModal>
  );
}
