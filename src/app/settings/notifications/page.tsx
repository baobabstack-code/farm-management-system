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
  LoadingState,
} from "@/components/ui/farm-theme";
import {
  Bell,
  Mail,
  Smartphone,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Cloud,
  DollarSign,
  Wrench,
  Sprout,
} from "lucide-react";

interface NotificationSettings {
  email: {
    taskReminders: boolean;
    weatherAlerts: boolean;
    harvestReminders: boolean;
    systemUpdates: boolean;
    marketingEmails: boolean;
    weeklyReports: boolean;
    equipmentMaintenance: boolean;
    financialAlerts: boolean;
  };
  push: {
    taskReminders: boolean;
    weatherAlerts: boolean;
    harvestReminders: boolean;
    systemUpdates: boolean;
    equipmentMaintenance: boolean;
    financialAlerts: boolean;
  };
  frequency: {
    taskReminders: "immediate" | "daily" | "weekly";
    weatherAlerts: "immediate" | "daily";
    weeklyReports: "monday" | "friday" | "sunday";
  };
}

export default function NotificationsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push("/sign-in");
      return;
    }

    // Check push notification support
    if ("Notification" in window) {
      setPushSupported(true);
      setPushPermission(Notification.permission);
    }

    // Mock notification settings - in a real app, this would come from your backend
    const mockSettings: NotificationSettings = {
      email: {
        taskReminders: true,
        weatherAlerts: true,
        harvestReminders: true,
        systemUpdates: true,
        marketingEmails: false,
        weeklyReports: true,
        equipmentMaintenance: true,
        financialAlerts: true,
      },
      push: {
        taskReminders: true,
        weatherAlerts: true,
        harvestReminders: false,
        systemUpdates: false,
        equipmentMaintenance: true,
        financialAlerts: true,
      },
      frequency: {
        taskReminders: "immediate",
        weatherAlerts: "immediate",
        weeklyReports: "monday",
      },
    };

    setSettings(mockSettings);
    setLoading(false);
  }, [user, isLoaded, router]);

  const handleSettingChange = async (
    category: keyof NotificationSettings,
    setting: string,
    value: boolean | string
  ) => {
    if (!settings) return;

    const updatedSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [setting]: value,
      },
    };

    setSettings(updatedSettings);

    // Auto-save after a short delay
    setSaving(true);
    try {
      // In a real app, you would save to backend
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSuccess("Notification settings updated!");
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError("Failed to update settings.");
      console.error("Settings update error:", err);
    } finally {
      setSaving(false);
    }
  };

  const requestPushPermission = async () => {
    if (!pushSupported) return;

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission === "granted") {
        setSuccess("Push notifications enabled!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(
          "Push notifications were denied. You can enable them in your browser settings."
        );
        setTimeout(() => setError(""), 5000);
      }
    } catch (err) {
      setError("Failed to request push notification permission.");
      console.error("Push permission error:", err);
    }
  };

  const testNotification = async () => {
    if (pushPermission !== "granted") {
      setError("Push notifications are not enabled.");
      return;
    }

    try {
      new Notification("FarmFlow Test", {
        body: "This is a test notification from your farm management system.",
        icon: "/favicon.ico",
      });
      setSuccess("Test notification sent!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to send test notification.");
      console.error("Test notification error:", err);
    }
  };

  const ToggleSwitch = ({
    checked,
    onChange,
    disabled = false,
  }: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
  }) => (
    <label
      className={`flex items-center cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <div
        className={`w-11 h-6 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-gray-300"
        }`}
      >
        <div
          className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          } mt-0.5`}
        />
      </div>
    </label>
  );

  if (!isLoaded || loading) {
    return <LoadingState message="Loading notification settings..." />;
  }

  if (!settings) {
    return <LoadingState message="Loading preferences..." />;
  }

  return (
    <PageContainer>
      <div className="farm-page-header">
        <div className="farm-page-title-section">
          <div className="farm-page-title-group">
            <div className="farm-page-icon bg-gradient-to-br from-info to-info/80">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div className="farm-page-title-text">
              <h1 className="farm-heading-display">Notification Settings</h1>
              <p className="farm-text-muted mt-1">
                Manage how and when you receive notifications about your farm
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
        {/* Push Notifications Setup */}
        <div className="lg:col-span-2">
          <FarmCard>
            <FarmCardHeader title="Push Notifications" />
            <FarmCardContent>
              <div className="space-y-4">
                {!pushSupported ? (
                  <div className="flex items-center gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                    <div>
                      <p className="font-medium text-warning">
                        Push notifications not supported
                      </p>
                      <p className="farm-text-caption">
                        Your browser doesn't support push notifications.
                      </p>
                    </div>
                  </div>
                ) : pushPermission === "denied" ? (
                  <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <div>
                      <p className="font-medium text-destructive">
                        Push notifications blocked
                      </p>
                      <p className="farm-text-caption">
                        Enable notifications in your browser settings to receive
                        push alerts.
                      </p>
                    </div>
                  </div>
                ) : pushPermission === "granted" ? (
                  <div className="flex items-center justify-between p-4 bg-success/10 border border-success/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-success" />
                      <div>
                        <p className="font-medium text-success">
                          Push notifications enabled
                        </p>
                        <p className="farm-text-caption">
                          You'll receive push notifications for selected events.
                        </p>
                      </div>
                    </div>
                    <FarmButton
                      variant="outline"
                      size="sm"
                      onClick={testNotification}
                    >
                      Test
                    </FarmButton>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Enable push notifications</p>
                        <p className="farm-text-caption">
                          Get instant alerts on your device.
                        </p>
                      </div>
                    </div>
                    <FarmButton
                      variant="primary"
                      onClick={requestPushPermission}
                    >
                      Enable
                    </FarmButton>
                  </div>
                )}
              </div>
            </FarmCardContent>
          </FarmCard>
        </div>

        {/* Email Notifications */}
        <div>
          <FarmCard>
            <FarmCardHeader title="Email Notifications" />
            <FarmCardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Task Reminders</p>
                      <p className="farm-text-caption">
                        Get reminded about upcoming tasks
                      </p>
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={settings.email.taskReminders}
                    onChange={(checked) =>
                      handleSettingChange("email", "taskReminders", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Cloud className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Weather Alerts</p>
                      <p className="farm-text-caption">
                        Severe weather warnings
                      </p>
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={settings.email.weatherAlerts}
                    onChange={(checked) =>
                      handleSettingChange("email", "weatherAlerts", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Sprout className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Harvest Reminders</p>
                      <p className="farm-text-caption">
                        When crops are ready to harvest
                      </p>
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={settings.email.harvestReminders}
                    onChange={(checked) =>
                      handleSettingChange("email", "harvestReminders", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Wrench className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Equipment Maintenance</p>
                      <p className="farm-text-caption">
                        Maintenance reminders and alerts
                      </p>
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={settings.email.equipmentMaintenance}
                    onChange={(checked) =>
                      handleSettingChange(
                        "email",
                        "equipmentMaintenance",
                        checked
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Financial Alerts</p>
                      <p className="farm-text-caption">
                        Budget and expense notifications
                      </p>
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={settings.email.financialAlerts}
                    onChange={(checked) =>
                      handleSettingChange("email", "financialAlerts", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Weekly Reports</p>
                      <p className="farm-text-caption">
                        Summary of farm activities
                      </p>
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={settings.email.weeklyReports}
                    onChange={(checked) =>
                      handleSettingChange("email", "weeklyReports", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">System Updates</p>
                      <p className="farm-text-caption">
                        App updates and new features
                      </p>
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={settings.email.systemUpdates}
                    onChange={(checked) =>
                      handleSettingChange("email", "systemUpdates", checked)
                    }
                  />
                </div>
              </div>
            </FarmCardContent>
          </FarmCard>
        </div>

        {/* Push Notification Settings */}
        <div>
          <FarmCard>
            <FarmCardHeader title="Push Notification Types" />
            <FarmCardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Task Reminders</p>
                      <p className="farm-text-caption">
                        Urgent task notifications
                      </p>
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={settings.push.taskReminders}
                    onChange={(checked) =>
                      handleSettingChange("push", "taskReminders", checked)
                    }
                    disabled={pushPermission !== "granted"}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Cloud className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Weather Alerts</p>
                      <p className="farm-text-caption">
                        Immediate weather warnings
                      </p>
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={settings.push.weatherAlerts}
                    onChange={(checked) =>
                      handleSettingChange("push", "weatherAlerts", checked)
                    }
                    disabled={pushPermission !== "granted"}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Sprout className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Harvest Reminders</p>
                      <p className="farm-text-caption">
                        Critical harvest timing
                      </p>
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={settings.push.harvestReminders}
                    onChange={(checked) =>
                      handleSettingChange("push", "harvestReminders", checked)
                    }
                    disabled={pushPermission !== "granted"}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Wrench className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Equipment Issues</p>
                      <p className="farm-text-caption">
                        Urgent maintenance alerts
                      </p>
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={settings.push.equipmentMaintenance}
                    onChange={(checked) =>
                      handleSettingChange(
                        "push",
                        "equipmentMaintenance",
                        checked
                      )
                    }
                    disabled={pushPermission !== "granted"}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Financial Alerts</p>
                      <p className="farm-text-caption">
                        Budget threshold alerts
                      </p>
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={settings.push.financialAlerts}
                    onChange={(checked) =>
                      handleSettingChange("push", "financialAlerts", checked)
                    }
                    disabled={pushPermission !== "granted"}
                  />
                </div>
              </div>
            </FarmCardContent>
          </FarmCard>
        </div>

        {/* Notification Frequency */}
        <div>
          <FarmCard>
            <FarmCardHeader title="Notification Frequency" />
            <FarmCardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="farm-form-label">
                    Task Reminder Frequency
                  </label>
                  <select
                    value={settings.frequency.taskReminders}
                    onChange={(e) =>
                      handleSettingChange(
                        "frequency",
                        "taskReminders",
                        e.target.value
                      )
                    }
                    className="farm-form-input"
                  >
                    <option value="immediate">Immediate</option>
                    <option value="daily">Daily Digest</option>
                    <option value="weekly">Weekly Summary</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="farm-form-label">
                    Weather Alert Frequency
                  </label>
                  <select
                    value={settings.frequency.weatherAlerts}
                    onChange={(e) =>
                      handleSettingChange(
                        "frequency",
                        "weatherAlerts",
                        e.target.value
                      )
                    }
                    className="farm-form-input"
                  >
                    <option value="immediate">Immediate</option>
                    <option value="daily">Daily Summary</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="farm-form-label">Weekly Report Day</label>
                  <select
                    value={settings.frequency.weeklyReports}
                    onChange={(e) =>
                      handleSettingChange(
                        "frequency",
                        "weeklyReports",
                        e.target.value
                      )
                    }
                    className="farm-form-input"
                  >
                    <option value="monday">Monday</option>
                    <option value="friday">Friday</option>
                    <option value="sunday">Sunday</option>
                  </select>
                </div>
              </div>
            </FarmCardContent>
          </FarmCard>
        </div>
      </div>

      {saving && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Saving settings...
          </div>
        </div>
      )}
    </PageContainer>
  );
}
