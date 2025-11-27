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
    console.log("=== Dashboard API Request Started ===");

    // 1. Authentication
    const { userId } = await auth();
    console.log("Authentication check:", {
      userId: userId || "NOT AUTHENTICATED",
    });

    if (!userId) {
      console.log("Authentication failed - no userId");
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
    console.log("Query parameters:", {
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
      includeInactive: searchParams.get("includeInactive"),
    });

    let queryParams;
    try {
      queryParams = validateDashboardQueryParams({
        startDate: searchParams.get("startDate") || undefined,
        endDate: searchParams.get("endDate") || undefined,
        includeInactive: searchParams.get("includeInactive") || undefined,
      });
      console.log("Query params validated successfully:", queryParams);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(
          "Query parameter validation failed:",
          error.flatten().fieldErrors
        );
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
    console.log("Fetching dashboard data for userId:", userId);
    const data = await DashboardService.getDashboardSummary(userId, options);
    console.log(
      "Dashboard data fetched successfully:",
      JSON.stringify(data, null, 2)
    );

    // 6. Validate response data
    let validatedData: DashboardSummaryResponse;
    try {
      console.log("Validating dashboard data...");
      validatedData = validateDashboardSummary(data);
      console.log("Dashboard data validated successfully");
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Log validation error for debugging
        console.error("Dashboard data validation failed:", error.issues);
        console.error("Failed data:", JSON.stringify(data, null, 2));

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
    console.log("Returning success response");
    console.log("=== Dashboard API Request Completed Successfully ===");
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
    console.error("=== Dashboard API Error ===");
    console.error("Error details:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );

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
