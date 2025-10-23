/**
 * Hook for managing user subscription status with 7-day trials
 */

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

export interface UserSubscription {
  id: string;
  userId: string;
  planType: "BASIC" | "PROFESSIONAL" | "ENTERPRISE";
  status: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED";
  trialStartDate: string;
  trialEndDate: string;
  subscriptionStartDate?: string | null;
  subscriptionEndDate?: string | null;
  isActive: boolean;
  daysRemaining: number;
  isTrialActive: boolean;
  isSubscriptionActive: boolean;
}

export function useSubscription() {
  const { user } = useUser();
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      checkSubscriptionStatus();
    } else {
      setLoading(false);
    }
  }, [user]);

  const checkSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/subscription");
      const data = await response.json();

      if (data.success) {
        setSubscription(data.subscription);
        setError(null);
      } else {
        setError(data.error || "Failed to fetch subscription");
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const hasAccess = (): boolean => {
    return (
      subscription?.isTrialActive || subscription?.isSubscriptionActive || false
    );
  };

  const hasFeature = (feature: string): boolean => {
    if (!subscription || !hasAccess()) return false;

    const planFeatures = getPlanFeatures(subscription.planType);
    return (
      planFeatures.includes(feature) || planFeatures.includes("all_features")
    );
  };

  const isProfessional = (): boolean => {
    return subscription?.planType === "PROFESSIONAL" && hasAccess();
  };

  const isEnterprise = (): boolean => {
    return subscription?.planType === "ENTERPRISE" && hasAccess();
  };

  const isBasic = (): boolean => {
    return subscription?.planType === "BASIC" && hasAccess();
  };

  const getPlanLimits = () => {
    if (!subscription) return null;

    const limits = {
      BASIC: {
        fields: 5,
        crops: 10,
        equipment: 5,
        aiRequests: 50,
        storage: "1GB",
      },
      PROFESSIONAL: {
        fields: 25,
        crops: 50,
        equipment: 20,
        aiRequests: 200,
        storage: "10GB",
      },
      ENTERPRISE: {
        fields: -1, // unlimited
        crops: -1,
        equipment: -1,
        aiRequests: -1,
        storage: "100GB",
      },
    };

    return limits[subscription.planType];
  };

  const getPlanFeatures = (
    planType: "BASIC" | "PROFESSIONAL" | "ENTERPRISE"
  ) => {
    const features = {
      BASIC: ["basic_analytics", "crop_tracking", "basic_reports"],
      PROFESSIONAL: [
        "basic_analytics",
        "crop_tracking",
        "basic_reports",
        "advanced_analytics",
        "ai_recommendations",
        "financial_tracking",
        "weather_alerts",
      ],
      ENTERPRISE: [
        "all_features",
        "priority_support",
        "custom_integrations",
        "advanced_ai",
      ],
    };

    return features[planType];
  };

  const getTrialDaysRemaining = (): number => {
    return subscription?.daysRemaining || 0;
  };

  const isTrialExpired = (): boolean => {
    return (
      subscription?.status === "EXPIRED" ||
      (subscription?.status === "TRIAL" && !subscription?.isTrialActive)
    );
  };

  return {
    subscription,
    loading,
    error,
    hasAccess,
    hasFeature,
    isProfessional,
    isEnterprise,
    isBasic,
    getPlanLimits,
    getTrialDaysRemaining,
    isTrialExpired,
    refresh: checkSubscriptionStatus,
  };
}
