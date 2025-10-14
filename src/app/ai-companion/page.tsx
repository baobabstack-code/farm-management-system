"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AIInsightsCard from "@/components/ai/AIInsightsCard";
import WeatherInsightsCard from "@/components/ai/WeatherInsightsCard";
import CropRecommendationsCard from "@/components/ai/CropRecommendationsCard";
import FinancialInsightsCard from "@/components/ai/FinancialInsightsCard";
import { PageHeader, LoadingState } from "@/components/ui/farm-theme";
import { Bot } from "lucide-react";

export default function AICompanionPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push("/sign-in");
      return;
    }
  }, [user, isLoaded, router]);

  if (!isLoaded) {
    return <LoadingState message="Loading AI Companion..." />;
  }

  return (
    <div className="page-container">
      <div className="content-container padding-responsive-lg mobile-header-spacing content-spacing">
        <PageHeader
          title="AI Farm Companion"
          description="Get intelligent insights and recommendations for your farm operations"
          icon={<Bot className="w-6 h-6" />}
        />

        {/* AI Insights Grid */}
        <div className="farm-grid grid-cols-1 xl:grid-cols-2">
          <AIInsightsCard />
          <WeatherInsightsCard />
        </div>

        {/* Crop Recommendations */}
        <CropRecommendationsCard />

        {/* Financial Insights */}
        <FinancialInsightsCard />
      </div>
    </div>
  );
}
