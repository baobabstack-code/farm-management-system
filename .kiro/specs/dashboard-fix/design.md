# Design Document

## Overview

This design addresses the dashboard rendering issue where the page appears blank due to a 400 error from the `/api/dashboard/summary` endpoint. The solution involves debugging the API route, ensuring proper authentication, validating data structures, and providing better error handling.

## Architecture

The dashboard follows a client-server architecture:

1. **Client (Dashboard Page)**: React component that fetches data and renders the UI
2. **API Route**: Next.js API endpoint that handles authentication, data fetching, and validation
3. **Service Layer**: Business logic for transforming repository data
4. **Repository Layer**: Database queries using Prisma

## Components and Interfaces

### API Route (`/api/dashboard/summary`)

**Responsibilities:**

- Authenticate user via Clerk
- Validate query parameters
- Fetch dashboard data from service layer
- Validate response data
- Return formatted JSON response

**Error Handling:**

- 401: Authentication required
- 400: Invalid query parameters or data validation error
- 500: Database or internal server error

### Dashboard Service

**Responsibilities:**

- Transform repository data into API response format
- Handle date conversions (Date objects to ISO strings)
- Provide default values for missing data

### Dashboard Repository

**Responsibilities:**

- Execute database queries
- Return raw data from Prisma
- Handle database connection errors

## Data Models

### Dashboard Summary Response

```typescript
{
  dashboard: {
    totalCrops: number,
    activeTasks: number,
    overdueTasks: number,
    recentHarvests: number,
    totalYield: number,
    waterUsage: number
  },
  water: {
    totalWater: number,
    averagePerSession: number,
    sessionCount: number
  },
  fertilizer: {
    totalAmount: number,
    applicationCount: number,
    typeBreakdown: Record<string, number>
  },
  yield: {
    totalYield: number,
    harvestCount: number,
    cropBreakdown: Record<string, number>
  },
  pestDisease: {
    totalIncidents: number,
    pestCount: number,
    diseaseCount: number,
    severityBreakdown: Record<string, number>
  },
  financial: {
    totalIncome: number,
    totalExpenses: number,
    balance: number,
    transactionCount: number
  },
  recentTasks: TaskSummary[],
  upcomingHarvests: CropSummary[],
  location: {
    latitude: number,
    longitude: number,
    name: string
  } | null
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Successful API Response for Authenticated Users

_For any_ authenticated user request to the dashboard API, the system should return a 200 status code with valid dashboard data.

**Validates: Requirements 1.1, 1.2**

### Property 2: Empty State Handling

_For any_ authenticated user with no farm data, the system should return a valid response with zero values and empty arrays, not an error.

**Validates: Requirements 1.4**

### Property 3: Error Response Format

_For any_ error condition (authentication, validation, database), the system should return a properly formatted error response with success: false, error code, and message.

**Validates: Requirements 1.5, 2.1, 2.2, 2.3, 2.4**

## Error Handling

### Authentication Errors

- Check if `userId` is present from Clerk `auth()`
- Return 401 with clear message if not authenticated
- Log authentication failures

### Validation Errors

- Catch Zod validation errors
- Return 400 with specific field errors
- Log validation failures with details

### Database Errors

- Catch Prisma errors
- Return 500 with generic message (don't expose internal details)
- Log full error details server-side

### Client-Side Error Handling

- Display toast notifications for errors
- Show error message from API response
- Provide fallback UI for failed data loads

## Testing Strategy

### Unit Tests

- Test API route with mocked authentication (authenticated and unauthenticated)
- Test service layer data transformations
- Test repository queries with test database
- Test validation schemas with valid and invalid data

### Integration Tests

- Test full API flow from request to response
- Test with empty database (new user scenario)
- Test with populated database
- Test error scenarios (database down, invalid auth)

### Manual Testing

- Test dashboard page in browser with authenticated user
- Test with new user (no data)
- Test with user who has data
- Check browser console for errors
- Verify network tab shows correct API responses

## Implementation Notes

### Debugging Steps

1. **Add Console Logging**: Add detailed console.log statements in the API route to track execution flow
2. **Check Authentication**: Verify Clerk auth() is returning userId
3. **Check Database Connection**: Verify Prisma can connect to database
4. **Check Data Validation**: Log the data before validation to see what's failing
5. **Check Query Parameters**: Verify no unexpected query parameters are being sent

### Potential Issues

1. **Clerk Authentication**: The auth() function might not be returning userId in development
2. **Database Connection**: Prisma might not be connected to the database
3. **Data Validation**: The response data might not match the Zod schema
4. **Query Parameters**: Unexpected query parameters might be causing validation to fail

### Quick Fixes

1. Add try-catch with detailed logging around each step in the API route
2. Return early with success response if user has no data (empty state)
3. Make validation more lenient for optional fields
4. Add default values for missing data
