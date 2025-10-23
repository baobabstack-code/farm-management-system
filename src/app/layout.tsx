import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import LayoutContent from "@/components/layout-content";
import AnalyticsWrapper from "@/components/analytics";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Farm Management System",
  description:
    "A comprehensive web-based system for horticulture farm management",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider defaultTheme="light" storageKey="farmflow-theme">
          <ClerkProvider
            signInUrl="/sign-in"
            signUpUrl="/sign-up"
            signInForceRedirectUrl="/dashboard"
            signUpForceRedirectUrl="/dashboard"
          >
            <LayoutContent>{children}</LayoutContent>
            <AnalyticsWrapper />
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
