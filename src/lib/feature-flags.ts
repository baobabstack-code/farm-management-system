// Feature flags for AI functionality rollout
export interface FeatureFlags {
  aiAnalytics: boolean;
  aiCropRecommendations: boolean;
  aiFinancialInsights: boolean;
  aiPestDetection: boolean;
  aiIrrigationOptimization: boolean;
  aiChatAssistant: boolean;
  aiAdkChat: boolean;
}

// Default flags - start with everything disabled for safety
const DEFAULT_FLAGS: FeatureFlags = {
  aiAnalytics: false,
  aiCropRecommendations: false,
  aiFinancialInsights: false,
  aiPestDetection: false,
  aiIrrigationOptimization: false,
  aiChatAssistant: false,
  aiAdkChat: false,
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
      aiAdkChat: process.env.ENABLE_AI_ADK_CHAT === "true",
    };
  }

  // Client-side: use environment variables that were passed from server
  // Next.js automatically exposes NEXT_PUBLIC_ prefixed variables to the client
  // For now, let's enable AI analytics by default on client-side for development
  const stored = localStorage.getItem("featureFlags");
  if (stored) {
    try {
      return { ...DEFAULT_FLAGS, ...JSON.parse(stored) };
    } catch {
      // Fallback to enabled state for development
      return {
        aiAnalytics: true,
        aiCropRecommendations: true,
        aiFinancialInsights: true,
        aiPestDetection: false,
        aiIrrigationOptimization: false,
        aiChatAssistant: true,
        aiAdkChat: false,
      };
    }
  }

  // Default to enabled for development
  return {
    aiAnalytics: true,
    aiCropRecommendations: true,
    aiFinancialInsights: true,
    aiPestDetection: false,
    aiIrrigationOptimization: false,
    aiChatAssistant: true,
    aiAdkChat: false,
  };
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
