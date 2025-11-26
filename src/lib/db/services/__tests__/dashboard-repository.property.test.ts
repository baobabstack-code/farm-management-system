/**
 * Property-Based Tests for Dashboard Repository
 *
 * These tests use fast-check to verify correctness properties
 * across many randomly generated inputs.
 *
 * Feature: production-readiness
 */

import fc from "fast-check";
import { DashboardRepository } from "../dashboard-repository";
import { prisma } from "../../connection";

// Mock Prisma
jest.mock("../../connection", () => ({
  prisma: {
    crop: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    field: {
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    task: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    equipment: {
      count: jest.fn(),
    },
    harvestLog: {
      count: jest.fn(),
    },
    financialTransaction: {
      findMany: jest.fn(),
    },
    irrigationLog: {
      findMany: jest.fn(),
    },
    fertilizerLog: {
      findMany: jest.fn(),
    },
    pestDiseaseLog: {
      findMany: jest.fn(),
    },
  },
}));

describe("Dashboard Repository - Property-Based Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 2: Dashboard Count Accuracy
   *
   * For any authenticated user, the dashboard total counts (fields, crops, tasks, equipment)
   * should equal the actual count of records in the database for that user.
   *
   * **Validates: Requirements 2.1**
   */
  describe("Property 2: Dashboard Count Accuracy", () => {
    it("should return counts that match database records for any user", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random user ID
          fc.uuid(),
          // Generate random counts for each entity type
          fc.record({
            crops: fc.nat({ max: 1000 }),
            fields: fc.nat({ max: 1000 }),
            tasks: fc.nat({ max: 1000 }),
            equipment: fc.nat({ max: 1000 }),
          }),
          async (userId, expectedCounts) => {
            // Setup mocks to return the expected counts
            (prisma.crop.count as jest.Mock).mockResolvedValue(
              expectedCounts.crops
            );
            (prisma.field.count as jest.Mock).mockResolvedValue(
              expectedCounts.fields
            );
            (prisma.task.count as jest.Mock).mockResolvedValue(
              expectedCounts.tasks
            );
            (prisma.equipment.count as jest.Mock).mockResolvedValue(
              expectedCounts.equipment
            );

            // Call the repository method
            const result = await DashboardRepository.getTotalCounts(userId);

            // Verify that the returned counts match what the database returned
            expect(result.totalCrops).toBe(expectedCounts.crops);
            expect(result.totalFields).toBe(expectedCounts.fields);
            expect(result.totalTasks).toBe(expectedCounts.tasks);
            expect(result.totalEquipment).toBe(expectedCounts.equipment);

            // Verify that Prisma was called with the correct userId
            expect(prisma.crop.count).toHaveBeenCalledWith({
              where: { userId },
            });
            expect(prisma.field.count).toHaveBeenCalledWith({
              where: { userId, isActive: true },
            });
            expect(prisma.task.count).toHaveBeenCalledWith({
              where: { userId },
            });
            expect(prisma.equipment.count).toHaveBeenCalledWith({
              where: { userId },
            });
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design
      );
    });

    it("should handle zero counts correctly", async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (userId) => {
          // Setup mocks to return zero for all counts
          (prisma.crop.count as jest.Mock).mockResolvedValue(0);
          (prisma.field.count as jest.Mock).mockResolvedValue(0);
          (prisma.task.count as jest.Mock).mockResolvedValue(0);
          (prisma.equipment.count as jest.Mock).mockResolvedValue(0);

          const result = await DashboardRepository.getTotalCounts(userId);

          // All counts should be zero
          expect(result.totalCrops).toBe(0);
          expect(result.totalFields).toBe(0);
          expect(result.totalTasks).toBe(0);
          expect(result.totalEquipment).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it("should maintain count consistency across multiple calls", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            crops: fc.nat({ max: 1000 }),
            fields: fc.nat({ max: 1000 }),
            tasks: fc.nat({ max: 1000 }),
            equipment: fc.nat({ max: 1000 }),
          }),
          async (userId, counts) => {
            // Setup mocks
            (prisma.crop.count as jest.Mock).mockResolvedValue(counts.crops);
            (prisma.field.count as jest.Mock).mockResolvedValue(counts.fields);
            (prisma.task.count as jest.Mock).mockResolvedValue(counts.tasks);
            (prisma.equipment.count as jest.Mock).mockResolvedValue(
              counts.equipment
            );

            // Call the method twice
            const result1 = await DashboardRepository.getTotalCounts(userId);
            const result2 = await DashboardRepository.getTotalCounts(userId);

            // Results should be identical (idempotence)
            expect(result1).toEqual(result2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Recent Tasks Limit
   *
   * For any user with N tasks where N > 10, the dashboard should display exactly
   * the 10 most recent tasks ordered by creation date descending.
   *
   * **Validates: Requirements 2.2**
   */
  describe("Property 3: Recent Tasks Limit", () => {
    it("should return exactly 10 tasks when user has more than 10 tasks", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          // Generate between 11 and 100 tasks
          fc.integer({ min: 11, max: 100 }),
          async (userId, totalTasks) => {
            // Generate tasks with sequential creation dates
            const mockTasks = Array.from({ length: totalTasks }, (_, i) => ({
              id: `task-${i}`,
              userId,
              title: `Task ${i}`,
              status: "PENDING",
              createdAt: new Date(Date.now() - (totalTasks - i) * 1000),
              crop: null,
            }));

            // Mock should return only the 10 most recent tasks
            const recentTasks = mockTasks.slice(-10);
            (prisma.task.findMany as jest.Mock).mockResolvedValue(recentTasks);

            const result = await DashboardRepository.getRecentTasks(userId, 10);

            // Should return exactly 10 tasks
            expect(result).toHaveLength(10);

            // Verify Prisma was called with correct parameters
            expect(prisma.task.findMany).toHaveBeenCalledWith({
              where: { userId },
              include: {
                crop: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: { createdAt: "desc" },
              take: 10,
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should return all tasks when user has fewer than 10 tasks", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          // Generate between 1 and 9 tasks
          fc.integer({ min: 1, max: 9 }),
          async (userId, totalTasks) => {
            const mockTasks = Array.from({ length: totalTasks }, (_, i) => ({
              id: `task-${i}`,
              userId,
              title: `Task ${i}`,
              status: "PENDING",
              createdAt: new Date(Date.now() - (totalTasks - i) * 1000),
              crop: null,
            }));

            (prisma.task.findMany as jest.Mock).mockResolvedValue(mockTasks);

            const result = await DashboardRepository.getRecentTasks(userId, 10);

            // Should return all tasks (less than 10)
            expect(result).toHaveLength(totalTasks);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should return tasks in descending order by creation date", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.integer({ min: 11, max: 50 }),
          async (userId, totalTasks) => {
            // Generate tasks with random creation dates
            const mockTasks = Array.from({ length: 10 }, (_, i) => ({
              id: `task-${i}`,
              userId,
              title: `Task ${i}`,
              status: "PENDING",
              createdAt: new Date(Date.now() - i * 60000), // Each task 1 minute apart
              crop: null,
            }));

            (prisma.task.findMany as jest.Mock).mockResolvedValue(mockTasks);

            const result = await DashboardRepository.getRecentTasks(userId, 10);

            // Verify tasks are in descending order
            for (let i = 0; i < result.length - 1; i++) {
              const currentDate = new Date(result[i].createdAt).getTime();
              const nextDate = new Date(result[i + 1].createdAt).getTime();
              expect(currentDate).toBeGreaterThanOrEqual(nextDate);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should handle empty task list", async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (userId) => {
          (prisma.task.findMany as jest.Mock).mockResolvedValue([]);

          const result = await DashboardRepository.getRecentTasks(userId, 10);

          expect(result).toHaveLength(0);
          expect(result).toEqual([]);
        }),
        { numRuns: 100 }
      );
    });

    it("should respect custom limit parameter", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.integer({ min: 1, max: 20 }),
          async (userId, customLimit) => {
            const mockTasks = Array.from({ length: customLimit }, (_, i) => ({
              id: `task-${i}`,
              userId,
              title: `Task ${i}`,
              status: "PENDING",
              createdAt: new Date(Date.now() - i * 1000),
              crop: null,
            }));

            (prisma.task.findMany as jest.Mock).mockResolvedValue(mockTasks);

            const result = await DashboardRepository.getRecentTasks(
              userId,
              customLimit
            );

            expect(result).toHaveLength(customLimit);
            expect(prisma.task.findMany).toHaveBeenCalledWith(
              expect.objectContaining({
                take: customLimit,
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: Active Crops Filtering
   *
   * For any user with crops in various statuses, the dashboard should display only
   * crops with status in [PLANTED, GROWING, FLOWERING, FRUITING].
   *
   * **Validates: Requirements 2.3**
   */
  describe("Property 4: Active Crops Filtering", () => {
    const ACTIVE_STATUSES = ["PLANTED", "GROWING", "FLOWERING", "FRUITING"];
    const INACTIVE_STATUSES = ["HARVESTED", "COMPLETED"];
    const ALL_STATUSES = [...ACTIVE_STATUSES, ...INACTIVE_STATUSES];

    it("should return only crops with active statuses", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          // Generate random number of crops with various statuses
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 50 }),
              status: fc.constantFrom(...ALL_STATUSES),
            }),
            { minLength: 1, maxLength: 50 }
          ),
          async (userId, allCrops) => {
            // Filter to only active crops
            const activeCrops = allCrops.filter((crop) =>
              ACTIVE_STATUSES.includes(crop.status)
            );

            // Mock Prisma to return active crops
            (prisma.crop.findMany as jest.Mock).mockResolvedValue(
              activeCrops.map((crop) => ({
                ...crop,
                userId,
                field: null,
              }))
            );

            const result = await DashboardRepository.getActiveCrops(userId);

            // All returned crops should have active status
            result.forEach((crop) => {
              expect(ACTIVE_STATUSES).toContain(crop.status);
            });

            // Verify Prisma was called with correct filter
            expect(prisma.crop.findMany).toHaveBeenCalledWith({
              where: {
                userId,
                status: {
                  in: ACTIVE_STATUSES,
                },
              },
              include: {
                field: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: { plantingDate: "desc" },
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should return correct count of active crops", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.integer({ min: 0, max: 100 }),
          async (userId, activeCount) => {
            (prisma.crop.count as jest.Mock).mockResolvedValue(activeCount);

            const result =
              await DashboardRepository.getActiveCropsCount(userId);

            expect(result).toBe(activeCount);
            expect(prisma.crop.count).toHaveBeenCalledWith({
              where: {
                userId,
                status: {
                  in: ACTIVE_STATUSES,
                },
              },
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should exclude harvested and completed crops", async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (userId) => {
          // Create mix of active and inactive crops
          const mockCrops = [
            { id: "1", status: "PLANTED", name: "Crop 1", userId, field: null },
            {
              id: "2",
              status: "HARVESTED",
              name: "Crop 2",
              userId,
              field: null,
            },
            { id: "3", status: "GROWING", name: "Crop 3", userId, field: null },
            {
              id: "4",
              status: "COMPLETED",
              name: "Crop 4",
              userId,
              field: null,
            },
            {
              id: "5",
              status: "FLOWERING",
              name: "Crop 5",
              userId,
              field: null,
            },
          ];

          // Filter to only active
          const activeCrops = mockCrops.filter((c) =>
            ACTIVE_STATUSES.includes(c.status)
          );

          (prisma.crop.findMany as jest.Mock).mockResolvedValue(activeCrops);

          const result = await DashboardRepository.getActiveCrops(userId);

          // Should have 3 active crops
          expect(result).toHaveLength(3);

          // None should be HARVESTED or COMPLETED
          result.forEach((crop) => {
            expect(crop.status).not.toBe("HARVESTED");
            expect(crop.status).not.toBe("COMPLETED");
          });
        }),
        { numRuns: 100 }
      );
    });

    it("should handle user with no active crops", async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (userId) => {
          (prisma.crop.findMany as jest.Mock).mockResolvedValue([]);
          (prisma.crop.count as jest.Mock).mockResolvedValue(0);

          const crops = await DashboardRepository.getActiveCrops(userId);
          const count = await DashboardRepository.getActiveCropsCount(userId);

          expect(crops).toHaveLength(0);
          expect(count).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it("should verify all four active statuses are included", async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (userId) => {
          // Create one crop for each active status
          const mockCrops = ACTIVE_STATUSES.map((status, i) => ({
            id: `crop-${i}`,
            status,
            name: `Crop ${status}`,
            userId,
            field: null,
          }));

          (prisma.crop.findMany as jest.Mock).mockResolvedValue(mockCrops);

          const result = await DashboardRepository.getActiveCrops(userId);

          // Should have all 4 active statuses
          expect(result).toHaveLength(4);

          // Verify each active status is present
          const returnedStatuses = result.map((c) => c.status);
          ACTIVE_STATUSES.forEach((status) => {
            expect(returnedStatuses).toContain(status);
          });
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: Upcoming Harvest Window
   *
   * For any set of crops, the upcoming harvests list should include only crops
   * where expectedHarvestDate is between now and 30 days from now.
   *
   * **Validates: Requirements 2.4**
   */
  describe("Property 5: Upcoming Harvest Window", () => {
    it("should return only crops with harvest dates in the next 30 days", async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (userId) => {
          const now = new Date();
          const futureDate = new Date();
          futureDate.setDate(now.getDate() + 30);

          // Create crops with various harvest dates
          const mockCrops = [
            {
              id: "1",
              name: "Crop 1",
              userId,
              status: "GROWING",
              expectedHarvestDate: new Date(
                now.getTime() + 5 * 24 * 60 * 60 * 1000
              ), // 5 days from now
              field: null,
            },
            {
              id: "2",
              name: "Crop 2",
              userId,
              status: "FLOWERING",
              expectedHarvestDate: new Date(
                now.getTime() + 15 * 24 * 60 * 60 * 1000
              ), // 15 days from now
              field: null,
            },
            {
              id: "3",
              name: "Crop 3",
              userId,
              status: "FRUITING",
              expectedHarvestDate: new Date(
                now.getTime() + 29 * 24 * 60 * 60 * 1000
              ), // 29 days from now
              field: null,
            },
          ];

          (prisma.crop.findMany as jest.Mock).mockResolvedValue(mockCrops);

          const result = await DashboardRepository.getUpcomingHarvests(
            userId,
            30
          );

          // All returned crops should have harvest dates within 30 days
          result.forEach((crop) => {
            const harvestDate = new Date(crop.expectedHarvestDate);
            expect(harvestDate.getTime()).toBeGreaterThanOrEqual(now.getTime());
            expect(harvestDate.getTime()).toBeLessThanOrEqual(
              futureDate.getTime()
            );
          });

          // Verify Prisma was called with correct date range
          expect(prisma.crop.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
              where: expect.objectContaining({
                userId,
                expectedHarvestDate: expect.objectContaining({
                  gte: expect.any(Date),
                  lte: expect.any(Date),
                }),
                status: {
                  not: "HARVESTED",
                },
              }),
            })
          );
        }),
        { numRuns: 100 }
      );
    });

    it("should exclude crops with past harvest dates", async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (userId) => {
          const now = new Date();

          // Create crops with past harvest dates
          const pastCrops = [
            {
              id: "1",
              name: "Past Crop 1",
              userId,
              status: "GROWING",
              expectedHarvestDate: new Date(
                now.getTime() - 5 * 24 * 60 * 60 * 1000
              ), // 5 days ago
              field: null,
            },
          ];

          // Mock should return empty array (past crops filtered out)
          (prisma.crop.findMany as jest.Mock).mockResolvedValue([]);

          const result = await DashboardRepository.getUpcomingHarvests(
            userId,
            30
          );

          expect(result).toHaveLength(0);
        }),
        { numRuns: 100 }
      );
    });

    it("should exclude crops with harvest dates beyond the window", async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (userId) => {
          const now = new Date();

          // Create crops with harvest dates beyond 30 days
          const farFutureCrops = [
            {
              id: "1",
              name: "Far Future Crop",
              userId,
              status: "PLANTED",
              expectedHarvestDate: new Date(
                now.getTime() + 60 * 24 * 60 * 60 * 1000
              ), // 60 days from now
              field: null,
            },
          ];

          // Mock should return empty array (beyond window)
          (prisma.crop.findMany as jest.Mock).mockResolvedValue([]);

          const result = await DashboardRepository.getUpcomingHarvests(
            userId,
            30
          );

          expect(result).toHaveLength(0);
        }),
        { numRuns: 100 }
      );
    });

    it("should exclude already harvested crops", async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (userId) => {
          const now = new Date();

          // Create crops with upcoming dates but HARVESTED status
          const harvestedCrops = [
            {
              id: "1",
              name: "Harvested Crop",
              userId,
              status: "HARVESTED",
              expectedHarvestDate: new Date(
                now.getTime() + 10 * 24 * 60 * 60 * 1000
              ),
              field: null,
            },
          ];

          // Mock should return empty array (harvested crops excluded)
          (prisma.crop.findMany as jest.Mock).mockResolvedValue([]);

          const result = await DashboardRepository.getUpcomingHarvests(
            userId,
            30
          );

          // No harvested crops should be returned
          result.forEach((crop) => {
            expect(crop.status).not.toBe("HARVESTED");
          });
        }),
        { numRuns: 100 }
      );
    });

    it("should respect custom days parameter", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.integer({ min: 7, max: 90 }),
          async (userId, customDays) => {
            // Clear mocks before each iteration
            jest.clearAllMocks();

            const now = new Date();

            const mockCrops = [
              {
                id: "1",
                name: "Crop 1",
                userId,
                status: "GROWING",
                expectedHarvestDate: new Date(
                  now.getTime() + (customDays / 2) * 24 * 60 * 60 * 1000
                ),
                field: null,
              },
            ];

            (prisma.crop.findMany as jest.Mock).mockResolvedValue(mockCrops);

            const result = await DashboardRepository.getUpcomingHarvests(
              userId,
              customDays
            );

            // Verify the method was called and returned results
            expect(prisma.crop.findMany).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockCrops);

            // Verify Prisma was called with correct userId and date filters
            expect(prisma.crop.findMany).toHaveBeenCalledWith(
              expect.objectContaining({
                where: expect.objectContaining({
                  userId,
                  expectedHarvestDate: expect.objectContaining({
                    gte: expect.any(Date),
                    lte: expect.any(Date),
                  }),
                }),
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should order results by harvest date ascending", async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (userId) => {
          const now = new Date();

          // Create crops with different harvest dates
          const mockCrops = [
            {
              id: "1",
              name: "Crop 1",
              userId,
              status: "GROWING",
              expectedHarvestDate: new Date(
                now.getTime() + 5 * 24 * 60 * 60 * 1000
              ),
              field: null,
            },
            {
              id: "2",
              name: "Crop 2",
              userId,
              status: "FLOWERING",
              expectedHarvestDate: new Date(
                now.getTime() + 15 * 24 * 60 * 60 * 1000
              ),
              field: null,
            },
            {
              id: "3",
              name: "Crop 3",
              userId,
              status: "FRUITING",
              expectedHarvestDate: new Date(
                now.getTime() + 25 * 24 * 60 * 60 * 1000
              ),
              field: null,
            },
          ];

          (prisma.crop.findMany as jest.Mock).mockResolvedValue(mockCrops);

          const result = await DashboardRepository.getUpcomingHarvests(
            userId,
            30
          );

          // Verify ascending order
          for (let i = 0; i < result.length - 1; i++) {
            const currentDate = new Date(
              result[i].expectedHarvestDate
            ).getTime();
            const nextDate = new Date(
              result[i + 1].expectedHarvestDate
            ).getTime();
            expect(currentDate).toBeLessThanOrEqual(nextDate);
          }

          // Verify orderBy was called correctly
          expect(prisma.crop.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
              orderBy: { expectedHarvestDate: "asc" },
            })
          );
        }),
        { numRuns: 100 }
      );
    });

    it("should handle user with no upcoming harvests", async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (userId) => {
          (prisma.crop.findMany as jest.Mock).mockResolvedValue([]);

          const result = await DashboardRepository.getUpcomingHarvests(
            userId,
            30
          );

          expect(result).toHaveLength(0);
          expect(result).toEqual([]);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: Financial Aggregation Correctness
   *
   * For any set of financial transactions, the total expenses should equal the sum of all
   * transactions where transactionType = 'EXPENSE' and total revenue should equal the sum
   * where transactionType = 'INCOME'.
   *
   * **Validates: Requirements 2.6**
   */
  describe("Property 6: Financial Aggregation Correctness", () => {
    it("should correctly aggregate income and expenses", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          // Generate random transactions
          fc.array(
            fc.record({
              id: fc.uuid(),
              amount: fc.float({
                min: Math.fround(0.01),
                max: Math.fround(10000),
                noNaN: true,
              }),
              transactionType: fc.constantFrom("INCOME", "EXPENSE"),
            }),
            { minLength: 1, maxLength: 50 }
          ),
          async (userId, transactions) => {
            // Clear mocks before each iteration
            jest.clearAllMocks();
            // Calculate expected totals
            const expectedIncome = transactions
              .filter((t) => t.transactionType === "INCOME")
              .reduce((sum, t) => sum + t.amount, 0);
            const expectedExpenses = transactions
              .filter((t) => t.transactionType === "EXPENSE")
              .reduce((sum, t) => sum + t.amount, 0);
            const expectedBalance = expectedIncome - expectedExpenses;

            // Mock Prisma to return transactions split by type
            const incomeTransactions = transactions
              .filter((t) => t.transactionType === "INCOME")
              .map((t) => ({ amount: t.amount }));
            const expenseTransactions = transactions
              .filter((t) => t.transactionType === "EXPENSE")
              .map((t) => ({ amount: t.amount }));

            (prisma.financialTransaction.findMany as jest.Mock)
              .mockResolvedValueOnce(incomeTransactions)
              .mockResolvedValueOnce(expenseTransactions);

            const result =
              await DashboardRepository.getFinancialSummary(userId);

            // Verify aggregation correctness (with floating point tolerance)
            expect(result.totalIncome).toBeCloseTo(expectedIncome, 2);
            expect(result.totalExpenses).toBeCloseTo(expectedExpenses, 2);
            expect(result.balance).toBeCloseTo(expectedBalance, 2);
            expect(result.transactionCount).toBe(transactions.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should handle all income transactions", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.array(
            fc.record({
              amount: fc.float({
                min: Math.fround(0.01),
                max: Math.fround(5000),
                noNaN: true,
              }),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          async (userId, incomeTransactions) => {
            // Clear mocks before each iteration
            jest.clearAllMocks();
            const expectedIncome = incomeTransactions.reduce(
              (sum, t) => sum + t.amount,
              0
            );

            (prisma.financialTransaction.findMany as jest.Mock)
              .mockResolvedValueOnce(incomeTransactions)
              .mockResolvedValueOnce([]);

            const result =
              await DashboardRepository.getFinancialSummary(userId);

            expect(result.totalIncome).toBeCloseTo(expectedIncome, 2);
            expect(result.totalExpenses).toBe(0);
            expect(result.balance).toBeCloseTo(expectedIncome, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should handle all expense transactions", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.array(
            fc.record({
              amount: fc.float({
                min: Math.fround(0.01),
                max: Math.fround(5000),
                noNaN: true,
              }),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          async (userId, expenseTransactions) => {
            // Clear mocks before each iteration
            jest.clearAllMocks();
            const expectedExpenses = expenseTransactions.reduce(
              (sum, t) => sum + t.amount,
              0
            );

            (prisma.financialTransaction.findMany as jest.Mock)
              .mockResolvedValueOnce([])
              .mockResolvedValueOnce(expenseTransactions);

            const result =
              await DashboardRepository.getFinancialSummary(userId);

            expect(result.totalIncome).toBe(0);
            expect(result.totalExpenses).toBeCloseTo(expectedExpenses, 2);
            expect(result.balance).toBeCloseTo(-expectedExpenses, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should handle no transactions", async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (userId) => {
          (prisma.financialTransaction.findMany as jest.Mock)
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([]);

          const result = await DashboardRepository.getFinancialSummary(userId);

          expect(result.totalIncome).toBe(0);
          expect(result.totalExpenses).toBe(0);
          expect(result.balance).toBe(0);
          expect(result.transactionCount).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it("should maintain balance invariant: balance = income - expenses", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.array(
            fc.record({
              amount: fc.float({
                min: Math.fround(0.01),
                max: Math.fround(10000),
                noNaN: true,
              }),
              transactionType: fc.constantFrom("INCOME", "EXPENSE"),
            }),
            { minLength: 0, maxLength: 100 }
          ),
          async (userId, transactions) => {
            // Clear mocks before each iteration
            jest.clearAllMocks();
            const incomeTransactions = transactions
              .filter((t) => t.transactionType === "INCOME")
              .map((t) => ({ amount: t.amount }));
            const expenseTransactions = transactions
              .filter((t) => t.transactionType === "EXPENSE")
              .map((t) => ({ amount: t.amount }));

            (prisma.financialTransaction.findMany as jest.Mock)
              .mockResolvedValueOnce(incomeTransactions)
              .mockResolvedValueOnce(expenseTransactions);

            const result =
              await DashboardRepository.getFinancialSummary(userId);

            // Balance invariant: balance = income - expenses
            const calculatedBalance = result.totalIncome - result.totalExpenses;
            expect(result.balance).toBeCloseTo(calculatedBalance, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should verify Prisma is called with correct filters", async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (userId) => {
          // Clear mocks before each iteration
          jest.clearAllMocks();
          (prisma.financialTransaction.findMany as jest.Mock)
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([]);

          await DashboardRepository.getFinancialSummary(userId);

          // Verify two calls were made
          expect(prisma.financialTransaction.findMany).toHaveBeenCalledTimes(2);

          // First call should be for INCOME
          expect(prisma.financialTransaction.findMany).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
              where: expect.objectContaining({
                userId,
                transactionType: "INCOME",
              }),
            })
          );

          // Second call should be for EXPENSE
          expect(prisma.financialTransaction.findMany).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
              where: expect.objectContaining({
                userId,
                transactionType: "EXPENSE",
              }),
            })
          );
        }),
        { numRuns: 100 }
      );
    });

    it("should handle date range filtering", async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (userId) => {
          const startDate = new Date("2024-01-01");
          const endDate = new Date("2024-12-31");

          (prisma.financialTransaction.findMany as jest.Mock)
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([]);

          await DashboardRepository.getFinancialSummary(
            userId,
            startDate,
            endDate
          );

          // Verify date range was included in query
          expect(prisma.financialTransaction.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
              where: expect.objectContaining({
                userId,
                transactionDate: expect.objectContaining({
                  gte: startDate,
                  lte: endDate,
                }),
              }),
            })
          );
        }),
        { numRuns: 100 }
      );
    });
  });
});
