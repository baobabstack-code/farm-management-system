# Dashboard Fix — Design

Purpose
- Ensure the dashboard API endpoint `/api/dashboard/summary` handles missing and typed query parameters robustly so validation doesn't fail with `400`.

Problem
- `URLSearchParams.get()` returns `null` for missing params. Passing `null` into validation schemas (Zod) can cause unexpected validation failures when schemas expect `string | undefined` or `boolean | undefined`.
- Boolean params like `includeInactive` are passed as strings (`"true"`/`"false"`) which fail boolean schema checks.

Design Goals
- Convert `null` to `undefined` before validation so optional fields are treated as absent.
- Convert boolean-like strings (`"true"`/`"false"`) to actual booleans before validation.
- Keep changes minimal and contained to the route handler; validation schema definitions remain unchanged.
- Add lightweight specs and tasks to document the change.

Implementation
- Read `startDate`, `endDate`, and `includeInactive` from `searchParams` into local `raw*` variables.
- Map `null` -> `undefined` for `startDate` and `endDate`.
- Map `"true"` -> `true`, `"false"` -> `false`, otherwise `undefined` for `includeInactive`.
- Pass normalized values to existing Zod validation helper `validateDashboardQueryParams`.

Testing
- Unit test cases should include missing params, `includeInactive=true`, `includeInactive=false`, and invalid date formats.
- Integration test should ensure the dashboard loads successfully for an authenticated user.
