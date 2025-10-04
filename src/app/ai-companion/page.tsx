"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AIInsightsCard from "@/components/ai/AIInsightsCard";
import WeatherInsightsCard from "@/components/ai/WeatherInsightsCard";
import CropRecommendationsCard from "@/components/ai/CropRecommendationsCard";
import FinancialInsightsCard from "@/components/ai/FinancialInsightsCard";

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
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
      <div className="content-container py-4 sm:py-6 lg:py-8 mobile-header-spacing">
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center mb-4 gap-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <span className="text-white text-2xl">🤖</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">
                AI Farm Companion
              </h1>
            </div>
          </div>
          <p className="text-base sm:text-lg text-gray-600 max-w-3xl">
            Harness the power of artificial intelligence to get intelligent
            insights, personalized recommendations, and accurate forecasts that
            optimize your farm operations and maximize productivity.
          </p>
        </div>

        {/* AI Insights Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 lg:mb-8">
          <AIInsightsCard />
          <WeatherInsightsCard />
        </div>

        {/* Crop Recommendations */}
        <div className="mb-6 lg:mb-8">
          <CropRecommendationsCard />
        </div>

        {/* Financial Insights */}
        <div className="mb-6 lg:mb-8">
          <FinancialInsightsCard />
        </div>

        {/* Navigation Actions */}
        <div className="card-mobile">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white text-sm">🧧</span>
            </div>
            <h3 className="text-heading text-gray-900">Quick Navigation</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="btn-enhanced btn-primary group"
            >
              <span className="mr-2">🏠</span>
              Back to Dashboard
            </button>
            <button
              onClick={() => router.push("/crops")}
              className="btn-enhanced bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm hover:shadow"
            >
              <span className="mr-2">🌱</span>
              Manage Crops
            </button>
            <button
              onClick={() => router.push("/reports")}
              className="btn-enhanced bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500 shadow-sm hover:shadow"
            >
              <span className="mr-2">📈</span>
              View Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
