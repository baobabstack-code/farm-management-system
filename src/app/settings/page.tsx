"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
      title: "Billing & Subscription",
      description: "Manage your subscription and payment methods",
      icon: <CreditCard className="w-6 h-6" />,
      href: "/settings/billing",
    },
    {
      title: "Data & Privacy",
      description: "Export data, privacy settings, and data management",
      icon: <Database className="w-6 h-6" />,
      href: "/settings/data",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-8 h-8 text-green-600 dark:text-green-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Settings
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your account settings, integrations, and preferences.
          </p>
        </div>

        <div className="grid gap-4">
          {settingSections.map((section, index) => (
            <Card
              key={index}
              className="hover:shadow-md transition-shadow dark:bg-slate-800 dark:border-gray-600"
            >
              <Link href={section.href}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-green-600 dark:text-green-400">
                          {section.icon}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {section.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          {section.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
