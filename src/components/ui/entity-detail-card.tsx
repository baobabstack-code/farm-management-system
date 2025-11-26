"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  FarmCard,
  FarmCardHeader,
  FarmCardContent,
  FarmBadge,
} from "@/components/ui/farm-theme";

// === TYPES ===

export interface BadgeConfig {
  variant: "success" | "warning" | "error" | "info" | "neutral";
  label: string;
}

export interface FieldConfig {
  label: string;
  key: string;
  formatter?: (value: unknown) => string;
  badge?: BadgeConfig | ((value: unknown) => BadgeConfig | null);
  icon?: React.ComponentType<{ className?: string }>;
  copyable?: boolean;
  clickable?: boolean;
  onClick?: (value: any) => void;
}

export interface EntityDetailCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  data: Record<string, unknown>;
  fields: FieldConfig[];
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  layout?: "default" | "compact" | "grid";
}

// === UTILITY FUNCTIONS ===

const defaultFormatters = {
  currency: (value: number) => {
    if (typeof value !== "number") return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  },

  date: (value: string | Date) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleDateString();
  },

  datetime: (value: string | Date) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleString();
  },

  number: (value: number) => {
    if (typeof value !== "number") return "N/A";
    return value.toLocaleString();
  },

  percentage: (value: number) => {
    if (typeof value !== "number") return "N/A";
    return `${value}%`;
  },

  capitalize: (value: string) => {
    if (typeof value !== "string") return "N/A";
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  },

  replace_underscore: (value: string) => {
    if (typeof value !== "string") return "N/A";
    return value.replace(/_/g, " ");
  },
};

const formatValue = (
  value: unknown,
  formatter?: (value: unknown) => string
): string => {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  if (formatter) {
    return formatter(value);
  }

  return String(value);
};

const getBadgeFromConfig = (
  value: unknown,
  badgeConfig?: BadgeConfig | ((value: unknown) => BadgeConfig | null)
): BadgeConfig | null => {
  if (!badgeConfig) return null;

  if (typeof badgeConfig === "function") {
    return badgeConfig(value);
  }

  return badgeConfig;
};

// === LOADING SKELETON ===

const FieldSkeleton: React.FC = () => (
  <div className="flex justify-between items-center">
    <div className="h-4 bg-muted rounded w-24 animate-pulse" />
    <div className="h-4 bg-muted rounded w-32 animate-pulse" />
  </div>
);

const LoadingSkeleton: React.FC<{ fieldCount: number }> = ({ fieldCount }) => (
  <div className="space-y-3">
    {Array.from({ length: fieldCount }).map((_, index) => (
      <FieldSkeleton key={index} />
    ))}
  </div>
);

// === ERROR STATE ===

const ErrorState: React.FC<{ message: string }> = ({ message }) => (
  <div className="text-center py-6">
    <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
      <span className="text-destructive text-xl">⚠️</span>
    </div>
    <p className="text-destructive font-medium mb-2">Error Loading Data</p>
    <p className="farm-text-muted text-sm">{message}</p>
  </div>
);

// === EMPTY STATE ===

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="text-center py-6">
    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
      <span className="text-muted-foreground text-xl">📄</span>
    </div>
    <p className="farm-text-muted">{message}</p>
  </div>
);

// === FIELD COMPONENT ===

interface FieldProps {
  field: FieldConfig;
  value: unknown;
  layout: "default" | "compact" | "grid";
}

const Field: React.FC<FieldProps> = ({ field, value, layout }) => {
  const Icon = field.icon;
  const formattedValue = formatValue(value, field.formatter);
  const badgeConfig = getBadgeFromConfig(value, field.badge);

  const handleClick = () => {
    if (field.clickable && field.onClick) {
      field.onClick(value);
    }
  };

  const handleCopy = async () => {
    if (field.copyable && formattedValue !== "N/A") {
      try {
        await navigator.clipboard.writeText(String(value));
        // TODO: Show toast notification
        console.log("Copied to clipboard:", value);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  if (layout === "grid") {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
          <span className="farm-text-caption">{field.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {badgeConfig ? (
            <FarmBadge variant={badgeConfig.variant}>
              {badgeConfig.label}
            </FarmBadge>
          ) : (
            <span
              className={cn("farm-text-body font-medium", {
                "cursor-pointer hover:text-primary": field.clickable,
                "cursor-pointer hover:bg-muted px-1 py-0.5 rounded":
                  field.copyable,
              })}
              onClick={
                field.clickable
                  ? handleClick
                  : field.copyable
                    ? handleCopy
                    : undefined
              }
              title={field.copyable ? "Click to copy" : undefined}
            >
              {formattedValue}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center",
        layout === "compact" ? "justify-between" : "justify-between"
      )}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
        <span className="farm-text-muted">{field.label}</span>
      </div>
      <div className="flex items-center gap-2">
        {badgeConfig ? (
          <FarmBadge variant={badgeConfig.variant}>
            {badgeConfig.label}
          </FarmBadge>
        ) : (
          <span
            className={cn("farm-text-body font-medium", {
              "cursor-pointer hover:text-primary": field.clickable,
              "cursor-pointer hover:bg-muted px-1 py-0.5 rounded":
                field.copyable,
            })}
            onClick={
              field.clickable
                ? handleClick
                : field.copyable
                  ? handleCopy
                  : undefined
            }
            title={field.copyable ? "Click to copy" : undefined}
          >
            {formattedValue}
          </span>
        )}
      </div>
    </div>
  );
};

// === MAIN COMPONENT ===

export const EntityDetailCard = React.forwardRef<
  HTMLDivElement,
  EntityDetailCardProps
>(
  (
    {
      className,
      title,
      description,
      badge,
      data,
      fields,
      loading = false,
      error,
      emptyMessage = "No data available",
      layout = "default",
      ...props
    },
    ref
  ) => {
    // Check if we have any data to display
    const hasData = fields.some((field) => {
      const value = data[field.key];
      return value !== null && value !== undefined && value !== "";
    });

    return (
      <FarmCard ref={ref} className={cn(className)} {...props}>
        <FarmCardHeader title={title} description={description} badge={badge} />
        <FarmCardContent>
          {loading ? (
            <LoadingSkeleton fieldCount={fields.length} />
          ) : error ? (
            <ErrorState message={error} />
          ) : !hasData ? (
            <EmptyState message={emptyMessage} />
          ) : (
            <div
              className={cn({
                "space-y-3": layout === "default" || layout === "compact",
                "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4":
                  layout === "grid",
              })}
            >
              {fields.map((field) => {
                const value = data[field.key];

                // Skip fields with no data unless they have a badge that should always show
                if (
                  (value === null || value === undefined || value === "") &&
                  !field.badge
                ) {
                  return null;
                }

                return (
                  <Field
                    key={field.key}
                    field={field}
                    value={value}
                    layout={layout}
                  />
                );
              })}
            </div>
          )}
        </FarmCardContent>
      </FarmCard>
    );
  }
);

EntityDetailCard.displayName = "EntityDetailCard";

// === EXPORT FORMATTERS FOR CONVENIENCE ===

export { defaultFormatters };
