"use client";

import { useState, useCallback } from "react";
import { ApiError, ApiErrorHandler } from "@/lib/api-error-handler";

interface UseApiErrorOptions {
  onError?: (error: ApiError) => void;
  showToast?: boolean;
  redirectOn401?: boolean;
}

interface UseApiErrorReturn {
  error: ApiError | null;
  isError: boolean;
  handleError: (error: unknown, context?: string) => ApiError;
  clearError: () => void;
  retryableError: boolean;
  errorCategory: "network" | "client" | "server" | "auth" | "unknown";
}

export function useApiError(
  options: UseApiErrorOptions = {}
): UseApiErrorReturn {
  const [error, setError] = useState<ApiError | null>(null);
  const { onError, redirectOn401 = true } = options;

  const handleError = useCallback(
    (error: unknown, context?: string): ApiError => {
      const apiError = ApiErrorHandler.parseError(error, context);

      setError(apiError);

      // Log the error
      ApiErrorHandler.logError(apiError, { context });

      // Handle specific error cases
      if (apiError.status === 401 && redirectOn401) {
        // Redirect to login after a short delay
        setTimeout(() => {
          if (typeof window !== "undefined") {
            window.location.href = "/sign-in";
          }
        }, 1000);
      }

      // Call custom error handler
      if (onError) {
        onError(apiError);
      }

      return apiError;
    },
    [onError, redirectOn401]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const retryableError = error ? ApiErrorHandler.isRetryable(error) : false;
  const errorCategory = error
    ? ApiErrorHandler.getErrorCategory(error.status)
    : "unknown";

  return {
    error,
    isError: error !== null,
    handleError,
    clearError,
    retryableError,
    errorCategory,
  };
}

/**
 * Hook for handling async operations with error handling
 */
interface UseAsyncOperationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
  retries?: number;
}

interface UseAsyncOperationReturn<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  execute: (...args: any[]) => Promise<T | null>;
  retry: () => Promise<T | null>;
  reset: () => void;
}

export function useAsyncOperation<T = any>(
  asyncFunction: (...args: any[]) => Promise<T>,
  options: UseAsyncOperationOptions<T> = {}
): UseAsyncOperationReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastArgs, setLastArgs] = useState<any[]>([]);
  const { error, handleError, clearError } = useApiError({
    onError: options.onError,
  });

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      try {
        setLoading(true);
        setLastArgs(args);
        clearError();

        const result = await asyncFunction(...args);
        setData(result);

        if (options.onSuccess) {
          options.onSuccess(result);
        }

        return result;
      } catch (err) {
        handleError(err, `AsyncOperation: ${asyncFunction.name}`);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [asyncFunction, handleError, clearError, options]
  );

  const retry = useCallback(async (): Promise<T | null> => {
    return execute(...lastArgs);
  }, [execute, lastArgs]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    clearError();
    setLastArgs([]);
  }, [clearError]);

  return {
    data,
    loading,
    error,
    execute,
    retry,
    reset,
  };
}

/**
 * Hook for handling form submissions with error handling
 */
interface UseFormSubmissionOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
  resetOnSuccess?: boolean;
}

interface UseFormSubmissionReturn<T> {
  submitting: boolean;
  error: ApiError | null;
  submit: (data: any) => Promise<T | null>;
  reset: () => void;
}

export function useFormSubmission<T = any>(
  submitFunction: (data: any) => Promise<T>,
  options: UseFormSubmissionOptions<T> = {}
): UseFormSubmissionReturn<T> {
  const [submitting, setSubmitting] = useState(false);
  const { error, handleError, clearError } = useApiError({
    onError: options.onError,
  });

  const submit = useCallback(
    async (data: any): Promise<T | null> => {
      try {
        setSubmitting(true);
        clearError();

        const result = await submitFunction(data);

        if (options.onSuccess) {
          options.onSuccess(result);
        }

        if (options.resetOnSuccess) {
          clearError();
        }

        return result;
      } catch (err) {
        handleError(err, "FormSubmission");
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [submitFunction, handleError, clearError, options]
  );

  const reset = useCallback(() => {
    setSubmitting(false);
    clearError();
  }, [clearError]);

  return {
    submitting,
    error,
    submit,
    reset,
  };
}

export default useApiError;
