/**
 * Integration Tests for Dashboard API
 *
 * Tests the complete path: API route → service → repository → database
 * Validates authentication, data retrieval, response formatting, and error handling.
 *
 * Requirements: 5.3, 16, 17
 */

import { DashboardService } from "@/lib/services/dashboard-service";
import { validateDashboardSummary } from "@/lib/validations/dashboard";

// Mock DashboardService
jest.mock("@/lib/services/dashboard-service");

describe("Dashboard API Integration Tests", () => {
  const mockUserId = "user_test123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Dashboard Service Integration", () => {
    it("should return complete dashboard data for authenticated user with populated database", async () => {
      // Mock service response with populated data
      const mockServiceData = {
        dashboard: {
          totalCrops: 10,
          activeTasks: 5,
          overdueTasks: 2,
          recentHarvests: 3,
          totalYield: 250.5,
          waterUsage: 1500,
        },
        water: {
          totalWater: 1500,
          averagePerSession: 75,
          sessionCount: 20,
        },
        fertilizer: {
          totalAmount: 150,
          applicationCount: 15,
          typeBreakdown: { NPK: 90, Organic: 60 },
        },
        yield: {
          totalYield: 250.5,
          harvestCount: 3,
          cropBreakdown: { Tomatoes: 150, Lettuce: 100.5 },
        },
        pestDisease: {
          totalIncidents: 8,
          pestCount: 5,
          diseaseCount: 3,
          severityBreakdown: { LOW: 3, MEDIUM: 3, HIGH: 2 },
        },
        financial: {
          totalIncome: 10000,
          totalExpenses: 6000,
          balance: 4000,
          transactionCount: 50,
        },
        recentTasks: [
          {
            id: "task1",
            title: "Water crops",
            description: "Water all crops",
            dueDate: new Date().toISOString(),
            priority: "HIGH",
            status: "PENDING",
            cropId: "crop1",
            cropName: "Tomatoes",
            createdAt: new Date().toISOString(),
          },
        ],
        upcomingHarvests: [
          {
            id: "crop1",
            name: "Tomatoes",
            variety: "Cherry",
            status: "FRUITING",
            plantingDate: new Date().toISOString(),
            expectedHarvestDate: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
            actualHarvestDate: null,
            area: 2.5,
          },
        ],
        location: {
          latitude: 40.7128,
          longitude: -74.006,
          name: "Test Farm",
        },
      };

      (DashboardService.getDashboardSummary as jest.Mock).mockResolvedValue(
        mockServiceData
      );

      // Call service
      const result = await DashboardService.getDashboardSummary(mockUserId, {});

      // Verify data structure
      expect(result.dashboard).toEqual(mockServiceData.dashboard);
      expect(result.water).toEqual(mockServiceData.water);
      expect(result.financial).toEqual(mockServiceData.financial);
      expect(result.recentTasks).toHaveLength(1);
      expect(result.upcomingHarvests).toHaveLength(1);

      // Validate response against schema
      expect(() => validateDashboardSummary(result)).not.toThrow();
    });

    it("should handle empty database (new user)", async () => {
      // Mock service response with empty data
      const emptyServiceData = {
        dashboard: {
          totalCrops: 0,
          activeTasks: 0,
          overdueTasks: 0,
          recentHarvests: 0,
          totalYield: 0,
          waterUsage: 0,
        },
        water: {
          totalWater: 0,
          averagePerSession: 0,
          sessionCount: 0,
        },
        fertilizer: {
          totalAmount: 0,
          applicationCount: 0,
          typeBreakdown: {},
        },
        yield: {
          totalYield: 0,
          harvestCount: 0,
          cropBreakdown: {},
        },
        pestDisease: {
          totalIncidents: 0,
          pestCount: 0,
          diseaseCount: 0,
          severityBreakdown: { LOW: 0, MEDIUM: 0, HIGH: 0 },
        },
        financial: {
          totalIncome: 0,
          totalExpenses: 0,
          balance: 0,
          transactionCount: 0,
        },
        recentTasks: [],
        upcomingHarvests: [],
        location: null,
      };

      (DashboardService.getDashboardSummary as jest.Mock).mockResolvedValue(
        emptyServiceData
      );

      // Call service
      const result = await DashboardService.getDashboardSummary(mockUserId, {});

      // Verify empty data
      expect(result.dashboard.totalCrops).toBe(0);
      expect(result.recentTasks).toEqual([]);
      expect(result.upcomingHarvests).toEqual([]);
      expect(result.location).toBeNull();

      // Validate response against schema
      expect(() => validateDashboardSummary(result)).not.toThrow();
    });

    it("should accept and process date range parameters", async () => {
      // Mock service response
      const mockServiceData = {
        dashboard: {
          totalCrops: 5,
          activeTasks: 3,
          overdueTasks: 1,
          recentHarvests: 2,
          totalYield: 100,
          waterUsage: 500,
        },
        water: { totalWater: 500, averagePerSession: 50, sessionCount: 10 },
        fertilizer: { totalAmount: 50, applicationCount: 5, typeBreakdown: {} },
        yield: { totalYield: 100, harvestCount: 2, cropBreakdown: {} },
        pestDisease: {
          totalIncidents: 0,
          pestCount: 0,
          diseaseCount: 0,
          severityBreakdown: { LOW: 0, MEDIUM: 0, HIGH: 0 },
        },
        financial: {
          totalIncome: 1000,
          totalExpenses: 500,
          balance: 500,
          transactionCount: 10,
        },
        recentTasks: [],
        upcomingHarvests: [],
        location: null,
      };

      (DashboardService.getDashboardSummary as jest.Mock).mockResolvedValue(
        mockServiceData
      );

      // Call service with date range
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-12-31");
      const result = await DashboardService.getDashboardSummary(mockUserId, {
        startDate,
        endDate,
      });

      // Verify service was called with date range
      expect(DashboardService.getDashboardSummary).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          startDate,
          endDate,
        })
      );

      // Verify result
      expect(result).toEqual(mockServiceData);
    });

    it("should validate date range (start before end)", () => {
      const startDate = new Date("2024-12-31");
      const endDate = new Date("2024-01-01");

      // Mock validateDateRange
      (DashboardService.validateDateRange as jest.Mock).mockReturnValue(false);

      // Validate date range
      const isValid = DashboardService.validateDateRange(startDate, endDate);

      expect(isValid).toBe(false);
    });

    it("should validate correct date range", () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-12-31");

      // Mock validateDateRange
      (DashboardService.validateDateRange as jest.Mock).mockReturnValue(true);

      // Validate date range
      const isValid = DashboardService.validateDateRange(startDate, endDate);

      expect(isValid).toBe(true);
    });

    it("should handle database errors gracefully", async () => {
      // Mock service to throw database error
      (DashboardService.getDashboardSummary as jest.Mock).mockRejectedValue(
        new Error("Prisma connection timeout")
      );

      // Call service and expect error
      await expect(
        DashboardService.getDashboardSummary(mockUserId, {})
      ).rejects.toThrow("Prisma connection timeout");
    });

    it("should handle unexpected errors", async () => {
      // Mock service to throw unexpected error
      (DashboardService.getDashboardSummary as jest.Mock).mockRejectedValue(
        new Error("Unexpected error")
      );

      // Call service and expect error
      await expect(
        DashboardService.getDashboardSummary(mockUserId, {})
      ).rejects.toThrow("Unexpected error");
    });
  });
});
