/**
 * React Hook for Analytics Integration
 * Provides easy-to-use analytics functions for React components
 */

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import analytics, { FarmAnalyticsEvent } from "@/lib/analytics";

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

  return {
    trackEvent: analytics.track,
    trackUserAction: analytics.userAction,
    trackAIUsage: analytics.aiUsage,
    trackEquipment: analytics.equipment,
    trackFinancial: analytics.financial,
    // Convenience methods - these can remain as they provide specific event structures
    trackCropCreated: (cropType: string, fieldId?: string) =>
      analytics.track("crop_created", {
        crop_type: cropType,
        field_id: fieldId,
      }),

    trackTaskCompleted: (taskType: string, duration?: number) =>
      analytics.track("task_completed", {
        task_type: taskType,
        duration_minutes: duration,
      }),

    trackReportGenerated: (reportType: string, filters?: Record<string, any>) =>
      analytics.track("report_generated", {
        report_type: reportType,
        ...filters,
      }),

    trackWeatherViewed: (location?: string) =>
      analytics.track("weather_viewed", { location }),

    trackSettingsUpdated: (settingCategory: string) =>
      analytics.track("settings_updated", { category: settingCategory }),
  };
}

/**
 * Hook for tracking component mount/unmount and interaction time
 */
export function useComponentAnalytics(componentName: string) {
  // Directly use analytics.userAction
  const trackUserAction = analytics.userAction;

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

  const trackInteraction = (
    interactionType: string,
    details?: Record<string, any>
  ) => {
    trackUserAction("component_interaction", "ui", {
      component: componentName,
      interaction: interactionType,
      ...details,
    });
  };

  return { trackInteraction };
}

/**
 * Hook for tracking form analytics
 */
export function useFormAnalytics(formName: string) {
  // Directly use analytics.userAction
  const trackUserAction = analytics.userAction;

  const trackFormStart = () => {
    trackUserAction("form_started", "form", { form_name: formName });
  };

  const trackFormSubmit = (success: boolean, errors?: string[]) => {
    trackUserAction("form_submitted", "form", {
      form_name: formName,
      success,
      error_count: errors?.length || 0,
      errors: errors?.join(", "),
    });
  };

  const trackFormAbandoned = (completionPercentage: number) => {
    trackUserAction("form_abandoned", "form", {
      form_name: formName,
      completion_percentage: completionPercentage,
    });
  };

  const trackFieldInteraction = (
    fieldName: string,
    action: "focus" | "blur" | "change"
  ) => {
    trackUserAction("form_field_interaction", "form", {
      form_name: formName,
      field_name: fieldName,
      action,
    });
  };

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
  // Directly use analytics.userAction
  const trackUserAction = analytics.userAction;

  const trackSearch = (
    query: string,
    resultsCount: number,
    category?: string
  ) => {
    trackUserAction("search_performed", "search", {
      query,
      results_count: resultsCount,
      category,
      query_length: query.length,
    });
  };

  const trackFilter = (
    filterType: string,
    filterValue: string,
    resultsCount: number
  ) => {
    trackUserAction("filter_applied", "search", {
      filter_type: filterType,
      filter_value: filterValue,
      results_count: resultsCount,
    });
  };

  const trackSort = (sortBy: string, sortOrder: "asc" | "desc") => {
    trackUserAction("sort_applied", "search", {
      sort_by: sortBy,
      sort_order: sortOrder,
    });
  };

  return {
    trackSearch,
    trackFilter,
    trackSort,
  };
}
