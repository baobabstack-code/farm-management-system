"use client";

import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import Navigation from "./navigation";
import AIChatAssistant from "./ai/AIChatAssistant";
import { useOnboarding } from "@/hooks/use-onboarding";

interface LayoutContentProps {
  children: React.ReactNode;
}

export default function LayoutContent({ children }: LayoutContentProps) {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  useOnboarding(); // Enforce mandatory onboarding

  // Don't show sidebar on auth pages or onboarding
  const isAuthPage =
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname === "/onboarding";

  // Show sidebar only for authenticated users on non-auth pages
  const showSidebar = isLoaded && user && !isAuthPage;

  if (showSidebar) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Navigation />
        <main className="flex-1 overflow-y-auto overflow-x-hidden mobile-header-spacing mobile-safe-area bg-background pt-16 lg:pt-0">
          <div className="h-full">{children}</div>
        </main>
        <AIChatAssistant />
      </div>
    );
  }

  // For auth pages and unauthenticated users, show without sidebar
  return <div className="min-h-screen bg-background">{children}</div>;
}
