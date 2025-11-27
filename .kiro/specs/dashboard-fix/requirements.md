# Requirements for Dashboard Fix

1. The `/api/dashboard/summary` route must accept requests with missing query params without returning a 400.
2. `startDate` and `endDate` should remain optional; absent values should be treated as `undefined`.
3. `includeInactive` query param must accept `true` or `false` string values and convert them to booleans for validation.
4. Validation errors from Zod must return a 400 with meaningful field error details.
5. No secrets or environment-specific values should be committed. If `.env` needs manual fixes, document the steps rather than committing secrets.

Notes
- This change focuses on input normalization only. Any schema updates are out-of-scope for this patch.
