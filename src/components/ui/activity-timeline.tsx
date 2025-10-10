"use client";

import React, { useState, useMemo } from "react";
import { Activity, ActivityType, EntityType } from "@/types";
import { FarmCard, FarmCardContent, FarmButton, FarmBadge } from "./farm-theme";
import { cn } from "@/lib/utils";

interface ActivityTimelineProps {
  activities: Activity[];
  entityType?: string;
  entityId?: string;
  showFilters?: boolean;
  maxItems?: number;
  className?: string;
}

interface ActivityFilter {
  actionTypes: ActivityType[];
  dateRange: "all" | "today" | "week" | "month";
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  entityType,
  entityId,
  showFilters = true,
  maxItems = 50,
  className,
}) => {
  const [filter, setFilter] = useState<ActivityFilter>({
    actionTypes: [],
    dateRange: "all",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter activities based on current filters
  const filteredActivities = useMemo(() => {
    let filtered = [...activities];

    // Filter by action types if any are selected
    if (filter.actionTypes.length > 0) {
      filtered = filtered.filter((activity) =>
        filter.actionTypes.includes(activity.actionType)
      );
    }

    // Filter by date range
    const now = new Date();
    switch (filter.dateRange) {
      case "today":
        filtered = filtered.filter((activity) => {
          const activityDate = new Date(activity.timestamp);
          return activityDate.toDateString() === now.toDateString();
        });
        break;
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((activity) => {
          const activityDate = new Date(activity.timestamp);
          return activityDate >= weekAgo;
        });
        break;
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((activity) => {
          const activityDate = new Date(activity.timestamp);
          return activityDate >= monthAgo;
        });
        break;
    }

    // Sort by timestamp (newest first)
    filtered.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Limit to maxItems
    return filtered.slice(0, maxItems);
  }, [activities, filter, maxItems]);

  // Paginate filtered activities
  const paginatedActivities = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredActivities.slice(startIndex, endIndex);
  }, [filteredActivities, currentPage]);

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);

  const getActivityIcon = (actionType: ActivityType): string => {
    switch (actionType) {
      case ActivityType.CREATED:
        return "➕";
      case ActivityType.UPDATED:
        return "✏️";
      case ActivityType.DELETED:
        return "🗑️";
      case ActivityType.STATUS_CHANGED:
        return "🔄";
      case ActivityType.COMPLETED:
        return "✅";
      case ActivityType.SCHEDULED:
        return "📅";
      case ActivityType.CANCELLED:
        return "❌";
      case ActivityType.LOGGED:
        return "📝";
      case ActivityType.TESTED:
        return "🧪";
      case ActivityType.MAINTAINED:
        return "🔧";
      case ActivityType.HARVESTED:
        return "🌾";
      case ActivityType.PLANTED:
        return "🌱";
      case ActivityType.TREATED:
        return "💊";
      default:
        return "📋";
    }
  };

  const getActivityBadgeVariant = (actionType: ActivityType) => {
    switch (actionType) {
      case ActivityType.CREATED:
      case ActivityType.COMPLETED:
      case ActivityType.HARVESTED:
      case ActivityType.PLANTED:
        return "success";
      case ActivityType.UPDATED:
      case ActivityType.STATUS_CHANGED:
      case ActivityType.LOGGED:
      case ActivityType.TESTED:
      case ActivityType.MAINTAINED:
      case ActivityType.TREATED:
        return "info";
      case ActivityType.SCHEDULED:
        return "warning";
      case ActivityType.DELETED:
      case ActivityType.CANCELLED:
        return "error";
      default:
        return "neutral";
    }
  };

  const formatTimestamp = (timestamp: Date): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    } else if (diffInHours < 168) {
      // 7 days
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days !== 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const toggleActionTypeFilter = (actionType: ActivityType) => {
    setFilter((prev) => ({
      ...prev,
      actionTypes: prev.actionTypes.includes(actionType)
        ? prev.actionTypes.filter((type) => type !== actionType)
        : [...prev.actionTypes, actionType],
    }));
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const setDateRangeFilter = (dateRange: ActivityFilter["dateRange"]) => {
    setFilter((prev) => ({ ...prev, dateRange }));
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const clearFilters = () => {
    setFilter({ actionTypes: [], dateRange: "all" });
    setCurrentPage(1);
  };

  // Get unique action types from activities for filter options
  const availableActionTypes = useMemo(() => {
    const types = new Set(activities.map((activity) => activity.actionType));
    return Array.from(types).sort();
  }, [activities]);

  if (activities.length === 0) {
    return (
      <FarmCard className={className}>
        <FarmCardContent>
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="farm-heading-card mb-2">No Activity Yet</h3>
            <p className="farm-text-muted">
              Activity will appear here as you work with your farm data.
            </p>
          </div>
        </FarmCardContent>
      </FarmCard>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {showFilters && (
        <FarmCard>
          <FarmCardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="farm-heading-card">Activity Filters</h3>
                {(filter.actionTypes.length > 0 ||
                  filter.dateRange !== "all") && (
                  <FarmButton variant="ghost" size="sm" onClick={clearFilters}>
                    Clear Filters
                  </FarmButton>
                )}
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Time Period
                </label>
                <div className="flex flex-wrap gap-2">
                  {(["all", "today", "week", "month"] as const).map((range) => (
                    <FarmButton
                      key={range}
                      variant={
                        filter.dateRange === range ? "primary" : "outline"
                      }
                      size="sm"
                      onClick={() => setDateRangeFilter(range)}
                    >
                      {range === "all"
                        ? "All Time"
                        : range === "today"
                          ? "Today"
                          : range === "week"
                            ? "This Week"
                            : "This Month"}
                    </FarmButton>
                  ))}
                </div>
              </div>

              {/* Action Type Filter */}
              {availableActionTypes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Activity Types
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableActionTypes.map((actionType) => (
                      <FarmButton
                        key={actionType}
                        variant={
                          filter.actionTypes.includes(actionType)
                            ? "primary"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => toggleActionTypeFilter(actionType)}
                      >
                        {getActivityIcon(actionType)}{" "}
                        {actionType.replace("_", " ")}
                      </FarmButton>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                Showing {filteredActivities.length} of {activities.length}{" "}
                activities
              </div>
            </div>
          </FarmCardContent>
        </FarmCard>
      )}

      <FarmCard>
        <FarmCardContent>
          <div className="space-y-4">
            <h3 className="farm-heading-card">Activity Timeline</h3>

            {paginatedActivities.length === 0 ? (
              <div className="text-center py-8">
                <p className="farm-text-muted">
                  No activities match your current filters.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedActivities.map((activity, index) => (
                  <div
                    key={activity.id}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-lg border",
                      "hover:bg-muted/50 transition-colors"
                    )}
                  >
                    {/* Timeline connector */}
                    <div className="relative flex flex-col items-center">
                      <div className="w-8 h-8 bg-background border-2 border-primary rounded-full flex items-center justify-center text-sm">
                        {getActivityIcon(activity.actionType)}
                      </div>
                      {index < paginatedActivities.length - 1 && (
                        <div className="w-px h-8 bg-border mt-2" />
                      )}
                    </div>

                    {/* Activity content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FarmBadge
                          variant={getActivityBadgeVariant(activity.actionType)}
                        >
                          {activity.actionType.replace("_", " ")}
                        </FarmBadge>
                        <span className="text-sm text-muted-foreground">
                          {formatTimestamp(activity.timestamp)}
                        </span>
                      </div>

                      <p className="text-sm font-medium mb-1">
                        {activity.description}
                      </p>

                      {activity.metadata &&
                        Object.keys(activity.metadata).length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {Object.entries(activity.metadata).map(
                              ([key, value]) => (
                                <span key={key} className="mr-3">
                                  {key}: {String(value)}
                                </span>
                              )
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <FarmButton
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                  >
                    Previous
                  </FarmButton>
                  <FarmButton
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </FarmButton>
                </div>
              </div>
            )}
          </div>
        </FarmCardContent>
      </FarmCard>
    </div>
  );
};

export default ActivityTimeline;
