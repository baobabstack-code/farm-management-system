"use client";

import Link from "next/link";
import {
  PageHeader,
  FarmCard,
  FarmCardContent,
} from "@/components/ui/farm-theme";
import {
  Settings,
  Plug,
  User,
  Bell,
  Shield,
  CreditCard,
  Database,
  ChevronRight,
} from "lucide-react";

export default function SettingsPage() {
  const settingSections = [
    {
      title: "Profile & Account",
      description: "Manage your personal information and account settings",
      icon: <User className="w-6 h-6" />,
      href: "/settings/profile",
    },
    {
      title: "Integrations",
      description: "Connect and manage third-party services like QuickBooks",
      icon: <Plug className="w-6 h-6" />,
      href: "/settings/integrations",
    },
    {
      title: "Notifications",
      description: "Configure alerts and notification preferences",
      icon: <Bell className="w-6 h-6" />,
      href: "/settings/notifications",
    },
    {
      title: "Security",
      description: "Password, authentication, and security settings",
      icon: <Shield className="w-6 h-6" />,
      href: "/settings/security",
    },

    {
      title: "Data & Privacy",
      description: "Export data, privacy settings, and data management",
      icon: <Database className="w-6 h-6" />,
      href: "/settings/data",
    },
  ];

  return (
    <div className="page-container">
      <div className="content-container padding-responsive-lg mobile-header-spacing content-spacing max-w-4xl mx-auto">
        <PageHeader
          title="Settings"
          description="Manage your account settings, integrations, and preferences"
          icon={<Settings className="w-6 h-6" />}
        />

        <div className="farm-grid grid-cols-1">
          {settingSections.map((section, index) => (
            <Link key={index} href={section.href}>
              <FarmCard interactive>
                <FarmCardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-success/10 rounded-lg">
                        <div className="text-success">{section.icon}</div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                          {section.title}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {section.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </FarmCardContent>
              </FarmCard>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
