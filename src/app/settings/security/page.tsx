"use client";

import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  PageContainer,
  FarmCard,
  FarmCardHeader,
  FarmCardContent,
  FarmButton,
  FarmForm,
  FarmFormGroup,
  FarmInput,
  FarmBadge,
  LoadingState,
} from "@/components/ui/farm-theme";
import {
  Shield,
  Key,
  Smartphone,
  Clock,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface SecurityInfo {
  hasPassword: boolean;
  hasTwoFactor: boolean;
  lastPasswordChange?: string;
  activeDevices: number;
  recentActivity: Array<{
    action: string;
    timestamp: string;
    device: string;
    location?: string;
  }>;
}

export default function SecurityPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [securityInfo, setSecurityInfo] = useState<SecurityInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push("/sign-in");
      return;
    }

    // Mock security info - in a real app, this would come from your backend
    const mockSecurityInfo: SecurityInfo = {
      hasPassword: user.passwordEnabled,
      hasTwoFactor: user.twoFactorEnabled,
      lastPasswordChange: "2024-01-15",
      activeDevices: 2,
      recentActivity: [
        {
          action: "Sign in",
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          device: "Chrome on Windows",
          location: "New York, NY",
        },
        {
          action: "Profile updated",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          device: "Safari on iPhone",
          location: "New York, NY",
        },
        {
          action: "Sign in",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          device: "Chrome on Windows",
          location: "New York, NY",
        },
      ],
    };

    setSecurityInfo(mockSecurityInfo);
    setLoading(false);
  }, [user, isLoaded, router]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setChangingPassword(true);

    try {
      // In a real app, you would use Clerk's password change functionality
      // await user.updatePassword({
      //   currentPassword: passwordForm.currentPassword,
      //   newPassword: passwordForm.newPassword,
      // });

      // Mock success for demo
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess("Password changed successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        "Failed to change password. Please check your current password."
      );
      console.error("Password change error:", err);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      // In a real app, this would initiate 2FA setup
      setSuccess(
        "Two-factor authentication setup initiated. Check your email for instructions."
      );
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError("Failed to enable two-factor authentication.");
    }
  };

  const handleSignOutAllDevices = async () => {
    if (
      !confirm(
        "Are you sure you want to sign out of all devices? You will need to sign in again."
      )
    ) {
      return;
    }

    try {
      // In a real app, this would sign out all sessions
      await signOut();
      router.push("/sign-in");
    } catch (err) {
      setError("Failed to sign out of all devices.");
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return `${diffDays} days ago`;
    }
  };

  if (!isLoaded || loading) {
    return <LoadingState message="Loading security settings..." />;
  }

  if (!securityInfo) {
    return <LoadingState message="Loading security information..." />;
  }

  return (
    <PageContainer>
      <div className="farm-page-header">
        <div className="farm-page-title-section">
          <div className="farm-page-title-group">
            <div className="farm-page-icon bg-gradient-to-br from-warning to-warning/80">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="farm-page-title-text">
              <h1 className="farm-heading-display">Security Settings</h1>
              <p className="farm-text-muted mt-1">
                Manage your account security and privacy settings
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
        {/* Security Overview */}
        <div>
          <FarmCard>
            <FarmCardHeader title="Security Overview" />
            <FarmCardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Password</p>
                      <p className="farm-text-caption">
                        {securityInfo.lastPasswordChange
                          ? `Last changed ${securityInfo.lastPasswordChange}`
                          : "Never changed"}
                      </p>
                    </div>
                  </div>
                  <FarmBadge
                    variant={securityInfo.hasPassword ? "success" : "error"}
                  >
                    {securityInfo.hasPassword ? "Enabled" : "Disabled"}
                  </FarmBadge>
                </div>

                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="farm-text-caption">
                        Extra security for your account
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FarmBadge
                      variant={
                        securityInfo.hasTwoFactor ? "success" : "warning"
                      }
                    >
                      {securityInfo.hasTwoFactor ? "Enabled" : "Disabled"}
                    </FarmBadge>
                    {!securityInfo.hasTwoFactor && (
                      <FarmButton
                        variant="outline"
                        size="sm"
                        onClick={handleEnable2FA}
                      >
                        Enable
                      </FarmButton>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Active Devices</p>
                      <p className="farm-text-caption">
                        {securityInfo.activeDevices} devices signed in
                      </p>
                    </div>
                  </div>
                  <FarmButton
                    variant="outline"
                    size="sm"
                    onClick={handleSignOutAllDevices}
                  >
                    Sign Out All
                  </FarmButton>
                </div>
              </div>
            </FarmCardContent>
          </FarmCard>
        </div>

        {/* Change Password */}
        <div>
          <FarmCard>
            <FarmCardHeader title="Change Password" />
            <FarmCardContent>
              <FarmForm onSubmit={handlePasswordChange}>
                <FarmFormGroup label="Current Password" required>
                  <FarmInput
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value,
                      })
                    }
                    placeholder="Enter current password"
                    required
                  />
                </FarmFormGroup>

                <FarmFormGroup label="New Password" required>
                  <FarmInput
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    placeholder="Enter new password"
                    required
                    minLength={8}
                  />
                  <p className="farm-text-caption mt-1">
                    Password must be at least 8 characters long
                  </p>
                </FarmFormGroup>

                <FarmFormGroup label="Confirm New Password" required>
                  <FarmInput
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Confirm new password"
                    required
                  />
                </FarmFormGroup>

                <FarmButton
                  type="submit"
                  variant="primary"
                  loading={changingPassword}
                  className="w-full"
                >
                  {changingPassword
                    ? "Changing Password..."
                    : "Change Password"}
                </FarmButton>
              </FarmForm>
            </FarmCardContent>
          </FarmCard>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <FarmCard>
            <FarmCardHeader title="Recent Activity" />
            <FarmCardContent>
              <div className="space-y-3">
                {securityInfo.recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{activity.action}</p>
                        <p className="farm-text-caption">
                          {activity.device}
                          {activity.location && ` • ${activity.location}`}
                        </p>
                      </div>
                    </div>
                    <span className="farm-text-caption">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </FarmCardContent>
          </FarmCard>
        </div>
      </div>
    </PageContainer>
  );
}
