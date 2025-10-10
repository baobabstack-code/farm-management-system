"use client";

import React, { ReactNode, useState, useEffect } from "react";
import { ErrorBoundary } from "./error-boundary";
import {
  FarmCard,
  FarmCardContent,
  FarmButton,
  LoadingState,
} from "@/components/ui/farm-theme";
import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error) => void;
  retryDelay?: number;
  maxRetries?: number;
}

interface AsyncError extends Error {
  status?: number;
  code?: string;
  isNetworkError?: boolean;
  isTimeoutError?: boolean;
}

export function AsyncErrorBoundary({
  children,
  fallback,
  onError,
  retryDelay = 1000,
  maxRetries = 3,
}: AsyncErrorBoundaryProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    if (retryCount >= maxRetries) {
      return;
    }

    setIsRetrying(true);
    setRetryCount((prev) => prev + 1);

    // Wait for retry delay
    await new Promise((resolve) => setTimeout(resolve, retryDelay));

    setIsRetrying(false);

    // Force re-render by updating key
    window.location.reload();
  };

  const renderAsyncError = (error: AsyncError, retry: () => void) => {
    if (fallback) {
      return fallback(error, retry);
    }

    const isNetworkError = error.isNetworkError || !isOnline;
    const isTimeoutError = error.isTimeoutError;
    const isServerError = error.status && error.status >= 500;
    const isClientError =
      error.status && error.status >= 400 && error.status < 500;

    let title = "Something went wrong";
    let message = error.message;
    let icon = <AlertTriangle className="w-8 h-8 text-destructive" />;
    let canRetry = retryCount < maxRetries;

    if (isNetworkError) {
      title = "Connection Problem";
      message =
        "Unable to connect to the server. Please check your internet connection.";
      icon = <WifiOff className="w-8 h-8 text-destructive" />;
      canRetry = true;
    } else if (isTimeoutError) {
      title = "Request Timeout";
      message = "The request took too long to complete. Please try again.";
      canRetry = true;
    } else if (isServerError) {
      title = "Server Error";
      message =
        "The server encountered an error. Please try again in a moment.";
      canRetry = true;
    } else if (isClientError) {
      title = "Request Error";
      message = error.message || "There was a problem with your request.";
      canRetry = error.status !== 404; // Don't retry 404s
    }

    return (
      <div className="min-h-[300px] flex items-center justify-center p-4">
        <FarmCard className="max-w-md w-full border-destructive/20">
          <FarmCardContent>
            <div className="text-center space-y-4 p-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                {icon}
              </div>

              <div>
                <h3 className="farm-heading-card text-destructive mb-2">
                  {title}
                </h3>
                <p className="farm-text-muted">{message}</p>

                {error.status && (
                  <p className="farm-text-caption mt-2">
                    Error Code: {error.status}
                  </p>
                )}
              </div>

              {!isOnline && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-warning">
                    <WifiOff className="w-4 h-4" />
                    <span className="text-sm font-medium">You're offline</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Check your internet connection and try again.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {canRetry && (
                  <FarmButton
                    variant="primary"
                    onClick={retry}
                    disabled={isRetrying}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`}
                    />
                    {isRetrying ? "Retrying..." : "Try Again"}
                  </FarmButton>
                )}

                {retryCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Retry attempt {retryCount} of {maxRetries}
                  </p>
                )}
              </div>
            </div>
          </FarmCardContent>
        </FarmCard>
      </div>
    );
  };

  if (isRetrying) {
    return <LoadingState message="Retrying..." />;
  }

  return (
    <ErrorBoundary
      fallback={<div>{renderAsyncError({} as AsyncError, handleRetry)}</div>}
      onError={onError}
      showRetry={false} // We handle retry ourselves
    >
      {children}
    </ErrorBoundary>
  );
}

// Hook for handling async errors
export function useAsyncError() {
  const [error, setError] = useState<AsyncError | null>(null);

  const handleAsyncError = (error: unknown) => {
    let asyncError: AsyncError;

    if (error instanceof Error) {
      asyncError = error as AsyncError;
    } else if (typeof error === "string") {
      asyncError = new Error(error) as AsyncError;
    } else {
      asyncError = new Error("An unknown error occurred") as AsyncError;
    }

    // Detect network errors
    if (
      asyncError.message.includes("fetch") ||
      asyncError.message.includes("network")
    ) {
      asyncError.isNetworkError = true;
    }

    // Detect timeout errors
    if (
      asyncError.message.includes("timeout") ||
      asyncError.name === "TimeoutError"
    ) {
      asyncError.isTimeoutError = true;
    }

    setError(asyncError);
  };

  const clearError = () => setError(null);

  // Throw error to be caught by error boundary
  if (error) {
    throw error;
  }

  return { handleAsyncError, clearError };
}

export default AsyncErrorBoundary;
