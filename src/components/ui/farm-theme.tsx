import * as React from "react";
import { cn } from "@/lib/utils";

// === PAGE LAYOUT COMPONENTS ===

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const PageContainer = React.forwardRef<
  HTMLDivElement,
  PageContainerProps
>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("page-container", className)} {...props}>
    <div className="content-container py-4 sm:py-6 lg:py-8 mobile-header-spacing">
      {children}
    </div>
  </div>
));
PageContainer.displayName = "PageContainer";

// === PAGE HEADER COMPONENTS ===

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, description, icon, actions, ...props }, ref) => (
    <div ref={ref} className={cn("farm-page-header", className)} {...props}>
      <div className="farm-page-title-section">
        <div className="farm-page-title-group">
          {icon && (
            <div className="farm-page-icon bg-gradient-to-br from-primary to-primary-hover">
              {icon}
            </div>
          )}
          <div className="farm-page-title-text">
            <h1 className="farm-heading-display">{title}</h1>
            {description && (
              <p className="farm-text-muted mt-1">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  )
);
PageHeader.displayName = "PageHeader";

// === CARD COMPONENTS ===

interface FarmCardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  variant?: "default" | "metric";
}

export const FarmCard = React.forwardRef<HTMLDivElement, FarmCardProps>(
  ({ className, interactive = false, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "farm-card",
        {
          "farm-card-interactive": interactive,
          "metric-card": variant === "metric",
        },
        className
      )}
      {...props}
    />
  )
);
FarmCard.displayName = "FarmCard";

interface FarmCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  badge?: React.ReactNode;
}

export const FarmCardHeader = React.forwardRef<
  HTMLDivElement,
  FarmCardHeaderProps
>(({ className, title, description, badge, ...props }, ref) => (
  <div ref={ref} className={cn("farm-card-header", className)} {...props}>
    <div>
      <h3 className="farm-card-title">{title}</h3>
      {description && (
        <p className="farm-card-description mt-1">{description}</p>
      )}
    </div>
    {badge && <div>{badge}</div>}
  </div>
));
FarmCardHeader.displayName = "FarmCardHeader";

export const FarmCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-4", className)} {...props} />
));
FarmCardContent.displayName = "FarmCardContent";

// === BUTTON COMPONENTS ===

interface FarmButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "destructive"
    | "outline"
    | "ghost";
  size?: "default" | "sm" | "lg";
  loading?: boolean;
}

export const FarmButton = React.forwardRef<HTMLButtonElement, FarmButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "default",
      loading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      className={cn(
        "farm-btn",
        {
          "farm-btn-primary": variant === "primary",
          "farm-btn-secondary": variant === "secondary",
          "farm-btn-success": variant === "success",
          "farm-btn-warning": variant === "warning",
          "farm-btn-destructive": variant === "destructive",
          "farm-btn-outline": variant === "outline",
          "farm-btn-ghost": variant === "ghost",
          "farm-btn-sm": size === "sm",
          "farm-btn-lg": size === "lg",
        },
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  )
);
FarmButton.displayName = "FarmButton";

// === BADGE COMPONENTS ===

interface FarmBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "error" | "info" | "neutral";
}

export const FarmBadge = React.forwardRef<HTMLSpanElement, FarmBadgeProps>(
  ({ className, variant = "neutral", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "farm-badge",
        {
          "farm-badge-success": variant === "success",
          "farm-badge-warning": variant === "warning",
          "farm-badge-error": variant === "error",
          "farm-badge-info": variant === "info",
          "farm-badge-neutral": variant === "neutral",
        },
        className
      )}
      {...props}
    />
  )
);
FarmBadge.displayName = "FarmBadge";

// === FORM COMPONENTS ===

interface FarmFormProps extends React.FormHTMLAttributes<HTMLFormElement> {}

export const FarmForm = React.forwardRef<HTMLFormElement, FarmFormProps>(
  ({ className, ...props }, ref) => (
    <form ref={ref} className={cn("farm-form", className)} {...props} />
  )
);
FarmForm.displayName = "FarmForm";

interface FarmFormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  required?: boolean;
  error?: string;
}

export const FarmFormGroup = React.forwardRef<
  HTMLDivElement,
  FarmFormGroupProps
>(({ className, label, required = false, error, children, ...props }, ref) => (
  <div ref={ref} className={cn("farm-form-group", className)} {...props}>
    <label className="farm-form-label">
      {label}
      {required && <span className="text-destructive ml-1">*</span>}
    </label>
    {children}
    {error && <p className="text-sm text-destructive mt-1">{error}</p>}
  </div>
));
FarmFormGroup.displayName = "FarmFormGroup";

interface FarmInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const FarmInput = React.forwardRef<HTMLInputElement, FarmInputProps>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn("farm-form-input", className)} {...props} />
  )
);
FarmInput.displayName = "FarmInput";

interface FarmSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const FarmSelect = React.forwardRef<HTMLSelectElement, FarmSelectProps>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn("farm-form-select", className)}
      {...props}
    />
  )
);
FarmSelect.displayName = "FarmSelect";

interface FarmTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const FarmTextarea = React.forwardRef<
  HTMLTextAreaElement,
  FarmTextareaProps
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn("farm-form-textarea", className)}
    {...props}
  />
));
FarmTextarea.displayName = "FarmTextarea";

// === GRID COMPONENTS ===

interface FarmGridProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "responsive" | "metrics" | "auto";
}

export const FarmGrid = React.forwardRef<HTMLDivElement, FarmGridProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "farm-grid",
        {
          "farm-grid-responsive": variant === "responsive",
          "farm-grid-metrics": variant === "metrics",
          "farm-grid-auto": variant === "auto",
        },
        className
      )}
      {...props}
    />
  )
);
FarmGrid.displayName = "FarmGrid";

// === LOADING COMPONENTS ===

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading...",
}) => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-gray-800">
    <div className="content-container py-6">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="farm-text-muted">{message}</p>
        </div>
      </div>
    </div>
  </div>
);

// === ERROR COMPONENTS ===

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message,
  onRetry,
}) => (
  <FarmCard className="border-destructive/20 bg-destructive/5">
    <FarmCardContent>
      <div className="text-center py-6">
        <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-destructive text-xl">⚠️</span>
        </div>
        <h3 className="farm-heading-card text-destructive mb-2">{title}</h3>
        <p className="farm-text-muted mb-4">{message}</p>
        {onRetry && (
          <FarmButton variant="outline" onClick={onRetry}>
            Try Again
          </FarmButton>
        )}
      </div>
    </FarmCardContent>
  </FarmCard>
);

// === EMPTY STATE COMPONENTS ===

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => (
  <FarmCard>
    <FarmCardContent>
      <div className="text-center py-8 sm:py-12">
        {icon && (
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            {icon}
          </div>
        )}
        <h3 className="farm-heading-card mb-2">{title}</h3>
        <p className="farm-text-muted mb-6">{description}</p>
        {action}
      </div>
    </FarmCardContent>
  </FarmCard>
);
