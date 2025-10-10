"use client";

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
  AlertCircle,
} from "lucide-react";

interface ErrorDisplayProps {
  error: ApiError | Error | string;
  onRetry?: () => void;
  showRetry?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ErrorDisplay({
  error,
  onRetry,
  showRetry = true,
  className = "",
  size = "md",
}: ErrorDisplayProps) {
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
        return <WifiOff className="w-8 h-8 text-destructive" />;
      case 401:
      case 403:
        return <Shield className="w-8 h-8 text-destructive" />;
      case 404:
        return <FileX className="w-8 h-8 text-destructive" />;
      case 408:
      case 504:
        return <Clock className="w-8 h-8 text-destructive" />;
      case 500:
      case 502:
      case 503:
        return <Server className="w-8 h-8 text-destructive" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-destructive" />;
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
        return "Not Found";
      case 408:
      case 504:
        return "Request Timeout";
      case 409:
        return "Conflict";
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
    return (
      apiError.message || ApiErrorHandler.getStatusMessage(apiError.status)
    );
  };

  const canRetry = () => {
    return ApiErrorHandler.isRetryable(apiError) && showRetry && onRetry;
  };

  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <FarmCard className="max-w-md w-full border-destructive/20">
        <FarmCardContent>
          <div className={`text-center space-y-4 ${sizeClasses[size]}`}>
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              {getErrorIcon()}
            </div>

            <div>
              <h3 className="farm-heading-card text-destructive mb-2">
                {getErrorTitle()}
              </h3>
              <p className="farm-text-muted">{getMessage()}</p>

              {apiError.code && (
                <p className="farm-text-caption mt-2">
                  Error Code: {apiError.code}
                </p>
              )}

              {apiError.status && (
                <p className="farm-text-caption">Status: {apiError.status}</p>
              )}
            </div>

            {process.env.NODE_ENV === "development" && apiError.details && (
              <details className="text-left bg-muted/50 p-3 rounded text-xs">
                <summary className="cursor-pointer font-medium mb-2">
                  Error Details (Development)
                </summary>
                <pre className="whitespace-pre-wrap break-words">
                  {JSON.stringify(apiError.details, null, 2)}
                </pre>
              </details>
            )}

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
          </div>
        </FarmCardContent>
      </FarmCard>
    </div>
  );
}

// Inline error display for smaller spaces
export function InlineErrorDisplay({
  error,
  onRetry,
  showRetry = true,
  className = "",
}: Omit<ErrorDisplayProps, "size">) {
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

  return (
    <div
      className={`bg-destructive/10 border border-destructive/20 rounded-lg p-3 ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-destructive">
            {apiError.message ||
              ApiErrorHandler.getStatusMessage(apiError.status)}
          </p>
          {apiError.code && (
            <p className="text-xs text-muted-foreground mt-1">
              Code: {apiError.code}
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

export default ErrorDisplay;
