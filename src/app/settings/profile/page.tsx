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
  FarmForm,
  FarmFormGroup,
  FarmInput,
  FarmTextarea,
  LoadingState,
  ErrorState,
} from "@/components/ui/farm-theme";
import { User, Mail, MapPin, Phone, Calendar } from "lucide-react";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  farmName?: string;
  farmAddress?: string;
  farmSize?: number;
  farmType?: string;
  bio?: string;
  joinedDate: string;
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push("/sign-in");
      return;
    }

    // Initialize profile from Clerk user data
    const initialProfile: UserProfile = {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.primaryEmailAddress?.emailAddress || "",
      phone: user.primaryPhoneNumber?.phoneNumber || "",
      farmName: (user.publicMetadata?.farmName as string) || "",
      farmAddress: (user.publicMetadata?.farmAddress as string) || "",
      farmSize: (user.publicMetadata?.farmSize as number) || undefined,
      farmType: (user.publicMetadata?.farmType as string) || "",
      bio: (user.publicMetadata?.bio as string) || "",
      joinedDate: user.createdAt?.toLocaleDateString() || "",
    };

    setProfile(initialProfile);
    setLoading(false);
  }, [user, isLoaded, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Update Clerk user metadata
      await user.update({
        firstName: profile.firstName,
        lastName: profile.lastName,
      });

      // Update public metadata
      await user.update({
        unsafeMetadata: {
          farmName: profile.farmName,
          farmAddress: profile.farmAddress,
          farmSize: profile.farmSize,
          farmType: profile.farmType,
          bio: profile.bio,
        },
      });

      setSuccess("Profile updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to update profile. Please try again.");
      console.error("Profile update error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    field: keyof UserProfile,
    value: string | number
  ) => {
    if (!profile) return;

    setProfile({
      ...profile,
      [field]: value,
    });
  };

  if (!isLoaded || loading) {
    return <LoadingState message="Loading your profile..." />;
  }

  if (!profile) {
    return (
      <ErrorState
        title="Profile Not Found"
        message="Unable to load your profile information."
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <PageContainer>
      <div className="farm-page-header">
        <div className="farm-page-title-section">
          <div className="farm-page-title-group">
            <div className="farm-page-icon bg-gradient-to-br from-primary to-primary-hover">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="farm-page-title-text">
              <h1 className="farm-heading-display">Profile Settings</h1>
              <p className="farm-text-muted mt-1">
                Manage your personal information and farm details
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <FarmCard className="border-destructive/20 bg-destructive/5 mb-6">
          <FarmCardContent>
            <div className="flex items-center gap-3 p-4">
              <span className="text-destructive text-lg">⚠️</span>
              <span className="text-destructive font-medium">{error}</span>
            </div>
          </FarmCardContent>
        </FarmCard>
      )}

      {success && (
        <FarmCard className="border-success/20 bg-success/5 mb-6">
          <FarmCardContent>
            <div className="flex items-center gap-3 p-4">
              <span className="text-success text-lg">✅</span>
              <span className="text-success font-medium">{success}</span>
            </div>
          </FarmCardContent>
        </FarmCard>
      )}

      <div className="farm-grid farm-grid-responsive">
        {/* Personal Information */}
        <div className="lg:col-span-2">
          <FarmCard>
            <FarmCardHeader title="Personal Information" />
            <FarmCardContent>
              <FarmForm onSubmit={handleSave}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FarmFormGroup label="First Name" required>
                    <FarmInput
                      type="text"
                      value={profile.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      placeholder="Enter your first name"
                      required
                    />
                  </FarmFormGroup>

                  <FarmFormGroup label="Last Name" required>
                    <FarmInput
                      type="text"
                      value={profile.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      placeholder="Enter your last name"
                      required
                    />
                  </FarmFormGroup>
                </div>

                <FarmFormGroup label="Email Address">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <FarmInput
                      type="email"
                      value={profile.email}
                      disabled
                      className="opacity-60"
                    />
                  </div>
                  <p className="farm-text-caption mt-1">
                    Email cannot be changed here. Use your account settings.
                  </p>
                </FarmFormGroup>

                <FarmFormGroup label="Phone Number">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <FarmInput
                      type="tel"
                      value={profile.phone || ""}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      placeholder="Enter your phone number"
                    />
                  </div>
                </FarmFormGroup>

                <FarmFormGroup label="Bio">
                  <FarmTextarea
                    value={profile.bio || ""}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    placeholder="Tell us about yourself and your farming experience..."
                    rows={4}
                  />
                </FarmFormGroup>
              </FarmForm>
            </FarmCardContent>
          </FarmCard>
        </div>

        {/* Farm Information */}
        <div>
          <FarmCard>
            <FarmCardHeader title="Farm Information" />
            <FarmCardContent>
              <div className="space-y-4">
                <FarmFormGroup label="Farm Name">
                  <FarmInput
                    type="text"
                    value={profile.farmName || ""}
                    onChange={(e) =>
                      handleInputChange("farmName", e.target.value)
                    }
                    placeholder="Enter your farm name"
                  />
                </FarmFormGroup>

                <FarmFormGroup label="Farm Address">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-3" />
                    <FarmTextarea
                      value={profile.farmAddress || ""}
                      onChange={(e) =>
                        handleInputChange("farmAddress", e.target.value)
                      }
                      placeholder="Enter your farm address"
                      rows={3}
                    />
                  </div>
                </FarmFormGroup>

                <FarmFormGroup label="Farm Size">
                  <FarmInput
                    type="number"
                    value={profile.farmSize || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "farmSize",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="Size in acres"
                    min="0"
                    step="0.1"
                  />
                </FarmFormGroup>

                <FarmFormGroup label="Farm Type">
                  <select
                    value={profile.farmType || ""}
                    onChange={(e) =>
                      handleInputChange("farmType", e.target.value)
                    }
                    className="farm-form-input"
                  >
                    <option value="">Select farm type</option>
                    <option value="vegetables">Vegetable Farm</option>
                    <option value="fruits">Fruit Farm</option>
                    <option value="grains">Grain Farm</option>
                    <option value="livestock">Livestock Farm</option>
                    <option value="mixed">Mixed Farm</option>
                    <option value="organic">Organic Farm</option>
                    <option value="greenhouse">Greenhouse</option>
                    <option value="other">Other</option>
                  </select>
                </FarmFormGroup>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Member since {profile.joinedDate}</span>
                  </div>
                </div>
              </div>
            </FarmCardContent>
          </FarmCard>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <FarmButton
          type="submit"
          variant="primary"
          loading={saving}
          onClick={handleSave}
          className="min-w-[120px]"
        >
          {saving ? "Saving..." : "Save Changes"}
        </FarmButton>
      </div>
    </PageContainer>
  );
}
