/**
 * Comprehensive API error handling utilities
 */

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  path?: string;
  timestamp?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  details?: Record<string, unknown>;
}

export class ApiErrorHandler {
  /**
   * Parse and normalize API error responses
   */
  static parseError(error: unknown, context?: string): ApiError {
    let apiError: ApiError = {
      status: 500,
      message: "An unexpected error occurred",
      timestamp: new Date().toISOString(),
      path: context,
    };

    if (error instanceof Response) {
      apiError.status = error.status;
      apiError.message = this.getStatusMessage(error.status);
    } else if (error instanceof Error) {
      apiError.message = error.message;

      // Check for fetch/network errors
      if (error.message.includes("fetch") || error.name === "TypeError") {
        apiError.status = 0;
        apiError.code = "NETWORK_ERROR";
        apiError.message =
          "Network connection failed. Please check your internet connection.";
      }

      // Check for timeout errors
      if (error.message.includes("timeout") || error.name === "TimeoutError") {
        apiError.status = 408;
        apiError.code = "TIMEOUT_ERROR";
        apiError.message = "Request timed out. Please try again.";
      }
    } else if (typeof error === "object" && error !== null) {
      const errorObj = error as Partial<ApiError>;
      apiError = {
        status: errorObj.status || 500,
        message:
          errorObj.message || (errorObj as any).error || "An error occurred",
        code: errorObj.code,
        details: errorObj.details,
        timestamp: new Date().toISOString(),
        path: context,
      };
    }

    return apiError;
  }

  /**
   * Get user-friendly error messages based on status codes
   */
  static getStatusMessage(status: number): string {
    switch (status) {
      case 0:
        return "Unable to connect to the server. Please check your internet connection.";
      case 400:
        return "Invalid request. Please check your input and try again.";
      case 401:
        return "You are not authorized to perform this action. Please sign in.";
      case 403:
        return "Access denied. You don't have permission to access this resource.";
      case 404:
        return "The requested resource was not found.";
      case 409:
        return "This action conflicts with existing data. Please refresh and try again.";
      case 422:
        return "The provided data is invalid. Please check your input.";
      case 429:
        return "Too many requests. Please wait a moment and try again.";
      case 500:
        return "Internal server error. Please try again later.";
      case 502:
        return "Server is temporarily unavailable. Please try again later.";
      case 503:
        return "Service is temporarily unavailable. Please try again later.";
      case 504:
        return "Request timed out. Please try again.";
      default:
        return `An error occurred (${status}). Please try again.`;
    }
  }

  /**
   * Get error category for different handling strategies
   */
  static getErrorCategory(
    status: number
  ): "network" | "client" | "server" | "auth" | "unknown" {
    if (status === 0) return "network";
    if (status >= 400 && status < 500) {
      if (status === 401 || status === 403) return "auth";
      return "client";
    }
    if (status >= 500) return "server";
    return "unknown";
  }

  /**
   * Determine if an error is retryable
   */
  static isRetryable(error: ApiError): boolean {
    const retryableStatuses = [0, 408, 429, 500, 502, 503, 504];
    return retryableStatuses.includes(error.status);
  }

  /**
   * Get retry delay based on error type and attempt count
   */
  static getRetryDelay(error: ApiError, attempt: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds

    let delay = baseDelay;

    // Exponential backoff for server errors
    if (error.status >= 500) {
      delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    }

    // Longer delay for rate limiting
    if (error.status === 429) {
      delay = Math.min(baseDelay * Math.pow(3, attempt), maxDelay);
    }

    // Shorter delay for network errors
    if (error.status === 0) {
      delay = Math.min(baseDelay * (attempt + 1), 10000);
    }

    return delay;
  }

  /**
   * Log error for monitoring and debugging
   */
  static logError(error: ApiError, context?: Record<string, unknown>): void {
    const logData = {
      ...error,
      context,
      userAgent:
        typeof window !== "undefined" ? window.navigator.userAgent : undefined,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    };

    if (process.env.NODE_ENV === "development") {
      console.error("API Error:", logData);
    } else {
      // In production, send to monitoring service
      // TODO: Integrate with error monitoring service (e.g., Sentry, LogRocket)
      console.error("Production API Error:", {
        status: error.status,
        message: error.message,
        code: error.code,
        path: error.path,
        timestamp: error.timestamp,
      });
    }
  }
}

/**
 * Enhanced fetch wrapper with comprehensive error handling
 */
export async function apiRequest<T = unknown>(
  url: string,
  options: RequestInit = {},
  context?: string
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const apiError = ApiErrorHandler.parseError(
        {
          status: response.status,
          message:
            errorData.error ||
            errorData.message ||
            ApiErrorHandler.getStatusMessage(response.status),
          code: errorData.code,
          details: errorData.details,
        },
        context
      );

      ApiErrorHandler.logError(apiError, { url, method: options.method });
      throw apiError;
    }

    const data = await response.json();

    // Handle API responses with success/error structure
    if (data.success === false) {
      const apiError = ApiErrorHandler.parseError(
        {
          status: response.status,
          message: data.error || data.message || "Request failed",
          code: data.code,
          details: data.details,
        },
        context
      );

      ApiErrorHandler.logError(apiError, { url, method: options.method });
      throw apiError;
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof DOMException && error.name === "AbortError") {
      const timeoutError = ApiErrorHandler.parseError(
        new Error("Request timed out"),
        context
      );
      timeoutError.status = 408;
      timeoutError.code = "TIMEOUT_ERROR";
      ApiErrorHandler.logError(timeoutError, { url, method: options.method });
      throw timeoutError;
    }

    // If it's already an ApiError, re-throw it
    if (error && typeof error === "object" && "status" in error) {
      throw error;
    }

    // Parse and throw as ApiError
    const apiError = ApiErrorHandler.parseError(error, context);
    ApiErrorHandler.logError(apiError, { url, method: options.method });
    throw apiError;
  }
}

/**
 * Retry wrapper for API requests
 */
export async function apiRequestWithRetry<T = unknown>(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3,
  context?: string
): Promise<T> {
  let lastError: ApiError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiRequest<T>(url, options, context);
    } catch (error) {
      lastError = error as ApiError;

      // Don't retry if it's not a retryable error
      if (!ApiErrorHandler.isRetryable(lastError)) {
        throw lastError;
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Wait before retrying
      const delay = ApiErrorHandler.getRetryDelay(lastError, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Hook for handling API errors in React components
 */
export function useApiErrorHandler() {
  const handleError = (error: unknown, context?: string) => {
    const apiError = ApiErrorHandler.parseError(error, context);

    // Handle specific error types
    switch (apiError.status) {
      case 401:
        // Redirect to login
        if (typeof window !== "undefined") {
          window.location.href = "/sign-in";
        }
        break;
      case 403:
        // Show access denied message
        break;
      case 404:
        // Handle not found
        break;
      default:
        // Generic error handling
        break;
    }

    return apiError;
  };

  return { handleError };
}

export default ApiErrorHandler;
