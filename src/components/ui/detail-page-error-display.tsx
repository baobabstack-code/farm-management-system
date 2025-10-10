"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  FarmCard,
  FarmCardContent,
  FarmButton,
} from "@/components/ui/farm-theme";
import { ApiError, ApiErrorHandler } from "@/lib/api-error-handler";
import {
  AlertTriangle,
  RefreshCw,
  WifiOff,
  Clock,
  Shield,
  FileX,
  Server,
  Home,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";

interface DetailPageErrorDisplayProps {
  error: ApiError | Error | string;
  entityType: "crop" | "field" | "equipment";
  entityId?: string;
  onRetry?: () => void;
  showRetry?: boolean;
  showNavigation?: boolean;
  className?: string;
}

export function DetailPageErrorDisplay({
  error,
  entityType,
  entityId,
  onRetry,
  showRetry = true,
  showNavigation = true,
  className = "",
}: DetailPageErrorDisplayProps) {
  const router = useRouter();

  // Normalize error to ApiError format
  const apiError: ApiError = (() => {
    if (typeof error === "string") {
      return {
        status: 500,
        message: error,
      };
    }
    if (error instanceof Error) {
      return ApiErrorHandler.parseError(error);
    }
    return error;
  })();

  const getErrorIcon = () => {
    switch (apiError.status) {
      case 0:
        return <WifiOff className="w-12 h-12 text-destructive" />;
      case 401:
      case 403:
        return <Shield className="w-12 h-12 text-destructive" />;
      case 404:
        return <FileX className="w-12 h-12 text-destructive" />;
      case 408:
      case 504:
        return <Clock className="w-12 h-12 text-destructive" />;
      case 500:
      case 502:
      case 503:
        return <Server className="w-12 h-12 text-destructive" />;
      default:
        return <AlertTriangle className="w-12 h-12 text-destructive" />;
    }
  };

  const getErrorTitle = () => {
    switch (apiError.status) {
      case 0:
        return "Connection Problem";
      case 401:
        return "Authentication Required";
      case 403:
        return "Access Denied";
      case 404:
        return `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Not Found`;
      case 408:
      case 504:
        return "Request Timeout";
      case 409:
        return "Operation Conflict";
      case 422:
        return "Invalid Data";
      case 429:
        return "Too Many Requests";
      case 500:
        return "Server Error";
      case 502:
        return "Bad Gateway";
      case 503:
        return "Service Unavailable";
      default:
        return "Error";
    }
  };

  const getMessage = () => {
    switch (apiError.status) {
      case 404:
        return `The ${entityType} you're looking for doesn't exist or has been removed.`;
      case 403:
        return `You don't have permission to access this ${entityType}.`;
      case 409:
        return (
          apiError.message ||
          `This ${entityType} cannot be modified due to existing dependencies.`
        );
      default:
        return (
          apiError.message || ApiErrorHandler.getStatusMessage(apiError.status)
        );
    }
  };

  const getActionSuggestion = () => {
    switch (apiError.status) {
      case 404:
        return `Try going back to the ${entityType}s list to find what you're looking for.`;
      case 403:
        return "Contact your administrator if you believe you should have access.";
      case 409:
        return "Check for related data that might be preventing this operation.";
      case 0:
        return "Check your internet connection and try again.";
      case 500:
      case 502:
      case 503:
        return "This is a temporary issue. Please try again in a few moments.";
      default:
        return "If the problem persists, please contact support.";
    }
  };

  const canRetry = () => {
    return ApiErrorHandler.isRetryable(apiError) && showRetry && onRetry;
  };

  const handleGoToList = () => {
    const listPath = `/${entityType}s`;
    router.push(listPath);
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    router.push("/dashboard");
  };

  return (
    <div
      className={`min-h-[500px] flex items-center justify-center p-6 ${className}`}
    >
      <FarmCard className="max-w-lg w-full border-destructive/20">
        <FarmCardContent>
          <div className="text-center space-y-6 p-6">
            {/* Error Icon */}
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              {getErrorIcon()}
            </div>

            {/* Error Content */}
            <div className="space-y-3">
              <h2 className="farm-heading-card text-destructive">
                {getErrorTitle()}
              </h2>
              <p className="farm-text-muted text-base">{getMessage()}</p>
              <p className="farm-text-caption">{getActionSuggestion()}</p>

              {/* Error Details */}
              {(apiError.code || apiError.status) && (
                <div className="bg-muted/50 rounded-lg p-3 text-left">
                  <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <AlertCircle className="w-4 h-4" />
                    Error Details
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {apiError.status && (
                      <div>Status Code: {apiError.status}</div>
                    )}
                    {apiError.code && <div>Error Code: {apiError.code}</div>}
                    {entityId && <div>Entity ID: {entityId}</div>}
                    <div>Timestamp: {new Date().toLocaleString()}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {canRetry() && (
                <FarmButton
                  variant="primary"
                  onClick={onRetry}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </FarmButton>
              )}

              {showNavigation && (
                <>
                  <FarmButton
                    variant="outline"
                    onClick={handleGoToList}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to{" "}
                    {entityType.charAt(0).toUpperCase() + entityType.slice(1)}s
                  </FarmButton>

                  <FarmButton
                    variant="outline"
                    onClick={handleGoBack}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Go Back
                  </FarmButton>

                  <FarmButton
                    variant="outline"
                    onClick={handleGoHome}
                    className="flex items-center gap-2"
                  >
                    <Home className="w-4 h-4" />
                    Dashboard
                  </FarmButton>
                </>
              )}
            </div>

            {/* Development Details */}
            {process.env.NODE_ENV === "development" && apiError.details && (
              <details className="text-left bg-muted/50 p-3 rounded text-xs">
                <summary className="cursor-pointer font-medium mb-2">
                  Debug Information (Development)
                </summary>
                <pre className="whitespace-pre-wrap break-words">
                  {JSON.stringify(apiError.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </FarmCardContent>
      </FarmCard>
    </div>
  );
}

// Inline error display for smaller spaces within detail pages
export function InlineDetailPageError({
  error,
  entityType,
  onRetry,
  showRetry = true,
  className = "",
}: Omit<DetailPageErrorDisplayProps, "showNavigation" | "entityId">) {
  const apiError: ApiError = (() => {
    if (typeof error === "string") {
      return {
        status: 500,
        message: error,
      };
    }
    if (error instanceof Error) {
      return ApiErrorHandler.parseError(error);
    }
    return error;
  })();

  const canRetry =
    ApiErrorHandler.isRetryable(apiError) && showRetry && onRetry;

  const getContextualMessage = () => {
    switch (apiError.status) {
      case 404:
        return `This ${entityType} could not be found.`;
      case 403:
        return `You don't have permission to access this ${entityType}.`;
      case 409:
        return `This ${entityType} cannot be modified due to existing dependencies.`;
      default:
        return apiError.message || "An error occurred while loading this data.";
    }
  };

  return (
    <div
      className={`bg-destructive/10 border border-destructive/20 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-destructive mb-1">
            {getContextualMessage()}
          </p>
          {apiError.code && (
            <p className="text-xs text-muted-foreground">
              Error Code: {apiError.code}
            </p>
          )}
        </div>
        {canRetry && (
          <FarmButton
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="flex items-center gap-1 text-xs"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </FarmButton>
        )}
      </div>
    </div>
  );
}

export default DetailPageErrorDisplay;
