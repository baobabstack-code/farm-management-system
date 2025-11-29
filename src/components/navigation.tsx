"use client";

import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: "📊" },
  { name: "My Animals", href: "/animals", icon: "🐔" },
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSignOut = () => {
    signOut({ redirectUrl: "/sign-in" });
  };

  if (!isLoaded || !user) {
    return null;
  }

  return (
    <>
      {/* Toggle button - shows on all screens */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`fixed top-4 z-nav-button bg-card p-3 rounded-lg shadow-lg border border-border hover:bg-accent transition-all touch-manipulation ${
          isSidebarOpen && !isMobile ? "left-[17rem]" : "left-4"
        }`}
        aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        aria-expanded={isSidebarOpen}
      >
        <svg
          className="h-6 w-6 text-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isSidebarOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Sidebar overlay for mobile */}
      {isSidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-nav-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-nav-sidebar bg-card shadow-xl border-r border-border transition-all duration-300 ease-in-out overflow-hidden
        ${isSidebarOpen ? "w-64" : "w-0"} 
        ${isMobile ? "fixed" : "relative"}
      `}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full w-64 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="text-2xl">🌱</span>
              <div>
                <h1 className="text-xl font-bold text-foreground">FarmFlow</h1>
                <p className="text-sm text-muted-foreground">Farm Management</p>
              </div>
            </Link>
            <ThemeToggle />
          </div>

          {/* Navigation - Scrollable */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
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

          {/* User section - Fixed at bottom */}
          <div className="p-4 border-t border-border flex-shrink-0">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
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
