# Database Seed Script

## Overview

This seed script creates comprehensive test data for FarmFlow development and testing. It populates the database with realistic sample data including fields, crops, tasks, activity logs, equipment, and financial transactions.

## ⚠️ IMPORTANT

**This is for DEVELOPMENT ONLY!**  
Never run this script in production as it will delete existing test data and create sample records.

## Installation

First, install ts-node as a dev dependency:

```bash
pnpm add -D ts-node
```

## Usage

### Method 1: Using Prisma CLI (Recommended)

```bash
npx prisma db seed
```

### Method 2: Direct Execution

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

### Method 3: After Migration

The seed script will automatically run after migrations if configured in package.json:

```bash
npx prisma migrate dev
```

## What Gets Created

### Test User

- **User ID**: `user_test_dashboard_123`
- Replace this with your actual Clerk user ID for testing

### Fields (3)

1. **North Field** - 25.5 acres, loamy soil, drip irrigation
2. **South Field** - 12.3 acres, sandy loam, sprinkler irrigation
3. **East Field** - 18.7 acres, clay loam, flood irrigation

### Crops (6)

1. **Tomatoes** (Beefsteak) - Growing, 5.2 acres
2. **Corn** (Sweet Corn) - Planted, 10.5 acres
3. **Lettuce** (Romaine) - Flowering, 3.8 acres
4. **Carrots** (Nantes) - Fruiting, 4.2 acres
5. **Wheat** (Hard Red Winter) - Growing, 15.0 acres
6. **Strawberries** (June-bearing) - Harvested, 2.5 acres

### Tasks (6)

- 3 Pending tasks (including 1 overdue)
- 1 In Progress task
- 2 Completed tasks

### Activity Logs

- **15 Irrigation Logs** - Various dates, methods, and water amounts
- **10 Fertilizer Logs** - Different fertilizer types and application methods
- **8 Pest/Disease Logs** - Mix of pest and disease incidents
- **5 Harvest Logs** - Multiple strawberry harvest sessions

### Equipment (3)

1. **John Deere 5075E Tractor** - Active, 1250 hours, needs service soon
2. **Disc Harrow** - Active, excellent condition
3. **Boom Sprayer** - In maintenance, fair condition

### Financial Data

- **2 Accounts**:
  - Farm Operating Account (Checking) - $45,000 balance
  - Farm Savings (Savings) - $125,000 balance

- **23 Transactions**:
  - 8 Income transactions ($1,000-$10,000 each)
  - 15 Expense transactions ($100-$3,000 each)

## Data Characteristics

### Realistic Dates

- Crops planted 1-4 months ago
- Tasks due in past, present, and future
- Activity logs spread over last 30-90 days
- Financial transactions over last 90 days

### Variety

- Multiple crop statuses (PLANTED, GROWING, FLOWERING, FRUITING, HARVESTED)
- Different task priorities (LOW, MEDIUM, HIGH, URGENT)
- Various task statuses (PENDING, IN_PROGRESS, COMPLETED)
- Mixed payment statuses (PAID, PENDING)

### Dashboard Testing

The seed data is specifically designed to test dashboard features:

- ✅ Total counts (fields, crops, tasks, equipment)
- ✅ Active vs. inactive filtering
- ✅ Overdue task detection
- ✅ Recent harvest tracking
- ✅ Financial aggregation (income vs. expenses)
- ✅ Resource usage statistics
- ✅ Pest/disease incident tracking

## Customization

### Change Test User ID

Edit `prisma/seed.ts` and update:

```typescript
const TEST_USER_ID = "your_clerk_user_id_here";
```

### Adjust Data Quantities

Modify the loop counts in the seed functions:

```typescript
// Create more irrigation logs
for (let i = 0; i < 30; i++) {
  // Change from 15 to 30
  // ...
}
```

### Add More Crops

Add additional crop entries in the `createCrops` function:

```typescript
crops.push(
  await prisma.crop.create({
    data: {
      userId: TEST_USER_ID,
      fieldId: fields[0].id,
      name: "Peppers",
      variety: "Bell Pepper",
      // ... other fields
    },
  })
);
```

## Cleanup

The seed script automatically cleans up existing test data before creating new records. This ensures:

- No duplicate data
- Fresh start each time
- Consistent test environment

### Manual Cleanup

To manually remove all test data:

```sql
-- Run in your database client
DELETE FROM harvest_logs WHERE "userId" = 'user_test_dashboard_123';
DELETE FROM pest_disease_logs WHERE "userId" = 'user_test_dashboard_123';
DELETE FROM fertilizer_logs WHERE "userId" = 'user_test_dashboard_123';
DELETE FROM irrigation_logs WHERE "userId" = 'user_test_dashboard_123';
DELETE FROM tasks WHERE "userId" = 'user_test_dashboard_123';
DELETE FROM financial_transactions WHERE "userId" = 'user_test_dashboard_123';
DELETE FROM financial_accounts WHERE "userId" = 'user_test_dashboard_123';
DELETE FROM crops WHERE "userId" = 'user_test_dashboard_123';
DELETE FROM fields WHERE "userId" = 'user_test_dashboard_123';
DELETE FROM equipment WHERE "userId" = 'user_test_dashboard_123';
```

## Troubleshooting

### Error: "Can't reach database server"

**Solution**: Check your `.env` file and ensure `DATABASE_URL` is correct:

```env
DATABASE_URL="postgresql://user:password@host:port/database"
```

### Error: "Module not found: ts-node"

**Solution**: Install ts-node:

```bash
pnpm add -D ts-node
```

### Error: "Foreign key constraint failed"

**Solution**: Ensure migrations are up to date:

```bash
npx prisma migrate dev
npx prisma generate
```

### Error: "Unique constraint failed"

**Solution**: The test user ID already exists. Either:

1. Change `TEST_USER_ID` in seed.ts
2. Run the cleanup queries above
3. The script will auto-cleanup on next run

## Testing the Seed Data

After seeding, verify the data:

### Check Record Counts

```sql
SELECT
  (SELECT COUNT(*) FROM fields WHERE "userId" = 'user_test_dashboard_123') as fields,
  (SELECT COUNT(*) FROM crops WHERE "userId" = 'user_test_dashboard_123') as crops,
  (SELECT COUNT(*) FROM tasks WHERE "userId" = 'user_test_dashboard_123') as tasks,
  (SELECT COUNT(*) FROM equipment WHERE "userId" = 'user_test_dashboard_123') as equipment;
```

Expected: 3 fields, 6 crops, 6 tasks, 3 equipment

### Test Dashboard API

```bash
# Replace with your actual user ID
curl http://localhost:3000/api/analytics \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

### Verify in UI

1. Start the dev server: `pnpm dev`
2. Sign in with the test user
3. Navigate to dashboard
4. Verify all widgets show data

## Integration with Tests

The seed data can be used for integration tests:

```typescript
// In your test file
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

beforeAll(async () => {
  // Seed runs automatically or manually trigger
  await import("../prisma/seed");
});

test("dashboard shows correct crop count", async () => {
  const crops = await prisma.crop.findMany({
    where: { userId: "user_test_dashboard_123" },
  });

  expect(crops).toHaveLength(6);
});
```

## Best Practices

1. **Always use a test user ID** - Never use production user IDs
2. **Run seed after schema changes** - Ensures data matches current schema
3. **Customize for your tests** - Adjust data to match your test scenarios
4. **Document changes** - If you modify the seed script, update this README
5. **Keep it realistic** - Use realistic dates, amounts, and relationships

## Next Steps

After seeding:

1. ✅ Verify data in database
2. ✅ Test dashboard loads correctly
3. ✅ Run integration tests
4. ✅ Test all CRUD operations
5. ✅ Verify analytics calculations

## Related Files

- `prisma/schema.prisma` - Database schema
- `prisma/seed.ts` - Seed script
- `package.json` - Seed configuration
- `.env` - Database connection string

## Support

If you encounter issues:

1. Check this README for troubleshooting
2. Verify database connection
3. Ensure migrations are up to date
4. Check Prisma logs for errors
5. Review the seed script for logic errors

---

**Remember**: This is development data only. Never run in production!
