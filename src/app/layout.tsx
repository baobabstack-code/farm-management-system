import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import LayoutContent from "@/components/layout-content";
import AnalyticsWrapper from "@/components/analytics";

export const metadata: Metadata = {
  title: "Farm Management System",
  description:
    "A comprehensive web-based system for horticulture farm management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <ClerkProvider
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          signInForceRedirectUrl="/dashboard"
          signUpForceRedirectUrl="/dashboard"
        >
          <LayoutContent>{children}</LayoutContent>
          <AnalyticsWrapper />
        </ClerkProvider>
      </body>
    </html>
  );
}
