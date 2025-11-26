import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { DashboardService } from "@/lib/services/dashboard-service";
import {
  validateDashboardSummary,
  validateDashboardQueryParams,
  type DashboardSummaryResponse,
} from "@/lib/validations/dashboard";
import { z } from "zod";

/**
 * GET /api/dashboard/summary
 *
 * Returns comprehensive dashboard data including:
 * - Dashboard stats (crops, tasks, yield, water usage)
 * - Resource usage (water, fertilizer)
 * - Yield statistics
 * - Pest/disease statistics
 * - Recent tasks
 * - Upcoming harvests
 * - Location data
 *
 * Query Parameters:
 * - startDate (optional): ISO datetime string for date range filtering
 * - endDate (optional): ISO datetime string for date range filtering
 * - includeInactive (optional): "true" to include inactive items
 *
 * Authentication: Required (Clerk)
 *
 * Response Format:
 * {
 *   success: true,
 *   data: DashboardSummaryResponse,
 *   timestamp: string
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    // 2. Parse and validate query parameters
    const { searchParams } = new URL(request.url);

    let queryParams;
    try {
      queryParams = validateDashboardQueryParams({
        startDate: searchParams.get("startDate"),
        endDate: searchParams.get("endDate"),
        includeInactive: searchParams.get("includeInactive"),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_QUERY_PARAMS",
              message: "Invalid query parameters",
              details: error.flatten().fieldErrors,
            },
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // 3. Convert string dates to Date objects
    const options: {
      startDate?: Date;
      endDate?: Date;
      includeInactive?: boolean;
    } = {};

    if (queryParams.startDate) {
      options.startDate = new Date(queryParams.startDate);
    }
    if (queryParams.endDate) {
      options.endDate = new Date(queryParams.endDate);
    }
    if (queryParams.includeInactive !== undefined) {
      options.includeInactive = queryParams.includeInactive;
    }

    // 4. Validate date range
    if (options.startDate && options.endDate) {
      if (
        !DashboardService.validateDateRange(options.startDate, options.endDate)
      ) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_DATE_RANGE",
              message: "Start date must be before end date",
            },
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }
    }

    // 5. Fetch dashboard data
    const data = await DashboardService.getDashboardSummary(userId, options);

    // 6. Validate response data
    let validatedData: DashboardSummaryResponse;
    try {
      validatedData = validateDashboardSummary(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Log validation error for debugging
        console.error("Dashboard data validation failed:", error.issues);

        return NextResponse.json(
          {
            success: false,
            error: {
              code: "DATA_VALIDATION_ERROR",
              message: "Internal data validation error",
              details: error.flatten().fieldErrors,
            },
            timestamp: new Date().toISOString(),
          },
          { status: 500 }
        );
      }
      throw error;
    }

    // 7. Return success response
    return NextResponse.json(
      {
        success: true,
        data: validatedData,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, max-age=60", // Cache for 1 minute
        },
      }
    );
  } catch (error) {
    // 8. Handle unexpected errors
    console.error("Dashboard API error:", error);

    // Check for specific error types
    if (error instanceof Error) {
      // Database connection errors
      if (
        error.message.includes("connect") ||
        error.message.includes("timeout")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "DATABASE_ERROR",
              message: "Unable to connect to database",
            },
            timestamp: new Date().toISOString(),
          },
          { status: 503 }
        );
      }

      // Prisma errors
      if (error.message.includes("Prisma")) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "DATABASE_QUERY_ERROR",
              message: "Database query failed",
            },
            timestamp: new Date().toISOString(),
          },
          { status: 500 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/dashboard/summary
 *
 * CORS preflight handler
 */
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        Allow: "GET, OPTIONS",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}
