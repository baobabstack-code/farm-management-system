"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { PageContainer, FarmButton } from "@/components/ui/farm-theme";
import { ArrowLeft, ChevronRight, Home } from "lucide-react";
import { useRouter } from "next/navigation";

// === TYPES ===

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface TabConfig {
  id: string;
  label: string;
  count?: number;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface AlertConfig {
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface DetailPageLayoutProps
  extends React.HTMLAttributes<HTMLDivElement> {
  // Header props
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;

  // Navigation props
  breadcrumbs?: BreadcrumbItem[];
  backButton?: {
    label?: string;
    href?: string;
    onClick?: () => void;
  };

  // Actions
  actions?: React.ReactNode;

  // Alerts
  alerts?: AlertConfig[];

  // Tabs
  tabs?: TabConfig[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;

  // Content
  children: React.ReactNode;
}

// === BREADCRUMB COMPONENT ===

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  const router = useRouter();

  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center space-x-2 text-sm">
        <li>
          <button
            onClick={() => router.push("/")}
            className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Go to dashboard"
          >
            <Home className="w-4 h-4" />
          </button>
        </li>
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <li>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </li>
            <li>
              {item.href && index < items.length - 1 ? (
                <button
                  onClick={() => router.push(item.href!)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </button>
              ) : (
                <span className="text-foreground font-medium">
                  {item.label}
                </span>
              )}
            </li>
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
};

// === ALERT BANNER COMPONENT ===

interface AlertBannerProps {
  alerts: AlertConfig[];
}

const AlertBanner: React.FC<AlertBannerProps> = ({ alerts }) => {
  if (!alerts.length) return null;

  return (
    <div className="space-y-4 mb-6">
      {alerts.map((alert, index) => {
        const Icon = alert.icon;

        return (
          <div
            key={index}
            className={cn("rounded-lg border p-4", {
              "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950":
                alert.type === "info",
              "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950":
                alert.type === "warning",
              "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950":
                alert.type === "error",
              "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950":
                alert.type === "success",
            })}
          >
            <div className="flex items-start gap-3">
              {Icon && (
                <Icon
                  className={cn("w-5 h-5 mt-0.5", {
                    "text-blue-600 dark:text-blue-400": alert.type === "info",
                    "text-yellow-600 dark:text-yellow-400":
                      alert.type === "warning",
                    "text-red-600 dark:text-red-400": alert.type === "error",
                    "text-green-600 dark:text-green-400":
                      alert.type === "success",
                  })}
                />
              )}
              <div className="flex-1">
                <h4
                  className={cn("font-medium", {
                    "text-blue-800 dark:text-blue-200": alert.type === "info",
                    "text-yellow-800 dark:text-yellow-200":
                      alert.type === "warning",
                    "text-red-800 dark:text-red-200": alert.type === "error",
                    "text-green-800 dark:text-green-200":
                      alert.type === "success",
                  })}
                >
                  {alert.title}
                </h4>
                <p
                  className={cn("mt-1 text-sm", {
                    "text-blue-700 dark:text-blue-300": alert.type === "info",
                    "text-yellow-700 dark:text-yellow-300":
                      alert.type === "warning",
                    "text-red-700 dark:text-red-300": alert.type === "error",
                    "text-green-700 dark:text-green-300":
                      alert.type === "success",
                  })}
                >
                  {alert.message}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// === TAB NAVIGATION COMPONENT ===

interface TabNavigationProps {
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  if (!tabs.length) return null;

  const handleKeyDown = (
    e: React.KeyboardEvent,
    tabId: string,
    index: number
  ) => {
    if (e.key === "ArrowLeft" && index > 0) {
      onTabChange(tabs[index - 1].id);
    } else if (e.key === "ArrowRight" && index < tabs.length - 1) {
      onTabChange(tabs[index + 1].id);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onTabChange(tabId);
    }
  };

  return (
    <div className="mb-6">
      <div className="border-b border-border">
        <nav className="flex space-x-8" role="tablist">
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`${tab.id}-tab`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`${tab.id}-panel`}
                onClick={() => onTabChange(tab.id)}
                onKeyDown={(e) => handleKeyDown(e, tab.id, index)}
                className={cn(
                  "py-2 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex items-center gap-2",
                  {
                    "border-primary text-primary": isActive,
                    "border-transparent text-muted-foreground hover:text-foreground hover:border-border":
                      !isActive,
                  }
                )}
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span className="ml-1 text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

// === MAIN COMPONENT ===

export const DetailPageLayout = React.forwardRef<
  HTMLDivElement,
  DetailPageLayoutProps
>(
  (
    {
      className,
      title,
      subtitle,
      icon: Icon,
      breadcrumbs = [],
      backButton,
      actions,
      alerts = [],
      tabs = [],
      activeTab,
      onTabChange,
      children,
      ...props
    },
    ref
  ) => {
    const router = useRouter();

    const handleBackClick = () => {
      if (backButton?.onClick) {
        backButton.onClick();
      } else if (backButton?.href) {
        router.push(backButton.href);
      } else {
        router.back();
      }
    };

    return (
      <PageContainer ref={ref} className={cn(className)} {...props}>
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && <Breadcrumb items={breadcrumbs} />}

        {/* Page Header */}
        <div className="farm-page-header">
          <div className="farm-page-title-section">
            <div className="farm-page-title-group">
              <div className="farm-page-icon bg-gradient-to-br from-primary to-primary-hover">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="farm-page-title-text">
                <h1 className="farm-heading-display">{title}</h1>
                {subtitle && <p className="farm-text-muted mt-1">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {backButton && (
                <FarmButton variant="outline" onClick={handleBackClick}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {backButton.label || "Back"}
                </FarmButton>
              )}
              {actions}
            </div>
          </div>
        </div>

        {/* Alert Banners */}
        <AlertBanner alerts={alerts} />

        {/* Tab Navigation */}
        {tabs.length > 0 && activeTab && onTabChange && (
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
          />
        )}

        {/* Content */}
        <div
          role={tabs.length > 0 ? "tabpanel" : undefined}
          id={activeTab ? `${activeTab}-panel` : undefined}
          aria-labelledby={activeTab ? `${activeTab}-tab` : undefined}
        >
          {children}
        </div>
      </PageContainer>
    );
  }
);

DetailPageLayout.displayName = "DetailPageLayout";
