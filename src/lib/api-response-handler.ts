/**
 * Centralized API response and error handling utilities for Next.js API routes
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
  timestamp: string;
  path?: string;
}

export class ApiResponseHandler {
  /**
   * Create a successful API response
   */
  static success<T>(
    data: T,
    message?: string,
    status: number = 200
  ): NextResponse {
    const response: ApiSuccessResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status });
  }

  /**
   * Create an error API response
   */
  static error(
    message: string,
    status: number = 500,
    code?: string,
    details?: any,
    path?: string
  ): NextResponse {
    const response: ApiErrorResponse = {
      success: false,
      error: message,
      code,
      details,
      timestamp: new Date().toISOString(),
      path,
    };

    // Log error in development
    if (process.env.NODE_ENV === "development") {
      console.error("API Error:", response);
    }

    return NextResponse.json(response, { status });
  }

  /**
   * Handle common API errors with appropriate responses
   */
  static handleError(error: unknown, path?: string): NextResponse {
    console.error("API Error:", error);

    // Validation errors (Zod)
    if (error instanceof ZodError) {
      return this.error(
        "Validation failed",
        400,
        "VALIDATION_ERROR",
        error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
        path
      );
    }

    // Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case "P2002":
          return this.error(
            "A record with this information already exists",
            409,
            "DUPLICATE_RECORD",
            { field: error.meta?.target },
            path
          );
        case "P2025":
          return this.error(
            "Record not found",
            404,
            "RECORD_NOT_FOUND",
            undefined,
            path
          );
        case "P2003":
          return this.error(
            "Cannot delete record due to existing relationships",
            409,
            "FOREIGN_KEY_CONSTRAINT",
            { field: error.meta?.field_name },
            path
          );
        case "P2014":
          return this.error(
            "Invalid data provided",
            400,
            "INVALID_DATA",
            { relation: error.meta?.relation_name },
            path
          );
        default:
          return this.error(
            "Database operation failed",
            500,
            "DATABASE_ERROR",
            { code: error.code },
            path
          );
      }
    }

    // Prisma validation errors
    if (error instanceof Prisma.PrismaClientValidationError) {
      return this.error(
        "Invalid data format",
        400,
        "VALIDATION_ERROR",
        undefined,
        path
      );
    }

    // Network/timeout errors
    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        return this.error(
          "Request timed out",
          408,
          "TIMEOUT_ERROR",
          undefined,
          path
        );
      }

      if (
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("ENOTFOUND")
      ) {
        return this.error(
          "Service unavailable",
          503,
          "SERVICE_UNAVAILABLE",
          undefined,
          path
        );
      }
    }

    // Generic server error
    return this.error(
      "Internal server error",
      500,
      "INTERNAL_ERROR",
      process.env.NODE_ENV === "development" ? error : undefined,
      path
    );
  }

  /**
   * Handle authentication errors
   */
  static unauthorized(
    message: string = "Authentication required"
  ): NextResponse {
    return this.error(message, 401, "UNAUTHORIZED");
  }

  /**
   * Handle authorization errors
   */
  static forbidden(message: string = "Access denied"): NextResponse {
    return this.error(message, 403, "FORBIDDEN");
  }

  /**
   * Handle not found errors
   */
  static notFound(resource: string = "Resource"): NextResponse {
    return this.error(`${resource} not found`, 404, "NOT_FOUND");
  }

  /**
   * Handle conflict errors
   */
  static conflict(message: string, details?: any): NextResponse {
    return this.error(message, 409, "CONFLICT", details);
  }

  /**
   * Handle rate limiting errors
   */
  static rateLimited(message: string = "Too many requests"): NextResponse {
    return this.error(message, 429, "RATE_LIMITED");
  }

  /**
   * Validate request body with Zod schema
   */
  static async validateBody<T>(request: Request, schema: any): Promise<T> {
    try {
      const body = await request.json();
      return schema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        throw error;
      }
      throw new Error("Invalid JSON in request body");
    }
  }

  /**
   * Validate query parameters with Zod schema
   */
  static validateQuery<T>(searchParams: URLSearchParams, schema: any): T {
    const query = Object.fromEntries(searchParams.entries());
    return schema.parse(query);
  }

  /**
   * Check if user is authenticated
   */
  static requireAuth(userId: string | null): asserts userId is string {
    if (!userId) {
      throw new Error("UNAUTHORIZED");
    }
  }

  /**
   * Wrap API handler with error handling
   */
  static withErrorHandling<T extends any[]>(
    handler: (request: Request, ...args: T) => Promise<NextResponse>
  ) {
    return async (request: Request, ...args: T): Promise<NextResponse> => {
      try {
        return await handler(request, ...args);
      } catch (error) {
        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          return this.unauthorized();
        }
        return this.handleError(error, request.url);
      }
    };
  }
}

/**
 * Utility functions for common API patterns
 */
export class ApiUtils {
  /**
   * Parse pagination parameters
   */
  static parsePagination(searchParams: URLSearchParams) {
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "10"))
    );
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }

  /**
   * Parse sorting parameters
   */
  static parseSorting(searchParams: URLSearchParams, allowedFields: string[]) {
    const sortBy = searchParams.get("sortBy");
    const sortOrder = searchParams.get("sortOrder") === "desc" ? "desc" : "asc";

    if (!sortBy || !allowedFields.includes(sortBy)) {
      return { createdAt: "desc" };
    }

    return { [sortBy]: sortOrder };
  }

  /**
   * Parse filter parameters
   */
  static parseFilters(searchParams: URLSearchParams, allowedFilters: string[]) {
    const filters: Record<string, any> = {};

    allowedFilters.forEach((filter) => {
      const value = searchParams.get(filter);
      if (value) {
        filters[filter] = value;
      }
    });

    return filters;
  }

  /**
   * Create paginated response
   */
  static createPaginatedResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
  ) {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    };
  }
}

export default ApiResponseHandler;
