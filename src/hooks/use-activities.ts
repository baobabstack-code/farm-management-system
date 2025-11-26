"use client";

import { useState, useEffect } from "react";
import { Activity, EntityType, ActivityType } from "@/types";

interface UseActivitiesOptions {
  entityType?: EntityType;
  entityId?: string;
  actionType?: ActivityType;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseActivitiesResult {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

export function useActivities(
  options: UseActivitiesOptions = {}
): UseActivitiesResult {
  const {
    entityType,
    entityId,
    actionType,
    limit = 50,
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
  } = options;

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchActivities = async (reset = false) => {
    try {
      setError(null);
      if (reset) {
        setLoading(true);
        setOffset(0);
      }

      const params = new URLSearchParams();
      if (entityType) params.append("entityType", entityType);
      if (entityId) params.append("entityId", entityId);
      if (actionType) params.append("actionType", actionType);
      params.append("limit", limit.toString());
      params.append("offset", reset ? "0" : offset.toString());

      const response = await fetch(`/api/activities?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch activities");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch activities");
      }

      const newActivities = result.data.map((activity: Activity) => ({
        ...activity,
        timestamp: new Date(activity.timestamp),
        createdAt: new Date(activity.createdAt),
      }));

      if (reset) {
        setActivities(newActivities);
        setOffset(newActivities.length);
      } else {
        setActivities((prev) => [...prev, ...newActivities]);
        setOffset((prev) => prev + newActivities.length);
      }

      setHasMore(result.pagination.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchActivities(true);
  };

  const loadMore = async () => {
    if (!hasMore || loading) return;
    await fetchActivities(false);
  };

  useEffect(() => {
    fetchActivities(true);
  }, [entityType, entityId, actionType, limit, fetchActivities]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetch();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refetch]);

  return {
    activities,
    loading,
    error,
    refetch,
    hasMore,
    loadMore,
  };
}
