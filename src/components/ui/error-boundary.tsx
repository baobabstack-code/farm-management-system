"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import {
  FarmCard,
  FarmCardHeader,
  FarmCardContent,
  FarmButton,
} from "@/components/ui/farm-theme";
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showRetry?: boolean;
  showHome?: boolean;
  showBack?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to monitoring service in production
    if (process.env.NODE_ENV === "production") {
      // TODO: Integrate with error monitoring service (e.g., Sentry)
      console.error("Production error:", {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = "/dashboard";
  };

  handleGoBack = () => {
    window.history.back();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <FarmCard className="max-w-md w-full border-destructive/20">
            <FarmCardHeader title="Something went wrong" />
            <FarmCardContent>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>

                <div>
                  <h3 className="farm-heading-card text-destructive mb-2">
                    Unexpected Error
                  </h3>
                  <p className="farm-text-muted">
                    {this.state.error?.message ||
                      "An unexpected error occurred while rendering this component."}
                  </p>
                </div>

                {process.env.NODE_ENV === "development" && this.state.error && (
                  <details className="text-left bg-muted/50 p-3 rounded text-xs">
                    <summary className="cursor-pointer font-medium mb-2">
                      Error Details (Development)
                    </summary>
                    <pre className="whitespace-pre-wrap break-words">
                      {this.state.error.stack}
                    </pre>
                    {this.state.errorInfo && (
                      <pre className="whitespace-pre-wrap break-words mt-2 pt-2 border-t">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </details>
                )}

                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  {this.props.showRetry !== false && (
                    <FarmButton
                      variant="primary"
                      onClick={this.handleRetry}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Try Again
                    </FarmButton>
                  )}

                  {this.props.showBack && (
                    <FarmButton
                      variant="outline"
                      onClick={this.handleGoBack}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Go Back
                    </FarmButton>
                  )}

                  {this.props.showHome && (
                    <FarmButton
                      variant="outline"
                      onClick={this.handleGoHome}
                      className="flex items-center gap-2"
                    >
                      <Home className="w-4 h-4" />
                      Dashboard
                    </FarmButton>
                  )}
                </div>
              </div>
            </FarmCardContent>
          </FarmCard>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Specialized error boundary for detail pages
export function DetailPageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      showRetry={true}
      showBack={true}
      showHome={true}
      onError={(error, errorInfo) => {
        // Log detail page specific errors
        console.error("Detail page error:", {
          error: error.message,
          page: window.location.pathname,
          timestamp: new Date().toISOString(),
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// Hook for programmatic error handling
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    console.error("Handled error:", error);
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  // Throw error to be caught by error boundary
  if (error) {
    throw error;
  }

  return { handleError, clearError };
}

export default ErrorBoundary;
