# Dashboard Validation Schemas

## Overview

This document describes the Zod validation schemas for the FarmFlow dashboard API. These schemas ensure type safety and data validation between the API and client components.

## File Location

`src/lib/validations/dashboard.ts`

## Purpose

1. **Type Safety**: Generate TypeScript types from Zod schemas
2. **Runtime Validation**: Validate API responses at runtime
3. **Error Prevention**: Catch data format issues before they reach the UI
4. **Documentation**: Schemas serve as API contract documentation
5. **Consistency**: Ensure consistent data structures across the application

## Schemas

### 1. DashboardStats

Core dashboard metrics displayed in stat cards.

```typescript
const dashboardStatsSchema = z.object({
  totalCrops: z.number().int().nonnegative(),
  activeTasks: z.number().int().nonnegative(),
  overdueTasks: z.number().int().nonnegative(),
  recentHarvests: z.number().int().nonnegative(),
  totalYield: z.number().nonnegative(),
  waterUsage: z.number().nonnegative(),
});

type DashboardStats = z.infer<typeof dashboardStatsSchema>;
```

**Fields**:

- `totalCrops` - Total number of crops (integer, ≥0)
- `activeTasks` - Number of active tasks (integer, ≥0)
- `overdueTasks` - Number of overdue tasks (integer, ≥0)
- `recentHarvests` - Number of recent harvests (integer, ≥0)
- `totalYield` - Total yield in kg (≥0)
- `waterUsage` - Total water usage in liters (≥0)

### 2. WaterUsageStats

Water usage statistics for resource tracking.

```typescript
const waterUsageStatsSchema = z.object({
  totalWater: z.number().nonnegative(),
  averagePerSession: z.number().nonnegative(),
  sessionCount: z.number().int().nonnegative(),
});
```

### 3. FertilizerUsageStats

Fertilizer application statistics.

```typescript
const fertilizerUsageStatsSchema = z.object({
  totalAmount: z.number().nonnegative(),
  applicationCount: z.number().int().nonnegative(),
  typeBreakdown: z.record(z.string(), z.number().nonnegative()),
});
```

**Note**: `typeBreakdown` is a record/map of fertilizer type to amount used.

### 4. YieldStats

Harvest yield statistics.

```typescript
const yieldStatsSchema = z.object({
  totalYield: z.number().nonnegative(),
  harvestCount: z.number().int().nonnegative(),
  cropBreakdown: z.record(z.string(), z.number().nonnegative()),
});
```

### 5. PestDiseaseStats

Pest and disease incident statistics.

```typescript
const pestDiseaseStatsSchema = z.object({
  totalIncidents: z.number().int().nonnegative(),
  pestCount: z.number().int().nonnegative(),
  diseaseCount: z.number().int().nonnegative(),
  severityBreakdown: z.record(z.string(), z.number().nonnegative()),
});
```

### 6. CropSummary

Simplified crop data for dashboard display.

```typescript
const cropSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  variety: z.string().nullable(),
  status: z.nativeEnum(CropStatus),
  plantingDate: z.string().datetime(),
  expectedHarvestDate: z.string().datetime(),
  actualHarvestDate: z.string().datetime().nullable().optional(),
  area: z.number().positive().nullable().optional(),
});
```

**Enums**: Uses Prisma's `CropStatus` enum (PLANTED, GROWING, FLOWERING, FRUITING, HARVESTED, COMPLETED)

### 7. TaskSummary

Simplified task data for dashboard display.

```typescript
const taskSummarySchema = z.object({
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
```

### 8. Location

Farm location data for weather integration.

```typescript
const locationSchema = z
  .object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    name: z.string(),
  })
  .nullable();
```

**Validation**: Ensures valid coordinate ranges.

### 9. DashboardSummaryResponse

Complete dashboard data structure.

```typescript
const dashboardSummaryResponseSchema = z.object({
  dashboard: dashboardStatsSchema,
  water: waterUsageStatsSchema,
  fertilizer: fertilizerUsageStatsSchema,
  yield: yieldStatsSchema,
  pestDisease: pestDiseaseStatsSchema,
  crops: z.array(cropSummarySchema).optional(),
  recentTasks: z.array(taskSummarySchema).optional(),
  upcomingHarvests: z.array(cropSummarySchema).optional(),
  location: locationSchema,
});
```

### 10. API Response Wrappers

Standard success/error response formats.

```typescript
// Success Response
{
  success: true,
  data: DashboardSummaryResponse,
  timestamp?: string
}

// Error Response
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: Record<string, string[]>
  },
  timestamp?: string
}
```

## Usage Examples

### In API Routes

```typescript
import {
  validateDashboardSummary,
  dashboardApiResponseSchema,
} from "@/lib/validations/dashboard";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // Fetch data from database
    const data = await getDashboardData(userId);

    // Validate before sending
    const validatedData = validateDashboardSummary(data);

    return NextResponse.json({
      success: true,
      data: validatedData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid data format",
            details: error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}
```

### In Client Components

```typescript
import {
  validateDashboardApiResponse,
  isSuccessResponse,
  type DashboardSummaryResponse,
} from "@/lib/validations/dashboard";

async function fetchDashboardData() {
  const response = await fetch("/api/dashboard/summary");
  const json = await response.json();

  // Validate and type the response
  const validatedResponse = validateDashboardApiResponse(json);

  if (isSuccessResponse(validatedResponse)) {
    // TypeScript knows the exact type here
    const { dashboard, water, fertilizer } = validatedResponse.data;
    console.log(`Total crops: ${dashboard.totalCrops}`);
    return validatedResponse.data;
  } else {
    // Handle error
    throw new Error(validatedResponse.error.message);
  }
}
```

### Safe Parsing (No Exceptions)

```typescript
import { safeParseDashboardSummary } from "@/lib/validations/dashboard";

const result = safeParseDashboardSummary(data);

if (result.success) {
  // Use result.data
  console.log(result.data.dashboard.totalCrops);
} else {
  // Handle validation errors
  console.error(result.error.issues);
}
```

### Query Parameter Validation

```typescript
import { validateDashboardQueryParams } from "@/lib/validations/dashboard";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const params = validateDashboardQueryParams({
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
      includeInactive: searchParams.get("includeInactive"),
    });

    // Use validated params
    const data = await getDashboardData(userId, params);
    // ...
  } catch (error) {
    // Handle validation error
  }
}
```

## Helper Functions

### validateDashboardSummary(data)

Validates dashboard summary data. Throws `ZodError` if validation fails.

```typescript
const validated = validateDashboardSummary(data);
```

### safeParseDashboardSummary(data)

Safely validates without throwing. Returns success/error result.

```typescript
const result = safeParseDashboardSummary(data);
if (result.success) {
  // Use result.data
}
```

### validateDashboardApiResponse(data)

Validates complete API response with success wrapper.

```typescript
const validated = validateDashboardApiResponse(response);
```

### validateDashboardQueryParams(params)

Validates query parameters for dashboard endpoint.

```typescript
const validated = validateDashboardQueryParams(searchParams);
```

## Type Guards

### isSuccessResponse(response)

Type guard to check if response is successful.

```typescript
if (isSuccessResponse(response)) {
  // TypeScript knows response.data exists
  console.log(response.data);
}
```

### isErrorResponse(response)

Type guard to check if response is an error.

```typescript
if (isErrorResponse(response)) {
  // TypeScript knows response.error exists
  console.error(response.error.message);
}
```

## Error Handling

### Validation Errors

When validation fails, Zod provides detailed error information:

```typescript
try {
  validateDashboardSummary(invalidData);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log(error.issues);
    // [
    //   {
    //     code: 'invalid_type',
    //     expected: 'number',
    //     received: 'string',
    //     path: ['dashboard', 'totalCrops'],
    //     message: 'Expected number, received string'
    //   }
    // ]
  }
}
```

### Flattened Errors

For API responses, use flattened errors:

```typescript
catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid data format',
        details: error.flatten().fieldErrors,
        // {
        //   'dashboard.totalCrops': ['Expected number, received string'],
        //   'water.totalWater': ['Required']
        // }
      },
    }, { status: 400 });
  }
}
```

## Testing

### Unit Tests

```typescript
import { dashboardStatsSchema } from "@/lib/validations/dashboard";

describe("Dashboard Validation", () => {
  it("validates correct dashboard stats", () => {
    const validData = {
      totalCrops: 5,
      activeTasks: 3,
      overdueTasks: 1,
      recentHarvests: 2,
      totalYield: 150.5,
      waterUsage: 1000,
    };

    expect(() => dashboardStatsSchema.parse(validData)).not.toThrow();
  });

  it("rejects negative values", () => {
    const invalidData = {
      totalCrops: -1, // Invalid
      activeTasks: 3,
      overdueTasks: 1,
      recentHarvests: 2,
      totalYield: 150.5,
      waterUsage: 1000,
    };

    expect(() => dashboardStatsSchema.parse(invalidData)).toThrow();
  });
});
```

## Best Practices

1. **Always Validate API Responses**: Validate data from external sources
2. **Use Type Guards**: Use `isSuccessResponse` and `isErrorResponse` for type safety
3. **Handle Errors Gracefully**: Provide user-friendly error messages
4. **Document Changes**: Update this README when schemas change
5. **Test Validation**: Write tests for validation logic
6. **Use Safe Parse**: Use `safeParse` when you don't want exceptions
7. **Validate Early**: Validate at API boundaries (routes, client fetches)

## Common Issues

### Issue: "Expected number, received string"

**Cause**: API returning string instead of number  
**Solution**: Ensure database queries return correct types, or transform data before validation

### Issue: "Required field missing"

**Cause**: Optional field not marked as optional in schema  
**Solution**: Add `.optional()` or `.nullable()` to schema field

### Issue: "Invalid datetime string"

**Cause**: Date not in ISO 8601 format  
**Solution**: Use `toISOString()` when serializing dates

## Migration Guide

### From Untyped to Typed

**Before**:

```typescript
const response = await fetch("/api/dashboard/summary");
const data = await response.json(); // any type
console.log(data.dashboard.totalCrops); // No type safety
```

**After**:

```typescript
const response = await fetch("/api/dashboard/summary");
const json = await response.json();
const validated = validateDashboardApiResponse(json);

if (isSuccessResponse(validated)) {
  console.log(validated.data.dashboard.totalCrops); // Fully typed!
}
```

## Related Files

- `src/lib/validations/dashboard.ts` - Schema definitions
- `src/app/api/dashboard/summary/route.ts` - API route (to be created)
- `src/app/dashboard/page.tsx` - Dashboard page component
- `src/lib/validations/crop.ts` - Crop validation schemas
- `src/lib/validations/task.ts` - Task validation schemas

## Compliance

✅ **Requirement 3.2**: Zod validation for request bodies and responses  
✅ **Requirement 3.3**: Response schemas documented and validated  
✅ **Requirement 3.6**: TypeScript types exported from Zod schemas  
✅ **Property 10**: Response schema conformance enforced

## Next Steps

1. ✅ Schemas created and documented
2. ⏳ Implement dashboard repository layer (Task 3.2)
3. ⏳ Implement dashboard service layer (Task 3.3)
4. ⏳ Create dashboard API route with validation (Task 3.4)
5. ⏳ Update dashboard UI to use validated types (Task 4.1)

---

**Last Updated**: November 25, 2025  
**Version**: 1.0.0
