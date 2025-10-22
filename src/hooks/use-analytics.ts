/**
 * React Hook for Analytics Integration
 * Provides easy-to-use analytics functions for React components
 */

import { useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { analytics, FarmAnalyticsEvent } from "@/lib/analytics";

/**
 * Hook for tracking analytics events in React components
 */
export function useAnalytics() {
  const pathname = usePathname();

  // Track page views automatically
  useEffect(() => {
    if (pathname) {
      const pageName = pathname.split("/").filter(Boolean).join("_") || "home";
      analytics.pageView(pageName, {
        path: pathname,
        timestamp: new Date().toISOString(),
      });
    }
  }, [pathname]);

  // Memoized tracking functions
  const trackEvent = useCallback(
    (event: FarmAnalyticsEvent, properties?: Record<string, any>) => {
      analytics.track(event, properties);
    },
    []
  );

  const trackUserAction = useCallback(
    (action: string, category: string, properties?: Record<string, any>) => {
      analytics.userAction(action, category, properties);
    },
    []
  );

  const trackAIUsage = useCallback(
    (
      feature:
        | "crop_recommendations"
        | "weather_insights"
        | "financial_insights"
        | "chat_assistant",
      properties?: Record<string, any>
    ) => {
      analytics.aiUsage(feature, properties);
    },
    []
  );

  const trackEquipment = useCallback(
    (
      eventType: "added" | "maintenance" | "repair" | "usage",
      equipmentType: string,
      properties?: Record<string, any>
    ) => {
      analytics.equipment(eventType, equipmentType, properties);
    },
    []
  );

  const trackFinancial = useCallback(
    (
      transactionType: "income" | "expense" | "investment",
      amount: number,
      category: string,
      properties?: Record<string, any>
    ) => {
      analytics.financial(transactionType, amount, category, properties);
    },
    []
  );

  return {
    trackEvent,
    trackUserAction,
    trackAIUsage,
    trackEquipment,
    trackFinancial,
    // Convenience methods
    trackCropCreated: (cropType: string, fieldId?: string) =>
      trackEvent("crop_created", { crop_type: cropType, field_id: fieldId }),

    trackTaskCompleted: (taskType: string, duration?: number) =>
      trackEvent("task_completed", {
        task_type: taskType,
        duration_minutes: duration,
      }),

    trackReportGenerated: (reportType: string, filters?: Record<string, any>) =>
      trackEvent("report_generated", { report_type: reportType, ...filters }),

    trackWeatherViewed: (location?: string) =>
      trackEvent("weather_viewed", { location }),

    trackSettingsUpdated: (settingCategory: string) =>
      trackEvent("settings_updated", { category: settingCategory }),
  };
}

/**
 * Hook for tracking component mount/unmount and interaction time
 */
export function useComponentAnalytics(componentName: string) {
  const { trackUserAction } = useAnalytics();

  useEffect(() => {
    const startTime = Date.now();

    // Track component mount
    trackUserAction("component_mounted", "ui", { component: componentName });

    return () => {
      // Track component unmount and time spent
      const timeSpent = Date.now() - startTime;
      trackUserAction("component_unmounted", "ui", {
        component: componentName,
        time_spent_ms: timeSpent,
      });
    };
  }, [componentName, trackUserAction]);

  const trackInteraction = useCallback(
    (interactionType: string, details?: Record<string, any>) => {
      trackUserAction("component_interaction", "ui", {
        component: componentName,
        interaction: interactionType,
        ...details,
      });
    },
    [componentName, trackUserAction]
  );

  return { trackInteraction };
}

/**
 * Hook for tracking form analytics
 */
export function useFormAnalytics(formName: string) {
  const { trackUserAction } = useAnalytics();

  const trackFormStart = useCallback(() => {
    trackUserAction("form_started", "form", { form_name: formName });
  }, [formName, trackUserAction]);

  const trackFormSubmit = useCallback(
    (success: boolean, errors?: string[]) => {
      trackUserAction("form_submitted", "form", {
        form_name: formName,
        success,
        error_count: errors?.length || 0,
        errors: errors?.join(", "),
      });
    },
    [formName, trackUserAction]
  );

  const trackFormAbandoned = useCallback(
    (completionPercentage: number) => {
      trackUserAction("form_abandoned", "form", {
        form_name: formName,
        completion_percentage: completionPercentage,
      });
    },
    [formName, trackUserAction]
  );

  const trackFieldInteraction = useCallback(
    (fieldName: string, action: "focus" | "blur" | "change") => {
      trackUserAction("form_field_interaction", "form", {
        form_name: formName,
        field_name: fieldName,
        action,
      });
    },
    [formName, trackUserAction]
  );

  return {
    trackFormStart,
    trackFormSubmit,
    trackFormAbandoned,
    trackFieldInteraction,
  };
}

/**
 * Hook for tracking search and filter analytics
 */
export function useSearchAnalytics() {
  const { trackUserAction } = useAnalytics();

  const trackSearch = useCallback(
    (query: string, resultsCount: number, category?: string) => {
      trackUserAction("search_performed", "search", {
        query,
        results_count: resultsCount,
        category,
        query_length: query.length,
      });
    },
    [trackUserAction]
  );

  const trackFilter = useCallback(
    (filterType: string, filterValue: string, resultsCount: number) => {
      trackUserAction("filter_applied", "search", {
        filter_type: filterType,
        filter_value: filterValue,
        results_count: resultsCount,
      });
    },
    [trackUserAction]
  );

  const trackSort = useCallback(
    (sortBy: string, sortOrder: "asc" | "desc") => {
      trackUserAction("sort_applied", "search", {
        sort_by: sortBy,
        sort_order: sortOrder,
      });
    },
    [trackUserAction]
  );

  return {
    trackSearch,
    trackFilter,
    trackSort,
  };
}
