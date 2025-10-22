"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AIInsightsCard from "@/components/ai/AIInsightsCard";
import WeatherInsightsCard from "@/components/ai/WeatherInsightsCard";
import CropRecommendationsCard from "@/components/ai/CropRecommendationsCard";
import FinancialInsightsCard from "@/components/ai/FinancialInsightsCard";
import { useAnalytics } from "@/hooks/use-analytics";
import {
  PageHeader,
  LoadingState,
  FarmCard,
  FarmCardHeader,
  FarmCardContent,
} from "@/components/ui/farm-theme";
import { Bot, Palette, Moon, Sun } from "lucide-react";

export default function AICompanionPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { trackAIUsage, trackUserAction } = useAnalytics();

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

        {/* Dark Theme Card Showcase */}
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex-center">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                Dark Theme Card Variants
              </h2>
              <p className="text-sm text-muted-foreground">
                Enhanced card designs for better dark mode experience
              </p>
            </div>
          </div>

          <div className="farm-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* Default Enhanced Card */}
            <FarmCard variant="dark-enhanced" interactive>
              <FarmCardHeader
                title="Enhanced Dark Card"
                description="Subtle glow and improved contrast"
                badge={<Moon className="w-4 h-4 text-blue-400" />}
              />
              <FarmCardContent>
                <div className="farm-card-content">
                  <div className="flex-between py-2">
                    <span className="farm-text-muted">Theme</span>
                    <span className="farm-text-body font-semibold">
                      Dark Enhanced
                    </span>
                  </div>
                  <div className="flex-between py-2">
                    <span className="farm-text-muted">Features</span>
                    <span className="farm-text-body font-semibold">
                      Glow Effect
                    </span>
                  </div>
                </div>
              </FarmCardContent>
            </FarmCard>

            {/* Glass Effect Card */}
            <FarmCard variant="glass" interactive>
              <FarmCardHeader
                title="Glass Effect Card"
                description="Translucent with backdrop blur"
                badge={<Sun className="w-4 h-4 text-amber-400" />}
              />
              <FarmCardContent>
                <div className="farm-card-content">
                  <div className="flex-between py-2">
                    <span className="farm-text-muted">Theme</span>
                    <span className="farm-text-body font-semibold">Glass</span>
                  </div>
                  <div className="flex-between py-2">
                    <span className="farm-text-muted">Features</span>
                    <span className="farm-text-body font-semibold">
                      Backdrop Blur
                    </span>
                  </div>
                </div>
              </FarmCardContent>
            </FarmCard>

            {/* Elevated Card */}
            <FarmCard variant="elevated" interactive>
              <FarmCardHeader
                title="Elevated Card"
                description="Higher elevation with strong shadows"
                badge={<Bot className="w-4 h-4 text-green-400" />}
              />
              <FarmCardContent>
                <div className="farm-card-content">
                  <div className="flex-between py-2">
                    <span className="farm-text-muted">Theme</span>
                    <span className="farm-text-body font-semibold">
                      Elevated
                    </span>
                  </div>
                  <div className="flex-between py-2">
                    <span className="farm-text-muted">Features</span>
                    <span className="farm-text-body font-semibold">
                      Strong Shadows
                    </span>
                  </div>
                </div>
              </FarmCardContent>
            </FarmCard>
          </div>
        </div>
      </div>
    </div>
  );
}
