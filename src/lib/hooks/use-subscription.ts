/**
 * Hook for managing user subscription status
 */

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

export interface UserSubscription {
  isActive: boolean;
  plan?: string;
  expiresAt?: Date;
  features: string[];
}

export function useSubscription() {
  const { user } = useUser();
  const [subscription, setSubscription] = useState<UserSubscription>({
    isActive: false,
    features: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkSubscriptionStatus();
    }
  }, [user]);

  const checkSubscriptionStatus = async () => {
    try {
      const response = await fetch("/api/user/subscription");
      const data = await response.json();

      if (data.success) {
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const hasFeature = (feature: string): boolean => {
    return subscription.features.includes(feature);
  };

  const isPremium = (): boolean => {
    return (
      subscription.plan === "PREMIUM_PLAN" ||
      subscription.plan === "ENTERPRISE_PLAN"
    );
  };

  const isEnterprise = (): boolean => {
    return subscription.plan === "ENTERPRISE_PLAN";
  };

  return {
    subscription,
    loading,
    hasFeature,
    isPremium,
    isEnterprise,
    refresh: checkSubscriptionStatus,
  };
}
