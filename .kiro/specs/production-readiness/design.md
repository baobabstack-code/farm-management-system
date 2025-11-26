# Design Document

## Overview

This design document outlines the architecture and implementation approach for bringing FarmFlow to production-ready state. The work will be executed incrementally, page-by-page, starting with the dashboard and proceeding through all major features. Each page will be fully completed—including UI, API endpoints, database operations, tests, and documentation—before moving to the next.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  (Next.js App Router, React Components, Tailwind CSS)       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Layer                                │
│  (Next.js API Routes, Zod Validation, Error Handling)       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                              │
│  (Business Logic, Data Transformation, External APIs)       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Repository Layer                            │
│  (Prisma ORM, Database Queries, Transactions)               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                 │
│  (PostgreSQL Database, Migrations, Indexes)                 │
└─────────────────────────────────────────────────────────────┘
```

### Page-by-Page Implementation Order

1. **Dashboard** - Overview metrics, recent activities, quick stats
2. **Crops** - Full CRUD for crop management
3. **Fields** - Field management with GeoJSON boundaries
4. **Tasks** - Task planning and tracking
5. **Equipment** - Equipment inventory and maintenance
6. **Soil** - Soil tests and amendments
7. **Weather** - Weather data and forecasts
8. **Planning** - Pre-season planning and crop rotation
9. **AI Companion** - AI-powered farming assistant
10. **Financial** - Income, expenses, and budgets
11. **Settings** - User preferences and configuration

## Components and Interfaces

### API Response Standard

All API endpoints will follow a consistent response format:

```typescript
// Success Response
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// Error Response
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
```

### Validation Schema Pattern

All API endpoints will use Zod for validation:

```typescript
// Request validation
const createCropSchema = z.object({
  name: z.string().min(1).max(100),
  variety: z.string().optional(),
  plantingDate: z.string().datetime(),
  expectedHarvestDate: z.string().datetime(),
  fieldId: z.string().cuid().optional(),
  area: z.number().positive().optional(),
});

// Response validation
const cropResponseSchema = z.object({
  id: z.string().cuid(),
  userId: z.string(),
  name: z.string(),
  variety: z.string().nullable(),
  plantingDate: z.string().datetime(),
  expectedHarvestDate: z.string().datetime(),
  status: z.enum([
    "PLANTED",
    "GROWING",
    "FLOWERING",
    "FRUITING",
    "HARVESTED",
    "COMPLETED",
  ]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
```

### Service Layer Pattern

Business logic will be organized in service modules:

```typescript
// src/lib/services/crop-service.ts
export class CropService {
  async getCropSummary(userId: string): Promise<CropSummary> {
    // Business logic here
  }

  async getUpcomingHarvests(userId: string, days: number): Promise<Crop[]> {
    // Business logic here
  }
}
```

### Repository Layer Pattern

Database access will use repository pattern:

```typescript
// src/lib/repositories/crop-repository.ts
export class CropRepository {
  async findByUserId(userId: string): Promise<Crop[]> {
    return prisma.crop.findMany({
      where: { userId },
      include: { field: true },
    });
  }

  async create(data: CreateCropInput): Promise<Crop> {
    return prisma.crop.create({ data });
  }
}
```

## Data Models

### Dashboard Data Models

```typescript
interface DashboardSummary {
  totalFields: number;
  totalCrops: number;
  activeCrops: number;
  totalTasks: number;
  pendingTasks: number;
  totalEquipment: number;
  upcomingHarvests: Crop[];
  recentTasks: Task[];
  weatherCurrent: WeatherData | null;
  financialSummary: {
    totalExpenses: number;
    totalRevenue: number;
    balance: number;
  };
}
```

### Key Database Indexes

The following indexes will be added for performance:

- `crops(userId, status)` - For filtering active crops
- `tasks(userId, status, dueDate)` - For task queries
- `crops(userId, expectedHarvestDate)` - For upcoming harvests
- `financialTransactions(userId, transactionDate)` - For financial queries
- `activities(userId, timestamp)` - For recent activities

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Type Safety Enforcement

_For all_ source files in the codebase, TypeScript compilation should complete without errors when strict mode is enabled
**Validates: Requirements 1.1, 1.5**

### Property 2: Dashboard Count Accuracy

_For any_ authenticated user, the dashboard total counts (fields, crops, tasks, equipment) should equal the actual count of records in the database for that user
**Validates: Requirements 2.1**

### Property 3: Recent Tasks Limit

_For any_ user with N tasks where N > 10, the dashboard should display exactly the 10 most recent tasks ordered by creation date descending
**Validates: Requirements 2.2**

### Property 4: Active Crops Filtering

_For any_ user with crops in various statuses, the dashboard should display only crops with status in [PLANTED, GROWING, FLOWERING, FRUITING]
**Validates: Requirements 2.3**

### Property 5: Upcoming Harvest Window

_For any_ set of crops, the upcoming harvests list should include only crops where expectedHarvestDate is between now and 30 days from now
**Validates: Requirements 2.4**

### Property 6: Financial Aggregation Correctness

_For any_ set of financial transactions, the total expenses should equal the sum of all transactions where transactionType = 'EXPENSE' and total revenue should equal the sum where transactionType = 'INCOME'
**Validates: Requirements 2.6**

### Property 7: Error Handling Without Crashes

_For any_ API error response, the client should display a user-friendly message and not throw uncaught exceptions
**Validates: Requirements 2.7**

### Property 8: API Prisma Usage

_For all_ API endpoints that access data, the implementation should use Prisma client methods (findMany, findUnique, create, update, delete) rather than raw SQL or mock data
**Validates: Requirements 3.1**

### Property 9: Request Validation

_For any_ API endpoint that accepts a request body, Zod validation should occur before processing, and invalid requests should return 400 status with validation errors
**Validates: Requirements 3.2**

### Property 10: Response Schema Conformance

_For any_ API response, the data structure should conform to the documented Zod schema for that endpoint
**Validates: Requirements 3.3**

### Property 11: Standardized Error Responses

_For any_ API error, the response should include a success: false field, an error object with code and message, and an appropriate HTTP status code (400, 401, 403, 404, 500)
**Validates: Requirements 3.4**

### Property 12: Foreign Key Integrity

_For all_ database relationships in the Prisma schema, foreign key constraints should be defined with appropriate onDelete cascade rules
**Validates: Requirements 4.2**

### Property 13: Migration Data Preservation

_For any_ database migration, applying the migration to a database with existing data should not result in data loss unless explicitly documented as a destructive migration
**Validates: Requirements 4.4**

### Property 14: Test Coverage Threshold

_For all_ page-level modules (components, services, repositories), unit test coverage should be at least 90%
**Validates: Requirements 5.1**

### Property 15: Component Test Completeness

_For any_ React component, tests should verify rendering with props, user interactions (clicks, inputs), and boundary cases (empty data, error states)
**Validates: Requirements 5.2**

### Property 16: Integration Test Full Stack

_For any_ feature, at least one integration test should exercise the complete path: component → API route → service → repository → database
**Validates: Requirements 5.3**

### Property 17: API Endpoint Test Coverage

_For any_ API endpoint, tests should verify request validation (valid and invalid inputs), database operations (create, read, update, delete), and response formatting
**Validates: Requirements 5.4**

### Property 18: Test Isolation

_For all_ tests that interact with external services (weather API, AI API), the tests should use mocked responses or recorded fixtures, not live API calls
**Validates: Requirements 5.6**

### Property 19: User Data Isolation

_For any_ user viewing their crops, the system should return only crops where userId matches the authenticated user's ID
**Validates: Requirements 6.1**

### Property 20: CRUD Validation

_For any_ crop creation request, if required fields (name, plantingDate, expectedHarvestDate) are missing or invalid, the system should reject the request with a 400 status and field-specific error messages
**Validates: Requirements 6.2**

### Property 21: Update Timestamp Maintenance

_For any_ crop update operation, the updatedAt field should be automatically set to the current timestamp
**Validates: Requirements 6.3**

### Property 22: Cascade Delete Behavior

_For any_ crop deletion, related records (irrigation logs, fertilizer logs, pest disease logs, harvest logs) should be deleted according to the onDelete: Cascade rule in the schema
**Validates: Requirements 6.4**

### Property 23: GeoJSON Serialization

_For any_ field with boundary data, storing a valid GeoJSON polygon and then retrieving it should return an equivalent GeoJSON structure
**Validates: Requirements 7.3**

### Property 24: Coordinate Validation

_For any_ field with latitude and longitude, the values should be validated to ensure latitude is between -90 and 90, and longitude is between -180 and 180
**Validates: Requirements 7.5**

### Property 25: Task Status Grouping

_For any_ set of tasks, when displayed on the tasks page, tasks should be correctly grouped by their status (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
**Validates: Requirements 8.1**

### Property 26: Task Completion Timestamp

_For any_ task marked as complete, the status should change to COMPLETED and completedAt should be set to the current timestamp
**Validates: Requirements 8.3**

### Property 27: Maintenance Alert Logic

_For any_ equipment where (hoursUsed - lastServiceHours) >= serviceInterval, a maintenance alert should be displayed
**Validates: Requirements 9.3**

### Property 28: Fuel Cost Calculation

_For any_ fuel log entry, totalCost should equal quantity \* pricePerUnit
**Validates: Requirements 9.5**

### Property 29: Soil Test Data Completeness

_For any_ soil test record, all required nutrient fields (pH, organicMatter, nitrogen, phosphorus, potassium, calcium, magnesium, sulfur) should be stored and retrievable
**Validates: Requirements 10.1**

### Property 30: Weather Forecast Count

_For any_ weather data fetch, the system should retrieve exactly 7 days of forecast data
**Validates: Requirements 11.2**

### Property 31: Resource Allocation Tracking

_For any_ resource allocation, the system should maintain separate fields for plannedQuantity/plannedCost and actualQuantity/actualCost
**Validates: Requirements 12.3**

### Property 32: Plan Approval Timestamp

_For any_ pre-season plan approval, the status should change to APPROVED and approvedAt should be set to the current timestamp
**Validates: Requirements 12.5**

### Property 33: AI Context Inclusion

_For any_ AI companion message, the request to Google Gemini should include farm context (user's crops, recent activities, current weather)
**Validates: Requirements 13.1**

### Property 34: Conversation History Maintenance

_For any_ multi-turn AI conversation, previous messages should be included in the conversation history array sent to the API
**Validates: Requirements 13.3**

### Property 35: Transaction Aggregation

_For any_ financial report query, transactions should be correctly aggregated by category and time period using SQL GROUP BY operations
**Validates: Requirements 14.2**

### Property 36: Budget Variance Calculation

_For any_ budget item, variance should be calculated as actualAmount - budgetedAmount
**Validates: Requirements 14.3**

### Property 37: Settings Persistence

_For any_ user preference update, the changes should be persisted to the database and reflected immediately on subsequent page loads
**Validates: Requirements 15.2**

### Property 38: ARIA Label Presence

_For all_ interactive elements (buttons, inputs, links), proper ARIA labels or aria-label attributes should be present
**Validates: Requirements 17.2**

### Property 39: Form Label Association

_For all_ form inputs, a corresponding label element should be associated via htmlFor attribute or wrapping
**Validates: Requirements 17.3**

### Property 40: Keyboard Navigation Support

_For all_ interactive features, keyboard navigation (Tab, Enter, Escape, Arrow keys) should provide full access without requiring a mouse
**Validates: Requirements 17.4**

### Property 41: Error Response Consistency

_For any_ API error, the response structure should match the ErrorResponse interface with success: false, error.code, and error.message
**Validates: Requirements 19.1**

### Property 42: Client Error Toast Display

_For any_ client-side error (network failure, validation error, API error), a toast notification should be displayed to the user
**Validates: Requirements 19.2**

### Property 43: Field-Level Validation Errors

_For any_ form validation failure, error messages should be displayed next to the specific fields that failed validation
**Validates: Requirements 19.3**

## Error Handling

### Error Handling Strategy

1. **API Layer**: All API routes will use try-catch blocks and return standardized error responses
2. **Client Layer**: All API calls will be wrapped in error handling that displays toast notifications
3. **Validation Layer**: Zod validation errors will be transformed into user-friendly field-level messages
4. **Database Layer**: Prisma errors will be caught and transformed into appropriate HTTP status codes

### Error Response Codes

- `400 Bad Request`: Validation errors, invalid input
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate resource, constraint violation
- `500 Internal Server Error`: Unexpected server errors

## Testing Strategy

### Unit Testing

**Framework**: Jest + React Testing Library

**Coverage Target**: ≥90% for page-level modules

**Test Categories**:

1. **Component Tests**: Rendering, props, user interactions, conditional rendering
2. **Service Tests**: Business logic, data transformation, edge cases
3. **Repository Tests**: Database queries, transactions, error handling
4. **Validation Tests**: Zod schema validation for valid and invalid inputs

**Example Unit Test**:

```typescript
describe('DashboardSummary Component', () => {
  it('should display correct crop count', async () => {
    const mockData = { totalCrops: 5, activeCrops: 3 };
    render(<DashboardSummary data={mockData} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3 Active')).toBeInTheDocument();
  });

  it('should handle empty data gracefully', () => {
    const mockData = { totalCrops: 0, activeCrops: 0 };
    render(<DashboardSummary data={mockData} />);
    expect(screen.getByText('No crops yet')).toBeInTheDocument();
  });
});
```

### Integration Testing

**Approach**: Test full request path from API route to database

**Test Database**: Use a test PostgreSQL instance or SQLite in-memory database

**Test Categories**:

1. **API Route Tests**: Request → validation → service → repository → response
2. **Database Transaction Tests**: Multi-step operations with rollback on failure
3. **Authentication Tests**: Protected routes, user data isolation

**Example Integration Test**:

```typescript
describe("GET /api/dashboard/summary", () => {
  beforeEach(async () => {
    await seedTestDatabase();
  });

  afterEach(async () => {
    await cleanTestDatabase();
  });

  it("should return dashboard summary for authenticated user", async () => {
    const response = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${testToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      totalFields: expect.any(Number),
      totalCrops: expect.any(Number),
      upcomingHarvests: expect.any(Array),
    });
  });
});
```

### Property-Based Testing

**Framework**: fast-check (JavaScript property-based testing library)

**Usage**: For critical business logic and data transformations

**Example**:

```typescript
import fc from "fast-check";

describe("Financial calculations", () => {
  it("should correctly aggregate transactions", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            amount: fc.float({ min: 0, max: 10000 }),
            type: fc.constantFrom("INCOME", "EXPENSE"),
          })
        ),
        (transactions) => {
          const result = aggregateTransactions(transactions);
          const expectedIncome = transactions
            .filter((t) => t.type === "INCOME")
            .reduce((sum, t) => sum + t.amount, 0);
          const expectedExpense = transactions
            .filter((t) => t.type === "EXPENSE")
            .reduce((sum, t) => sum + t.amount, 0);

          expect(result.totalIncome).toBeCloseTo(expectedIncome, 2);
          expect(result.totalExpense).toBeCloseTo(expectedExpense, 2);
        }
      )
    );
  });
});
```

### End-to-End Testing (Optional but Recommended)

**Framework**: Playwright or Cypress

**Scope**: Critical user flows

**Example Flows**:

1. User login → Dashboard view → Create crop → View crop list
2. User login → Tasks page → Create task → Mark complete
3. User login → Equipment page → Add equipment → Log maintenance

### Test Execution Strategy

1. **Local Development**: Run `pnpm test` before committing
2. **Pre-commit Hook**: Husky runs tests on changed files
3. **CI Pipeline**: Run full test suite on PR creation
4. **Staging Deployment**: Run smoke tests after deployment
5. **Production Deployment**: Run critical path tests

### Mock Service Worker (MSW) for External APIs

For tests that involve external services (weather API, AI API), use MSW to intercept and mock responses:

```typescript
import { rest } from "msw";
import { setupServer } from "msw/node";

const server = setupServer(
  rest.get("https://api.weather.com/current", (req, res, ctx) => {
    return res(
      ctx.json({
        temperature: 72,
        humidity: 65,
        description: "Partly cloudy",
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Implementation Phases

### Phase 1: Dashboard (Week 1)

- Audit dashboard components and identify mock data
- Implement `/api/dashboard/summary` endpoint
- Create dashboard service and repository layers
- Add Zod validation schemas
- Write unit and integration tests
- Update database indexes
- Document API endpoint

### Phase 2: Crops (Week 2)

- Audit crops page and components
- Implement CRUD API endpoints for crops
- Add field relationship handling
- Create crop service layer
- Write comprehensive tests
- Add database migrations if needed
- Document API endpoints

### Phase 3: Fields (Week 2-3)

- Audit fields page
- Implement field CRUD endpoints
- Add GeoJSON boundary handling
- Implement coordinate validation
- Write tests including GeoJSON serialization
- Document API endpoints

### Phase 4: Tasks (Week 3)

- Audit tasks page
- Implement task CRUD endpoints
- Add status grouping logic
- Implement task completion flow
- Write tests
- Document API endpoints

### Phase 5: Equipment (Week 4)

- Audit equipment page
- Implement equipment CRUD endpoints
- Add maintenance logging
- Implement fuel tracking
- Add maintenance alert logic
- Write tests
- Document API endpoints

### Phase 6: Soil (Week 4-5)

- Audit soil management pages
- Implement soil test endpoints
- Add soil amendment tracking
- Implement trend analysis
- Write tests
- Document API endpoints

### Phase 7: Weather (Week 5)

- Audit weather page
- Implement weather data endpoints
- Add forecast retrieval
- Implement alert system
- Write tests with mocked weather API
- Document API endpoints

### Phase 8: Planning (Week 6)

- Audit planning pages
- Implement pre-season plan endpoints
- Add crop rotation logic
- Implement resource allocation
- Write tests
- Document API endpoints

### Phase 9: AI Companion (Week 6-7)

- Audit AI companion interface
- Implement AI chat endpoints
- Add context building logic
- Implement conversation history
- Write tests with mocked AI API
- Document API endpoints

### Phase 10: Financial (Week 7)

- Audit financial pages
- Implement transaction endpoints
- Add budget tracking
- Implement aggregation queries
- Add QuickBooks sync (if applicable)
- Write tests
- Document API endpoints

### Phase 11: Settings (Week 8)

- Audit settings page
- Implement user preference endpoints
- Add profile management
- Write tests
- Document API endpoints

### Phase 12: Final Integration (Week 8)

- Run full test suite across all pages
- Perform accessibility audit
- Run performance profiling
- Create deployment checklist
- Update all documentation
- Prepare production deployment

## Performance Considerations

1. **Database Indexes**: Add indexes for all frequently queried fields
2. **Query Optimization**: Use Prisma's `select` and `include` to fetch only needed data
3. **Pagination**: Implement cursor-based pagination for large lists
4. **Caching**: Add Redis caching for frequently accessed data (weather, dashboard summary)
5. **Image Optimization**: Use Next.js Image component for all images
6. **Code Splitting**: Leverage Next.js automatic code splitting
7. **API Response Time**: Target <300ms for dashboard API responses

## Security Considerations

1. **Authentication**: All API routes verify Clerk authentication
2. **Authorization**: Verify userId matches authenticated user for all data access
3. **Input Validation**: Zod validation on all API inputs
4. **SQL Injection**: Prevented by Prisma parameterized queries
5. **XSS Protection**: React's built-in XSS protection + CSP headers
6. **Rate Limiting**: Implement rate limiting on API routes
7. **Environment Variables**: Never expose secrets in client code

## Deployment Strategy

1. **Database Migrations**: Run `npx prisma migrate deploy` in staging first
2. **Smoke Tests**: Run critical path tests in staging
3. **Gradual Rollout**: Deploy to production with feature flags if needed
4. **Monitoring**: Set up error tracking (Sentry) and performance monitoring
5. **Rollback Plan**: Document rollback steps for each deployment
6. **Database Backups**: Ensure automated backups before migrations

## Documentation Requirements

Each completed page/feature must include:

1. **API Documentation**: Request/response examples, status codes, error cases
2. **Migration Notes**: Database changes, rollback instructions
3. **Testing Documentation**: How to run tests, coverage reports
4. **Deployment Guide**: Steps to deploy, environment variables needed
5. **CHANGELOG Entry**: Summary of changes, breaking changes, migration steps
