"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ApiError, ApiErrorHandler } from "@/lib/api-error-handler";
import { useApiError } from "@/hooks/use-api-error";

interface UseDetailPageErrorOptions {
  entityType: "crop" | "field" | "equipment";
  entityId: string;
  onError?: (error: ApiError) => void;
  redirectOnNotFound?: boolean;
  redirectOnUnauthorized?: boolean;
}

interface UseDetailPageErrorReturn {
  error: ApiError | null;
  isError: boolean;
  isLoading: boolean;
  handleError: (error: unknown, context?: string) => ApiError;
  handleAsyncError: (
    asyncFn: () => Promise<any>,
    context?: string
  ) => Promise<any>;
  clearError: () => void;
  retry: () => void;
  canRetry: boolean;
  errorCategory: "network" | "client" | "server" | "auth" | "unknown";
}

export function useDetailPageError(
  options: UseDetailPageErrorOptions
): UseDetailPageErrorReturn {
  const {
    entityType,
    entityId,
    onError,
    redirectOnNotFound = true,
    redirectOnUnauthorized = true,
  } = options;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [retryFunction, setRetryFunction] = useState<(() => void) | null>(null);

  const {
    error,
    isError,
    handleError: baseHandleError,
    clearError,
    errorCategory,
  } = useApiError({
    onError: (apiError) => {
      // Handle specific error cases for detail pages
      switch (apiError.status) {
        case 404:
          if (redirectOnNotFound) {
            setTimeout(() => {
              const listPath = `/${entityType}s`;
              router.push(listPath);
            }, 2000);
          }
          break;
        case 401:
          if (redirectOnUnauthorized) {
            setTimeout(() => {
              router.push("/sign-in");
            }, 1000);
          }
          break;
        case 403:
          // Access denied - redirect to dashboard
          setTimeout(() => {
            router.push("/dashboard");
          }, 2000);
          break;
      }

      // Call custom error handler
      if (onError) {
        onError(apiError);
      }
    },
  });

  const handleError = useCallback(
    (error: unknown, context?: string): ApiError => {
      const fullContext = `${entityType}/${entityId}${context ? ` - ${context}` : ""}`;
      return baseHandleError(error, fullContext);
    },
    [baseHandleError, entityType, entityId]
  );

  const handleAsyncError = useCallback(
    async (asyncFn: () => Promise<any>, context?: string): Promise<any> => {
      try {
        setIsLoading(true);
        clearError();
        const result = await asyncFn();
        return result;
      } catch (err) {
        handleError(err, context);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError, clearError]
  );

  const retry = useCallback(() => {
    if (retryFunction) {
      clearError();
      retryFunction();
    }
  }, [retryFunction, clearError]);

  const canRetry = error
    ? ApiErrorHandler.isRetryable(error) && retryFunction !== null
    : false;

  return {
    error,
    isError,
    isLoading,
    handleError,
    handleAsyncError,
    clearError,
    retry,
    canRetry,
    errorCategory,
  };
}

/**
 * Hook for handling CRUD operations on detail pages with comprehensive error handling
 */
interface UseDetailPageCrudOptions extends UseDetailPageErrorOptions {
  onSuccess?: (data: any, operation: "create" | "update" | "delete") => void;
  onDelete?: () => void;
}

interface UseDetailPageCrudReturn extends UseDetailPageErrorReturn {
  updateEntity: (data: any) => Promise<any>;
  deleteEntity: () => Promise<void>;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function useDetailPageCrud(
  options: UseDetailPageCrudOptions
): UseDetailPageCrudReturn {
  const { entityType, entityId, onSuccess, onDelete } = options;
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const errorHandler = useDetailPageError(options);

  const updateEntity = useCallback(
    async (data: any): Promise<any> => {
      return errorHandler.handleAsyncError(async () => {
        setIsUpdating(true);

        const apiPath =
          entityType === "equipment"
            ? `/api/land-preparation/equipment/${entityId}`
            : `/api/${entityType}s/${entityId}`;

        const response = await fetch(apiPath, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw {
            status: response.status,
            message: errorData.error || errorData.message || "Update failed",
            code: errorData.code,
            details: errorData.details,
          };
        }

        const result = await response.json();
        const entityData = result.data || result;

        if (onSuccess) {
          onSuccess(entityData, "update");
        }

        return entityData;
      }, "update");
    },
    [entityType, entityId, errorHandler, onSuccess]
  );

  const deleteEntity = useCallback(async (): Promise<void> => {
    return errorHandler.handleAsyncError(async () => {
      setIsDeleting(true);

      const apiPath =
        entityType === "equipment"
          ? `/api/land-preparation/equipment/${entityId}`
          : `/api/${entityType}s/${entityId}`;

      const response = await fetch(apiPath, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          message: errorData.error || errorData.message || "Delete failed",
          code: errorData.code,
          details: errorData.details,
        };
      }

      // Redirect to list page after successful deletion
      if (onDelete) {
        onDelete();
      } else {
        const listPath = `/${entityType}s`;
        router.push(listPath);
      }
    }, "delete");
  }, [entityType, entityId, errorHandler, onDelete, router]);

  // Clean up loading states when component unmounts or error occurs
  useEffect(() => {
    if (errorHandler.isError) {
      setIsUpdating(false);
      setIsDeleting(false);
    }
  }, [errorHandler.isError]);

  return {
    ...errorHandler,
    updateEntity,
    deleteEntity,
    isUpdating,
    isDeleting,
  };
}

export default useDetailPageError;
