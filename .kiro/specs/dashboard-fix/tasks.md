# Tasks — Dashboard Fix

- [x] Update route handler to normalize query parameters (`null` -> `undefined`).
- [x] Parse boolean `includeInactive` from string to boolean.
- [x] Add `.kiro` spec files documenting design, requirements, and tasks.
- [ ] Add unit/integration tests covering query param variations (optional follow-up).
- [ ] Confirm `.env` content locally and fix any CRLF or password issues (do not commit secrets).

Manual Steps for Deployers
- If dashboard still fails in production, check `DATABASE_URL` in runtime environment for correct credentials and carriage returns.
- Restart the application after `.env` corrections.
