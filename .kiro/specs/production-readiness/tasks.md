# Implementation Plan

## Overview

This implementation plan breaks down the production-readiness work into discrete, manageable tasks organized by page/feature. Each task builds incrementally on previous work, with comprehensive testing and documentation at each step.

## Phase 1: Dashboard Page (Priority 1)

- [ ] 1. Baseline and Static Analysis
- [x] 1.1 Run full build and capture baseline
  - Execute `pnpm install && pnpm lint && pnpm test && pnpm build`
  - Document all linting errors, type errors, and test failures
  - Create baseline issue list for dashboard-related files
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 1.2 Audit dashboard components
  - Inspect `src/app/dashboard/page.tsx` and all components in `src/app/dashboard/components/`
  - Identify all API calls and data dependencies
  - Document mock data usage and duplicated components
  - Create list of components to consolidate or refactor
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 2. Database Schema and Migrations
- [x] 2.1 Review and update Prisma schema for dashboard needs
  - Verify all models used by dashboard (Crop, Task, Field, Equipment, FinancialTransaction)
  - Add missing indexes: `crops(userId, status)`, `tasks(userId, status, dueDate)`, `crops(userId, expectedHarvestDate)`
  - Create migration: `npx prisma migrate dev --name dashboard-indexes`
  - _Requirements: 4.2, 4.3_

- [x] 2.2 Create seed data for development
  - Add seed script in `prisma/seed.ts` for dashboard testing
  - Include sample crops, tasks, fields, equipment, transactions
  - Document that seed data is for development only
  - _Requirements: 4.1_

- [ ] 3. API Implementation - Dashboard Summary Endpoint
- [x] 3.1 Create Zod validation schemas for dashboard
  - Create `src/lib/validations/dashboard.ts`
  - Define `DashboardSummaryResponse` schema
  - Define schemas for crop summary, task summary, financial summary
  - Export TypeScript types from schemas
  - _Requirements: 3.2, 3.3, 3.6_

- [x] 3.2 Implement dashboard repository layer
  - Create `src/lib/repositories/dashboard-repository.ts`
  - Implement `getTotalCounts(userId)` - fields, crops, tasks, equipment counts
  - Implement `getRecentTasks(userId, limit)` - fetch recent tasks
  - Implement `getActiveCrops(userId)` - fetch crops with active statuses
  - Implement `getUpcomingHarvests(userId, days)` - fetch crops with harvests in next N days
  - Implement `getFinancialSummary(userId)` - aggregate transactions
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 3.1_

- [x] 3.3 Implement dashboard service layer
  - Create `src/lib/services/dashboard-service.ts`
  - Implement `getDashboardSummary(userId)` that calls repository methods
  - Add business logic for data transformation
  - Handle edge cases (no data, missing weather)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 16.1_

- [x] 3.4 Create dashboard API route
  - Create `src/app/api/dashboard/summary/route.ts`
  - Implement GET handler with Clerk authentication
  - Add Zod validation for response
  - Implement standardized error handling
  - Return data in SuccessResponse format
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 19.1_

- [x] 3.5 Write property test for dashboard counts
  - **Property 2: Dashboard Count Accuracy**
  - **Validates: Requirements 2.1**

- [x] 3.6 Write property test for recent tasks limit
  - **Property 3: Recent Tasks Limit**
  - **Validates: Requirements 2.2**

- [x] 3.7 Write property test for active crops filtering
  - **Property 4: Active Crops Filtering**
  - **Validates: Requirements 2.3**

- [x] 3.8 Write property test for upcoming harvests
  - **Property 5: Upcoming Harvest Window**
  - **Validates: Requirements 2.4**

- [x] 3.9 Write property test for financial aggregation
  - **Property 6: Financial Aggregation Correctness**
  - **Validates: Requirements 2.6**

- [ ] 4. Update Dashboard UI Components
- [x] 4.1 Update dashboard page to use real API
  - Modify `src/app/dashboard/page.tsx` to fetch from `/api/dashboard/summary`
  - Remove all mock data imports
  - Add error handling with toast notifications
  - Add loading states
  - _Requirements: 2.1, 2.7, 19.2_

- [x] 4.2 Update dashboard stat cards component
  - Update component to display real counts
  - Add proper TypeScript types from Zod schemas
  - Handle zero/empty states gracefully
  - Add accessibility attributes (ARIA labels)
  - _Requirements: 2.1, 17.2_

- [x] 4.3 Update recent tasks widget
  - Display 10 most recent tasks with proper formatting
  - Add task status indicators
  - Handle empty state (no tasks)
  - Add link to full tasks page
  - _Requirements: 2.2, 17.3_

- [x] 4.4 Update upcoming harvests widget
  - Display crops with harvests in next 30 days
  - Show days until harvest
  - Handle empty state (no upcoming harvests)
  - Add visual indicators for urgency
  - _Requirements: 2.4_

- [x] 4.5 Update financial summary widget
  - Display total expenses, revenue, and balance
  - Format currency properly
  - Add trend indicators if applicable
  - Handle zero balance state
  - _Requirements: 2.6_

- [x] 4.6 Write unit tests for dashboard components
  - Test stat cards render with correct data
  - Test recent tasks widget with various data states
  - Test upcoming harvests widget
  - Test financial summary widget
  - Test error states and loading states
  - _Requirements: 5.2, 15_

- [ ] 5. Integration Testing and Documentation
- [x] 5.1 Write integration test for dashboard API
  - Test GET /api/dashboard/summary with authenticated user
  - Verify response structure matches schema
  - Test with empty database (new user)
  - Test with populated database
  - Test error cases (invalid auth, database error)
  - _Requirements: 5.3, 16, 17_

- [x] 5.2 Update API documentation
  - Create `docs/api/dashboard.md`
  - Document GET /api/dashboard/summary endpoint
  - Include request/response examples
  - Document error responses
  - Add sample curl commands
  - _Requirements: 20.1_

- [x] 5.3 Run accessibility audit on dashboard
  - Run axe-core or Lighthouse accessibility check
  - Fix any violations found
  - Verify keyboard navigation works
  - Test with screen reader
  - _Requirements: 17.1, 17.4, 17.5_

- [x] 6. Checkpoint - Dashboard Complete
  - Ensure all tests pass (`pnpm test`)
  - Verify build succeeds (`pnpm build`)
  - Confirm no TypeScript errors (`tsc --noEmit`)
  - Verify no ESLint errors (`pnpm lint`)
  - Check test coverage ≥90% for dashboard modules
  - Manually test dashboard in browser
  - Ask user if questions arise

## Phase 2: Crops Page (Priority 2)

- [ ] 7. Crops Page Baseline and Audit
- [ ] 7.1 Audit crops page components
  - Inspect `src/app/crops/page.tsx` and related components
  - Identify all API calls and mock data usage
  - Document CRUD operations needed
  - List components to consolidate
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 8. Crops API Implementation
- [ ] 8.1 Create Zod validation schemas for crops
  - Create `src/lib/validations/crop.ts`
  - Define `CreateCropSchema`, `UpdateCropSchema`, `CropResponseSchema`
  - Add validation for dates, status enum, optional fields
  - Export TypeScript types
  - _Requirements: 3.2, 3.3, 6.2_

- [ ] 8.2 Implement crop repository
