"use client";

import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import Navigation from "./navigation";

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
      <div className="flex h-screen bg-gray-50">
        <Navigation />
        <main className="flex-1 lg:ml-64 overflow-auto">{children}</main>
      </div>
    );
  }

  // For auth pages and unauthenticated users, show without sidebar
  return <div className="min-h-screen">{children}</div>;
}
