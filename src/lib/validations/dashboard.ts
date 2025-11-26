import { z } from "zod";
import { CropStatus, TaskStatus, TaskPriority } from "@prisma/client";

/**
 * Dashboard Validation Schemas
 *
 * These schemas validate the dashboard API responses and ensure type safety
 * between the API and client components.
 */

// ============================================================================
// Dashboard Stats Schema
// ============================================================================

export const dashboardStatsSchema = z.object({
  totalCrops: z.number().int().nonnegative(),
  activeTasks: z.number().int().nonnegative(),
  overdueTasks: z.number().int().nonnegative(),
  recentHarvests: z.number().int().nonnegative(),
  totalYield: z.number().nonnegative(),
  waterUsage: z.number().nonnegative(),
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;

// ============================================================================
// Water Usage Stats Schema
// ============================================================================

export const waterUsageStatsSchema = z.object({
  totalWater: z.number().nonnegative(),
  averagePerSession: z.number().nonnegative(),
  sessionCount: z.number().int().nonnegative(),
});

export type WaterUsageStats = z.infer<typeof waterUsageStatsSchema>;

// ============================================================================
// Fertilizer Usage Stats Schema
// ============================================================================

export const fertilizerUsageStatsSchema = z.object({
  totalAmount: z.number().nonnegative(),
  applicationCount: z.number().int().nonnegative(),
  typeBreakdown: z.record(z.string(), z.number().nonnegative()),
});

export type FertilizerUsageStats = z.infer<typeof fertilizerUsageStatsSchema>;

// ============================================================================
// Yield Stats Schema
// ============================================================================

export const yieldStatsSchema = z.object({
  totalYield: z.number().nonnegative(),
  harvestCount: z.number().int().nonnegative(),
  cropBreakdown: z.record(z.string(), z.number().nonnegative()),
});

export type YieldStats = z.infer<typeof yieldStatsSchema>;

// ============================================================================
// Pest/Disease Stats Schema
// ============================================================================

export const pestDiseaseStatsSchema = z.object({
  totalIncidents: z.number().int().nonnegative(),
  pestCount: z.number().int().nonnegative(),
  diseaseCount: z.number().int().nonnegative(),
  severityBreakdown: z.record(z.string(), z.number().nonnegative()),
});

export type PestDiseaseStats = z.infer<typeof pestDiseaseStatsSchema>;

// ============================================================================
// Crop Summary Schema (for dashboard crop list)
// ============================================================================

export const cropSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  variety: z.string().nullable(),
  status: z.nativeEnum(CropStatus),
  plantingDate: z.string().datetime(),
  expectedHarvestDate: z.string().datetime(),
  actualHarvestDate: z.string().datetime().nullable().optional(),
  area: z.number().positive().nullable().optional(),
});

export type CropSummary = z.infer<typeof cropSummarySchema>;

// ============================================================================
// Task Summary Schema (for dashboard task list)
// ============================================================================

export const taskSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  dueDate: z.string().datetime(),
  priority: z.nativeEnum(TaskPriority),
  status: z.nativeEnum(TaskStatus),
  cropId: z.string().nullable().optional(),
  cropName: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
});

export type TaskSummary = z.infer<typeof taskSummarySchema>;

// ============================================================================
// Financial Summary Schema
// ============================================================================

export const financialSummarySchema = z.object({
  totalIncome: z.number().nonnegative(),
  totalExpenses: z.number().nonnegative(),
  balance: z.number(),
  transactionCount: z.number().int().nonnegative(),
});

export type FinancialSummary = z.infer<typeof financialSummarySchema>;

// ============================================================================
// Location Schema
// ============================================================================

export const locationSchema = z
  .object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    name: z.string(),
  })
  .nullable();

export type Location = z.infer<typeof locationSchema>;

// ============================================================================
// Complete Dashboard Summary Response Schema
// ============================================================================

export const dashboardSummaryResponseSchema = z.object({
  dashboard: dashboardStatsSchema,
  water: waterUsageStatsSchema,
  fertilizer: fertilizerUsageStatsSchema,
  yield: yieldStatsSchema,
  pestDisease: pestDiseaseStatsSchema,
  financial: financialSummarySchema,
  crops: z.array(cropSummarySchema).optional(),
  recentTasks: z.array(taskSummarySchema).optional(),
  upcomingHarvests: z.array(cropSummarySchema).optional(),
  location: locationSchema,
});

export type DashboardSummaryResponse = z.infer<
  typeof dashboardSummaryResponseSchema
>;

// ============================================================================
// API Response Wrapper Schemas
// ============================================================================

export const successResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    timestamp: z.string().datetime().optional(),
  });

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.array(z.string())).optional(),
  }),
  timestamp: z.string().datetime().optional(),
});

export type SuccessResponse<T> = {
  success: true;
  data: T;
  timestamp?: string;
};

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// ============================================================================
// Dashboard API Response Schema (Complete)
// ============================================================================

export const dashboardApiResponseSchema = successResponseSchema(
  dashboardSummaryResponseSchema
);

export type DashboardApiResponse = z.infer<typeof dashboardApiResponseSchema>;

// ============================================================================
// Query Parameter Schemas
// ============================================================================

export const dashboardQueryParamsSchema = z.object({
  startDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid start date",
    })
    .optional(),
  endDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid end date",
    })
    .optional(),
  includeInactive: z
    .string()
    .transform((val) => val === "true")
    .optional(),
});

export type DashboardQueryParams = z.infer<typeof dashboardQueryParamsSchema>;

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validates dashboard summary response data
 * @param data - The data to validate
 * @returns Validated and typed data
 * @throws ZodError if validation fails
 */
export function validateDashboardSummary(
  data: unknown
): DashboardSummaryResponse {
  return dashboardSummaryResponseSchema.parse(data);
}

/**
 * Safely validates dashboard summary response data
 * @param data - The data to validate
 * @returns Success result with data or error result
 */
export function safeParseDashboardSummary(data: unknown) {
  return dashboardSummaryResponseSchema.safeParse(data);
}

/**
 * Validates dashboard API response (with success wrapper)
 * @param data - The API response to validate
 * @returns Validated and typed response
 * @throws ZodError if validation fails
 */
export function validateDashboardApiResponse(
  data: unknown
): DashboardApiResponse {
  return dashboardApiResponseSchema.parse(data);
}

/**
 * Validates query parameters for dashboard endpoint
 * @param params - The query parameters to validate
 * @returns Validated and typed parameters
 * @throws ZodError if validation fails
 */
export function validateDashboardQueryParams(
  params: unknown
): DashboardQueryParams {
  return dashboardQueryParamsSchema.parse(params);
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if response is a success response
 */
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is SuccessResponse<T> {
  return response.success === true;
}

/**
 * Type guard to check if response is an error response
 */
export function isErrorResponse<T>(
  response: ApiResponse<T>
): response is ErrorResponse {
  return response.success === false;
}

// ============================================================================
// Constants for Validation
// ============================================================================

export const DASHBOARD_VALIDATION_MESSAGES = {
  INVALID_DATE: "Invalid date format. Expected ISO 8601 datetime string.",
  NEGATIVE_VALUE: "Value must be non-negative.",
  INVALID_COORDINATES:
    "Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.",
  MISSING_REQUIRED_FIELD: "Required field is missing.",
} as const;

// ============================================================================
// Example Usage (for documentation)
// ============================================================================

/*
// In API route:
import { validateDashboardSummary, dashboardApiResponseSchema } from '@/lib/validations/dashboard';

export async function GET(request: Request) {
  try {
    const data = await getDashboardData();
    
    // Validate the data before sending
    const validatedData = validateDashboardSummary(data);
    
    return NextResponse.json({
      success: true,
      data: validatedData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid data format',
          details: error.flatten().fieldErrors,
        },
      }, { status: 400 });
    }
    // Handle other errors...
  }
}

// In client component:
import { validateDashboardApiResponse, isSuccessResponse } from '@/lib/validations/dashboard';

const response = await fetch('/api/dashboard/summary');
const json = await response.json();

// Validate and type the response
const validatedResponse = validateDashboardApiResponse(json);

if (isSuccessResponse(validatedResponse)) {
  // TypeScript knows this is SuccessResponse<DashboardSummaryResponse>
  console.log(validatedResponse.data.dashboard.totalCrops);
} else {
  // TypeScript knows this is ErrorResponse
  console.error(validatedResponse.error.message);
}
*/
