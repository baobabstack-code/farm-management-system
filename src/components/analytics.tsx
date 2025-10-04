"use client";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export function AnalyticsWrapper() {
  // Analytics will automatically work on Vercel
  // You can add conditional logic here if needed
  const isProduction = process.env.NODE_ENV === "production";
  const enableAnalytics = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== "false";

  if (!enableAnalytics) {
    return null;
  }

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}

export default AnalyticsWrapper;
