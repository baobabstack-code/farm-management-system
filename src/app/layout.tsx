import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import LayoutContent from "@/components/layout-content";
import AnalyticsWrapper from "@/components/analytics";
import { ThemeProvider } from "@/components/theme-provider";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://farmerflow.ai";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "FarmerFlow AI - Smart Farm Management Platform",
    template: "%s | FarmerFlow AI",
  },
  description:
    "Transform your farm with AI-powered management. Track crops, optimize resources, manage equipment, and boost yields with intelligent insights. Perfect for horticulture and modern farming.",
  keywords: [
    "farm management",
    "agriculture software",
    "crop management",
    "farm tracking",
    "horticulture",
    "AI farming",
    "smart agriculture",
    "farm analytics",
    "crop optimization",
    "agricultural technology",
    "precision farming",
    "farm productivity",
    "yield optimization",
    "farm resources",
    "equipment tracking",
  ],
  authors: [{ name: "FarmerFlow AI Team" }],
  creator: "FarmerFlow AI",
  publisher: "FarmerFlow AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: appUrl,
    title: "FarmerFlow AI - Smart Farm Management Platform",
    description:
      "Transform your farm with AI-powered management. Track crops, optimize resources, and boost yields with intelligent insights.",
    siteName: "FarmerFlow AI",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "FarmerFlow AI - Smart Farm Management Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FarmerFlow AI - Smart Farm Management Platform",
    description:
      "Transform your farm with AI-powered management. Track crops, optimize resources, and boost yields.",
    images: ["/og-image.svg"],
    creator: "@farmerflowai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml", sizes: "any" },
    ],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  manifest: "/manifest.json",
  applicationName: "FarmerFlow AI",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FarmerFlow AI",
  },
  category: "agriculture",
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
            signInForceRedirectUrl="/onboarding"
            signUpForceRedirectUrl="/onboarding"
          >
            <LayoutContent>{children}</LayoutContent>
            <AnalyticsWrapper />
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
