// Feature flags for AI functionality rollout
export interface FeatureFlags {
  aiAnalytics: boolean;
  aiCropRecommendations: boolean;
  aiFinancialInsights: boolean;
  aiPestDetection: boolean;
  aiIrrigationOptimization: boolean;
  aiChatAssistant: boolean;
}

// Default flags - start with everything disabled for safety
const DEFAULT_FLAGS: FeatureFlags = {
  aiAnalytics: false,
  aiCropRecommendations: false,
  aiFinancialInsights: false,
  aiPestDetection: false,
  aiIrrigationOptimization: false,
  aiChatAssistant: false,
};

// Get feature flags based on environment and user preferences
export function getFeatureFlags(): FeatureFlags {
  if (typeof window === "undefined") {
    // Server-side: use environment variables
    return {
      aiAnalytics: process.env.ENABLE_AI_ANALYTICS === "true",
      aiCropRecommendations:
        process.env.ENABLE_AI_CROP_RECOMMENDATIONS === "true",
      aiFinancialInsights: process.env.ENABLE_AI_FINANCIAL_INSIGHTS === "true",
      aiPestDetection: process.env.ENABLE_AI_PEST_DETECTION === "true",
      aiIrrigationOptimization: process.env.ENABLE_AI_IRRIGATION === "true",
      aiChatAssistant: process.env.ENABLE_AI_CHAT_ASSISTANT === "true",
    };
  }

  // Client-side: could use localStorage for user-specific flags
  const stored = localStorage.getItem("featureFlags");
  if (stored) {
    try {
      return { ...DEFAULT_FLAGS, ...JSON.parse(stored) };
    } catch {
      return DEFAULT_FLAGS;
    }
  }

  return DEFAULT_FLAGS;
}

// Hook for React components to check if a feature is enabled
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[feature];
}

// Hook for React components
export function useFeatureFlag(feature: keyof FeatureFlags): boolean {
  return isFeatureEnabled(feature);
}
