/**
 * Comprehensive API client with built-in error handling, retry logic, and type safety
 */

import {
  ApiError,
  ApiErrorHandler,
  apiRequestWithRetry,
} from "@/lib/api-error-handler";

export interface ApiClientOptions {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

export interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  context?: string;
}

export class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;
  private defaultRetries: number;
  private defaultHeaders: Record<string, string>;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl || "";
    this.defaultTimeout = options.timeout || 30000;
    this.defaultRetries = options.retries || 3;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      ...options.headers,
    };
  }

  /**
   * Make a GET request
   */
  async get<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: "GET",
    });
  }

  /**
   * Make a POST request
   */
  async post<T = any>(
    url: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(
    url: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Make a PATCH request
   */
  async patch<T = any>(
    url: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: "DELETE",
    });
  }

  /**
   * Make a generic request with comprehensive error handling
   */
  private async request<T = any>(
    url: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      context,
      headers = {},
      ...requestOptions
    } = options;

    const fullUrl = url.startsWith("http") ? url : `${this.baseUrl}${url}`;
    const requestHeaders = {
      ...this.defaultHeaders,
      ...headers,
    };

    const requestInit: RequestInit = {
      ...requestOptions,
      headers: requestHeaders,
    };

    try {
      return await apiRequestWithRetry<T>(
        fullUrl,
        requestInit,
        retries,
        context || `${requestOptions.method || "GET"} ${url}`
      );
    } catch (error) {
      // Re-throw as ApiError for consistent handling
      throw error;
    }
  }
}

// Create default API client instance
export const apiClient = new ApiClient();

/**
 * Specialized API clients for different entity types
 */
export class CropApiClient extends ApiClient {
  constructor() {
    super({ baseUrl: "/api/crops" });
  }

  async getCrop(id: string): Promise<any> {
    return this.get(`/${id}`, { context: `get-crop-${id}` });
  }

  async updateCrop(id: string, data: any): Promise<any> {
    return this.put(`/${id}`, data, { context: `update-crop-${id}` });
  }

  async deleteCrop(id: string): Promise<any> {
    return this.delete(`/${id}`, { context: `delete-crop-${id}` });
  }

  async getCropDependencies(id: string): Promise<any> {
    return this.get(`/${id}/dependencies`, {
      context: `get-crop-dependencies-${id}`,
    });
  }
}

export class FieldApiClient extends ApiClient {
  constructor() {
    super({ baseUrl: "/api/fields" });
  }

  async getField(id: string): Promise<any> {
    return this.get(`/${id}`, { context: `get-field-${id}` });
  }

  async updateField(id: string, data: any): Promise<any> {
    return this.put(`/${id}`, data, { context: `update-field-${id}` });
  }

  async deleteField(id: string): Promise<any> {
    return this.delete(`/${id}`, { context: `delete-field-${id}` });
  }

  async getFieldDependencies(id: string): Promise<any> {
    return this.get(`/${id}/dependencies`, {
      context: `get-field-dependencies-${id}`,
    });
  }
}

export class EquipmentApiClient extends ApiClient {
  constructor() {
    super({ baseUrl: "/api/land-preparation/equipment" });
  }

  async getEquipment(id: string, includeDetails: boolean = true): Promise<any> {
    const params = includeDetails ? "?includeDetails=true" : "";
    return this.get(`/${id}${params}`, { context: `get-equipment-${id}` });
  }

  async updateEquipment(id: string, data: any): Promise<any> {
    return this.put(`/${id}`, data, { context: `update-equipment-${id}` });
  }

  async deleteEquipment(id: string): Promise<any> {
    return this.delete(`/${id}`, { context: `delete-equipment-${id}` });
  }

  async getEquipmentDependencies(id: string): Promise<any> {
    return this.get(`/${id}/dependencies`, {
      context: `get-equipment-dependencies-${id}`,
    });
  }
}

// Create specialized client instances
export const cropApi = new CropApiClient();
export const fieldApi = new FieldApiClient();
export const equipmentApi = new EquipmentApiClient();

/**
 * Hook for using API clients with React
 */
export function useApiClient() {
  return {
    apiClient,
    cropApi,
    fieldApi,
    equipmentApi,
  };
}

/**
 * Utility functions for common API patterns
 */
export class ApiUtils {
  /**
   * Handle API response and extract data
   */
  static extractData<T>(response: any): T {
    // Handle different response formats
    if (response && typeof response === "object") {
      // Standard API response format
      if (response.success === true && response.data) {
        return response.data;
      }
      // Direct data response
      if (response.success === undefined) {
        return response;
      }
      // Error response
      if (response.success === false) {
        throw new Error(response.error || "API request failed");
      }
    }
    return response;
  }

  /**
   * Create a safe API call wrapper
   */
  static async safeApiCall<T>(
    apiCall: () => Promise<T>,
    fallback?: T,
    onError?: (error: ApiError) => void
  ): Promise<T | null> {
    try {
      return await apiCall();
    } catch (error) {
      const apiError = ApiErrorHandler.parseError(error);

      if (onError) {
        onError(apiError);
      }

      if (fallback !== undefined) {
        return fallback;
      }

      return null;
    }
  }

  /**
   * Batch API calls with error handling
   */
  static async batchApiCalls<T>(
    apiCalls: Array<() => Promise<T>>,
    options: {
      failFast?: boolean;
      onError?: (error: ApiError, index: number) => void;
    } = {}
  ): Promise<Array<T | null>> {
    const { failFast = false, onError } = options;
    const results: Array<T | null> = [];

    for (let i = 0; i < apiCalls.length; i++) {
      try {
        const result = await apiCalls[i]();
        results.push(result);
      } catch (error) {
        const apiError = ApiErrorHandler.parseError(error);

        if (onError) {
          onError(apiError, i);
        }

        if (failFast) {
          throw apiError;
        }

        results.push(null);
      }
    }

    return results;
  }
}

export default ApiClient;
