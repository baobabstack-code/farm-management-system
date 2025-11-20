/**
 * Analytics Configuration for FarmFlow
 * Handles Vercel Analytics and custom event tracking
 */

import { track } from "@vercel/analytics";

// Custom event types for farm management analytics
export type FarmAnalyticsEvent =
  | "crop_created"
  | "crop_updated"
  | "crop_deleted"
  | "field_created"
  | "field_updated"
  | "field_deleted"
  | "task_created"
  | "task_completed"
  | "task_updated"
  | "equipment_added"
  | "equipment_maintenance"
  | "weather_viewed"
  | "ai_insight_viewed"
  | "report_generated"
  | "page_viewed"
  | "dashboard_viewed"
  | "settings_updated"
  | "profile_updated"
  | "financial_transaction"
  | "planning_session"
  | "soil_test_recorded";

// Analytics event properties
interface AnalyticsEventProperties {
  [key: string]: string | number | boolean;
}

/**
 * Track custom farm management events
 */
export function trackFarmEvent(
  event: FarmAnalyticsEvent,
  properties?: AnalyticsEventProperties
) {
  try {
    // Only track in production or when analytics is enabled
    if (
      process.env.NODE_ENV === "production" ||
      process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== "false"
    ) {
      track(event, properties || {});
    }

    // Log in development for debugging
    if (process.env.NODE_ENV === "development") {
      console.log("📊 Analytics Event:", event, properties);
    }
  } catch (error) {
    console.error("Analytics tracking error:", error);
  }
}

/**
 * Track page views with custom properties
 */
export function trackPageView(
  pageName: string,
  properties?: AnalyticsEventProperties
) {
  trackFarmEvent("page_viewed", {
    page: pageName,
    ...properties,
  });
}

/**
 * Track user actions with context
 */
export function trackUserAction(
  action: string,
  category: string,
  properties?: AnalyticsEventProperties
) {
  try {
    track(`${category}_${action}`, {
      category,
      action,
      ...(properties || {}),
    });
  } catch (error) {
    console.error("User action tracking error:", error);
  }
}

/**
 * Track farm performance metrics
 */
export function trackFarmMetrics(
  metricType: "yield" | "cost" | "efficiency" | "sustainability",
  value: number,
  unit: string,
  properties?: AnalyticsEventProperties
) {
  trackFarmEvent("report_generated", {
    metric_type: metricType,
    value,
    unit,
    ...properties,
  });
}

/**
 * Track AI feature usage
 */
export function trackAIUsage(
  feature:
    | "crop_recommendations"
    | "weather_insights"
    | "financial_insights"
    | "chat_assistant",
  properties?: AnalyticsEventProperties
) {
  trackFarmEvent("ai_insight_viewed", {
    ai_feature: feature,
    ...properties,
  });
}

/**
 * Track equipment and maintenance events
 */
export function trackEquipmentEvent(
  eventType: "added" | "maintenance" | "repair" | "usage",
  equipmentType: string,
  properties?: AnalyticsEventProperties
) {
  const event =
    eventType === "added" ? "equipment_added" : "equipment_maintenance";
  trackFarmEvent(event, {
    equipment_type: equipmentType,
    event_type: eventType,
    ...properties,
  });
}

/**
 * Track financial events
 */
export function trackFinancialEvent(
  transactionType: "income" | "expense" | "investment",
  amount: number,
  category: string,
  properties?: AnalyticsEventProperties
) {
  trackFarmEvent("financial_transaction", {
    transaction_type: transactionType,
    amount,
    category,
    ...properties,
  });
}

/**
 * Analytics utility functions
 */
export const analytics = {
  track: trackFarmEvent,
  pageView: trackPageView,
  userAction: trackUserAction,
  farmMetrics: trackFarmMetrics,
  aiUsage: trackAIUsage,
  equipment: trackEquipmentEvent,
  financial: trackFinancialEvent,
};

// Export default analytics object
export default analytics;
