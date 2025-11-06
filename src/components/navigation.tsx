"use client";

import { useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: "📊" },
  { name: "AI Companion", href: "/ai-companion", icon: "🤖" },
  { name: "Crops", href: "/crops", icon: "🌱" },
  { name: "Fields", href: "/fields", icon: "🏞️" },
  { name: "Weather", href: "/weather", icon: "🌤️" },
  { name: "Soil Management", href: "/soil", icon: "🧪" },
  { name: "Planning", href: "/planning", icon: "📝" },
  { name: "Land Preparation", href: "/land-preparation", icon: "🚜" },
  { name: "Equipment", href: "/equipment", icon: "🔧" },
  { name: "Tasks", href: "/tasks", icon: "✅" },
  { name: "Activities", href: "/activities", icon: "📋" },
  { name: "Reports", href: "/reports", icon: "📈" },
  { name: "Settings", href: "/settings", icon: "⚙️" },
  { name: "Profile", href: "/profile", icon: "👤" },
];

export default function Navigation() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSignOut = () => {
    signOut({ redirectUrl: "/sign-in" });
  };

  if (!isLoaded || !user) {
    return null;
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-nav-button">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="bg-card p-3 rounded-lg shadow-lg border border-border hover:bg-accent transition-colors touch-manipulation"
          aria-label="Open sidebar"
          aria-expanded={isSidebarOpen}
        >
          <svg
            className="h-6 w-6 text-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Sidebar overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-nav-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-nav-sidebar w-64 bg-card shadow-xl border-r border-border transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        lg:translate-x-0 lg:static lg:inset-0
      `}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="text-2xl">🌱</span>
              <div>
                <h1 className="text-xl font-bold text-foreground">FarmFlow</h1>
                <p className="text-sm text-muted-foreground">Farm Management</p>
              </div>
            </Link>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-1 rounded-md hover:bg-accent"
              >
                <svg
                  className="h-5 w-5 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  flex items-center space-x-3 px-4 py-4 rounded-lg text-base font-medium transition-colors touch-manipulation
                  ${
                    pathname === item.href
                      ? "bg-primary/10 text-primary border-r-4 border-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }
                `}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-primary font-semibold text-lg">
                  {(
                    user.firstName?.[0] ||
                    user.username?.[0] ||
                    "U"
                  ).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.firstName || user.username || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-2 px-4 py-3 text-base text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors touch-manipulation"
            >
              <span>🚪</span>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
