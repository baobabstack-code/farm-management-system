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
} from "@/components/ui/farm-theme";
import {
  Database,
  Download,
  Trash2,
  Shield,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  FileText,
  Calendar,
} from "lucide-react";

interface DataExport {
  id: string;
  type: "full" | "crops" | "tasks" | "financial" | "weather";
  status: "pending" | "processing" | "completed" | "failed";
  requestedAt: string;
  completedAt?: string;
  downloadUrl?: string;
  expiresAt?: string;
}

interface PrivacySettings {
  profileVisibility: "public" | "private";
  dataSharing: boolean;
  analyticsTracking: boolean;
  marketingEmails: boolean;
  productUpdates: boolean;
  thirdPartyIntegrations: boolean;
}

export default function DataPrivacyPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [privacySettings, setPrivacySettings] =
    useState<PrivacySettings | null>(null);
  const [dataExports, setDataExports] = useState<DataExport[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push("/sign-in");
      return;
    }

    // Mock data - in a real app, this would come from your backend
    const mockPrivacySettings: PrivacySettings = {
      profileVisibility: "private",
      dataSharing: false,
      analyticsTracking: true,
      marketingEmails: false,
      productUpdates: true,
      thirdPartyIntegrations: true,
    };

    const mockDataExports: DataExport[] = [
      {
        id: "export_001",
        type: "full",
        status: "completed",
        requestedAt: "2024-01-10T10:00:00Z",
        completedAt: "2024-01-10T10:15:00Z",
        downloadUrl: "#",
        expiresAt: "2024-01-17T10:15:00Z",
      },
      {
        id: "export_002",
        type: "crops",
        status: "processing",
        requestedAt: "2024-01-15T14:30:00Z",
      },
    ];

    setPrivacySettings(mockPrivacySettings);
    setDataExports(mockDataExports);
    setLoading(false);
  }, [user, isLoaded, router]);

  const handlePrivacySettingChange = async (
    setting: keyof PrivacySettings,
    value: boolean | string
  ) => {
    if (!privacySettings) return;

    try {
      const updatedSettings = {
        ...privacySettings,
        [setting]: value,
      };

      setPrivacySettings(updatedSettings);

      // In a real app, you would save to backend
      await new Promise((resolve) => setTimeout(resolve, 500));

      setSuccess("Privacy settings updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to update privacy settings.");
      console.error("Privacy settings error:", err);
    }
  };

  const handleDataExport = async (type: DataExport["type"]) => {
    setExporting(type);
    setError("");
    setSuccess("");

    try {
      // In a real app, this would trigger a data export job
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const newExport: DataExport = {
        id: `export_${Date.now()}`,
        type,
        status: "processing",
        requestedAt: new Date().toISOString(),
      };

      setDataExports([newExport, ...dataExports]);
      setSuccess(
        `${type === "full" ? "Full data" : type} export started. You'll receive an email when it's ready.`
      );
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError("Failed to start data export.");
      console.error("Data export error:", err);
    } finally {
      setExporting(null);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmText = "DELETE MY ACCOUNT";
    const userInput = prompt(
      `This action cannot be undone. All your data will be permanently deleted.\n\nType "${confirmText}" to confirm:`
    );

    if (userInput !== confirmText) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      // In a real app, this would delete the user account
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Sign out and redirect
      await user?.delete();
      router.push("/");
    } catch (err) {
      setError("Failed to delete account. Please contact support.");
      console.error("Account deletion error:", err);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getExportStatusBadge = (status: DataExport["status"]) => {
    switch (status) {
      case "completed":
        return <FarmBadge variant="success">Completed</FarmBadge>;
      case "processing":
        return <FarmBadge variant="info">Processing</FarmBadge>;
      case "pending":
        return <FarmBadge variant="warning">Pending</FarmBadge>;
      case "failed":
        return <FarmBadge variant="error">Failed</FarmBadge>;
      default:
        return <FarmBadge variant="neutral">{status}</FarmBadge>;
    }
  };

  const getExportTypeLabel = (type: DataExport["type"]) => {
    switch (type) {
      case "full":
        return "Full Data Export";
      case "crops":
        return "Crops Data";
      case "tasks":
        return "Tasks Data";
      case "financial":
        return "Financial Data";
      case "weather":
        return "Weather Data";
      default:
        return type;
    }
  };

  if (!isLoaded || loading) {
    return <LoadingState message="Loading data and privacy settings..." />;
  }

  if (!privacySettings) {
    return <LoadingState message="Loading privacy settings..." />;
  }

  return (
    <PageContainer>
      <div className="farm-page-header">
        <div className="farm-page-title-section">
          <div className="farm-page-title-group">
            <div className="farm-page-icon bg-gradient-to-br from-secondary to-secondary-hover">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div className="farm-page-title-text">
              <h1 className="farm-heading-display">Data & Privacy</h1>
              <p className="farm-text-muted mt-1">
                Manage your data exports, privacy settings, and account deletion
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <FarmCard className="border-destructive/20 bg-destructive/5 mb-6">
          <FarmCardContent>
            <div className="flex items-center gap-3 p-4">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <span className="text-destructive font-medium">{error}</span>
            </div>
          </FarmCardContent>
        </FarmCard>
      )}

      {success && (
        <FarmCard className="border-success/20 bg-success/5 mb-6">
          <FarmCardContent>
            <div className="flex items-center gap-3 p-4">
              <CheckCircle className="w-5 h-5 text-success" />
              <span className="text-success font-medium">{success}</span>
            </div>
          </FarmCardContent>
        </FarmCard>
      )}

      <div className="farm-grid farm-grid-responsive">
        {/* Privacy Settings */}
        <div>
          <FarmCard>
            <FarmCardHeader title="Privacy Settings" />
            <FarmCardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    {privacySettings.profileVisibility === "public" ? (
                      <Eye className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">Profile Visibility</p>
                      <p className="farm-text-caption">
                        Control who can see your profile
                      </p>
                    </div>
                  </div>
                  <select
                    value={privacySettings.profileVisibility}
                    onChange={(e) =>
                      handlePrivacySettingChange(
                        "profileVisibility",
                        e.target.value
                      )
                    }
                    className="farm-form-input w-auto"
                  >
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Data Sharing</p>
                      <p className="farm-text-caption">
                        Share anonymized data for research
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={privacySettings.dataSharing}
                      onChange={(e) =>
                        handlePrivacySettingChange(
                          "dataSharing",
                          e.target.checked
                        )
                      }
                      className="sr-only"
                    />
                    <div
                      className={`w-11 h-6 rounded-full transition-colors ${
                        privacySettings.dataSharing
                          ? "bg-primary"
                          : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                          privacySettings.dataSharing
                            ? "translate-x-5"
                            : "translate-x-0.5"
                        } mt-0.5`}
                      />
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-medium">Analytics Tracking</p>
                    <p className="farm-text-caption">
                      Help improve the app with usage analytics
                    </p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={privacySettings.analyticsTracking}
                      onChange={(e) =>
                        handlePrivacySettingChange(
                          "analyticsTracking",
                          e.target.checked
                        )
                      }
                      className="sr-only"
                    />
                    <div
                      className={`w-11 h-6 rounded-full transition-colors ${
                        privacySettings.analyticsTracking
                          ? "bg-primary"
                          : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                          privacySettings.analyticsTracking
                            ? "translate-x-5"
                            : "translate-x-0.5"
                        } mt-0.5`}
                      />
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-medium">Marketing Emails</p>
                    <p className="farm-text-caption">
                      Receive promotional emails and offers
                    </p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={privacySettings.marketingEmails}
                      onChange={(e) =>
                        handlePrivacySettingChange(
                          "marketingEmails",
                          e.target.checked
                        )
                      }
                      className="sr-only"
                    />
                    <div
                      className={`w-11 h-6 rounded-full transition-colors ${
                        privacySettings.marketingEmails
                          ? "bg-primary"
                          : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                          privacySettings.marketingEmails
                            ? "translate-x-5"
                            : "translate-x-0.5"
                        } mt-0.5`}
                      />
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-medium">Product Updates</p>
                    <p className="farm-text-caption">
                      Get notified about new features
                    </p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={privacySettings.productUpdates}
                      onChange={(e) =>
                        handlePrivacySettingChange(
                          "productUpdates",
                          e.target.checked
                        )
                      }
                      className="sr-only"
                    />
                    <div
                      className={`w-11 h-6 rounded-full transition-colors ${
                        privacySettings.productUpdates
                          ? "bg-primary"
                          : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                          privacySettings.productUpdates
                            ? "translate-x-5"
                            : "translate-x-0.5"
                        } mt-0.5`}
                      />
                    </div>
                  </label>
                </div>
              </div>
            </FarmCardContent>
          </FarmCard>
        </div>

        {/* Data Export */}
        <div>
          <FarmCard>
            <FarmCardHeader title="Export Your Data" />
            <FarmCardContent>
              <div className="space-y-4">
                <p className="farm-text-muted">
                  Download your data in JSON format. Exports are available for 7
                  days.
                </p>

                <div className="grid grid-cols-1 gap-3">
                  <FarmButton
                    variant="outline"
                    onClick={() => handleDataExport("full")}
                    loading={exporting === "full"}
                    className="justify-start"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {exporting === "full" ? "Exporting..." : "Full Data Export"}
                  </FarmButton>

                  <FarmButton
                    variant="outline"
                    onClick={() => handleDataExport("crops")}
                    loading={exporting === "crops"}
                    className="justify-start"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {exporting === "crops" ? "Exporting..." : "Crops Data Only"}
                  </FarmButton>

                  <FarmButton
                    variant="outline"
                    onClick={() => handleDataExport("tasks")}
                    loading={exporting === "tasks"}
                    className="justify-start"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {exporting === "tasks" ? "Exporting..." : "Tasks Data Only"}
                  </FarmButton>

                  <FarmButton
                    variant="outline"
                    onClick={() => handleDataExport("financial")}
                    loading={exporting === "financial"}
                    className="justify-start"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {exporting === "financial"
                      ? "Exporting..."
                      : "Financial Data Only"}
                  </FarmButton>
                </div>
              </div>
            </FarmCardContent>
          </FarmCard>
        </div>

        {/* Export History */}
        <div className="lg:col-span-2">
          <FarmCard>
            <FarmCardHeader title="Export History" />
            <FarmCardContent>
              {dataExports.length === 0 ? (
                <div className="text-center py-6">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="farm-text-muted">No data exports yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dataExports.map((exportItem) => (
                    <div
                      key={exportItem.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {getExportTypeLabel(exportItem.type)}
                          </p>
                          <p className="farm-text-caption">
                            Requested {formatDate(exportItem.requestedAt)}
                            {exportItem.completedAt && (
                              <>
                                {" "}
                                • Completed {formatDate(exportItem.completedAt)}
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {getExportStatusBadge(exportItem.status)}

                        {exportItem.downloadUrl &&
                          exportItem.status === "completed" && (
                            <FarmButton
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                window.open(exportItem.downloadUrl, "_blank")
                              }
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </FarmButton>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </FarmCardContent>
          </FarmCard>
        </div>

        {/* Danger Zone */}
        <div className="lg:col-span-2">
          <FarmCard className="border-destructive/20">
            <FarmCardHeader title="Danger Zone" />
            <FarmCardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-destructive mb-2">
                      Delete Account
                    </h4>
                    <p className="farm-text-muted mb-4">
                      Permanently delete your account and all associated data.
                      This action cannot be undone. All your crops, tasks,
                      financial records, and other data will be permanently
                      removed.
                    </p>
                    <FarmButton
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      loading={deleting}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {deleting ? "Deleting Account..." : "Delete My Account"}
                    </FarmButton>
                  </div>
                </div>
              </div>
            </FarmCardContent>
          </FarmCard>
        </div>
      </div>
    </PageContainer>
  );
}
