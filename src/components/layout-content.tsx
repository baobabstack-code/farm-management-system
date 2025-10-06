"use client";

import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import Navigation from "./navigation";
import AIChatAssistant from "./ai/AIChatAssistant";

interface LayoutContentProps {
  children: React.ReactNode;
}

export default function LayoutContent({ children }: LayoutContentProps) {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();

  // Don't show sidebar on auth pages
  const isAuthPage =
    pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

  // Show sidebar only for authenticated users on non-auth pages
  const showSidebar = isLoaded && user && !isAuthPage;

  if (showSidebar) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <main className="flex-1 overflow-auto mobile-header-spacing mobile-safe-area">
          <div className="min-h-full">{children}</div>
        </main>
        <AIChatAssistant />
      </div>
    );
  }

  // For auth pages and unauthenticated users, show without sidebar
  return <div className="min-h-screen">{children}</div>;
}
