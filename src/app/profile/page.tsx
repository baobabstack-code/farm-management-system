import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  PageHeader,
  FarmCard,
  FarmCardHeader,
  FarmCardContent,
} from "@/components/ui/farm-theme";
import { User, Mail, Calendar, Shield } from "lucide-react";

export default async function ProfilePage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="page-container">
      <div className="content-container padding-responsive-lg mobile-header-spacing content-spacing">
        <PageHeader
          title="User Profile"
          description="Manage your account information and preferences"
          icon={<User className="w-6 h-6" />}
        />

        <div className="farm-grid grid-cols-1 lg:grid-cols-3">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <FarmCard>
              <FarmCardHeader
                title="Profile Information"
                description="Your account details and personal information"
              />
              <FarmCardContent>
                <div className="flex items-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-success to-success/80 rounded-full flex items-center justify-center mr-6">
                    <span className="text-white text-2xl font-bold">
                      {(
                        user?.firstName?.[0] ||
                        user?.username?.[0] ||
                        "U"
                      ).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {user?.firstName} {user?.lastName}
                    </h2>
                    <p className="text-muted-foreground">
                      {user?.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                </div>

                <div className="farm-card-content">
                  <div className="flex-between py-3">
                    <div className="icon-text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="farm-text-muted">Full Name</span>
                    </div>
                    <span className="farm-text-body font-semibold">
                      {user?.firstName} {user?.lastName || "Not set"}
                    </span>
                  </div>

                  <div className="flex-between py-3">
                    <div className="icon-text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="farm-text-muted">Username</span>
                    </div>
                    <span className="farm-text-body font-semibold">
                      {user?.username || "Not set"}
                    </span>
                  </div>

                  <div className="flex-between py-3">
                    <div className="icon-text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="farm-text-muted">Email Address</span>
                    </div>
                    <span className="farm-text-body font-semibold">
                      {user?.primaryEmailAddress?.emailAddress}
                    </span>
                  </div>

                  <div className="flex-between py-3">
                    <div className="icon-text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="farm-text-muted">Member Since</span>
                    </div>
                    <span className="farm-text-body font-semibold">
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "Unknown"}
                    </span>
                  </div>

                  <div className="flex-between py-3">
                    <div className="icon-text-sm">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                      <span className="farm-text-muted">Account Status</span>
                    </div>
                    <span className="farm-text-body font-semibold text-success">
                      Active
                    </span>
                  </div>
                </div>
              </FarmCardContent>
            </FarmCard>
          </div>

          {/* Account Actions */}
          <div>
            <FarmCard>
              <FarmCardHeader
                title="Account Actions"
                description="Manage your account settings"
              />
              <FarmCardContent>
                <div className="farm-card-content">
                  <p className="text-sm text-muted-foreground mb-4">
                    Account management is handled through Clerk. Use the user
                    menu in the top right to access account settings.
                  </p>

                  <div className="space-y-3">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <h4 className="font-medium text-sm text-foreground">
                        Profile Settings
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Update your name, email, and profile picture
                      </p>
                    </div>

                    <div className="p-3 bg-muted/50 rounded-lg">
                      <h4 className="font-medium text-sm text-foreground">
                        Security
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Change password and manage 2FA
                      </p>
                    </div>

                    <div className="p-3 bg-muted/50 rounded-lg">
                      <h4 className="font-medium text-sm text-foreground">
                        Privacy
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Control your data and privacy settings
                      </p>
                    </div>
                  </div>
                </div>
              </FarmCardContent>
            </FarmCard>
          </div>
        </div>
      </div>
    </div>
  );
}
