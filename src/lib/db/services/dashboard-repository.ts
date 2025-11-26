import { Prisma } from "@prisma/client";
import { prisma } from "../connection";

/**
 * Dashboard Repository
 *
 * Handles all database queries for the dashboard.
 * Uses Prisma with optimized queries and indexes.
 *
 * All methods are static and can be called directly:
 * DashboardRepository.getTotalCounts(userId)
 */
export class DashboardRepository {
  /**
   * Get total counts for dashboard metrics
   * Uses indexed queries for optimal performance
   */
  static async getTotalCounts(userId: string) {
    const [totalCrops, totalFields, totalTasks, totalEquipment] =
      await Promise.all([
        prisma.crop.count({
          where: { userId },
        }),
        prisma.field.count({
          where: { userId, isActive: true },
        }),
        prisma.task.count({
          where: { userId },
        }),
        prisma.equipment.count({
          where: { userId },
        }),
      ]);

    return {
      totalCrops,
      totalFields,
      totalTasks,
      totalEquipment,
    };
  }

  /**
   * Get active crops count
   * Active statuses: PLANTED, GROWING, FLOWERING, FRUITING
   */
  static async getActiveCropsCount(userId: string): Promise<number> {
    return prisma.crop.count({
      where: {
        userId,
        status: {
          in: ["PLANTED", "GROWING", "FLOWERING", "FRUITING"],
        },
      },
    });
  }

  /**
   * Get recent tasks (most recent N tasks)
   * Ordered by creation date descending
   */
  static async getRecentTasks(userId: string, limit: number = 10) {
    return prisma.task.findMany({
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
      take: limit,
    });
  }

  /**
   * Get active crops with details
   * Returns crops in active growth stages
   */
  static async getActiveCrops(userId: string) {
    return prisma.crop.findMany({
      where: {
        userId,
        status: {
          in: ["PLANTED", "GROWING", "FLOWERING", "FRUITING"],
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

  /**
   * Get upcoming harvests within specified days
   * Returns crops with harvest dates in the future within the window
   */
  static async getUpcomingHarvests(userId: string, days: number = 30) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    return prisma.crop.findMany({
      where: {
        userId,
        expectedHarvestDate: {
          gte: now,
          lte: futureDate,
        },
        status: {
          not: "HARVESTED",
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
      orderBy: { expectedHarvestDate: "asc" },
    });
  }

  /**
   * Get task statistics
   * Returns counts for pending, overdue, and completed tasks
   */
  static async getTaskStats(userId: string) {
    const now = new Date();

    const [pending, overdue, completed, inProgress] = await Promise.all([
      prisma.task.count({
        where: {
          userId,
          status: "PENDING",
        },
      }),
      prisma.task.count({
        where: {
          userId,
          status: "PENDING",
          dueDate: {
            lt: now,
          },
        },
      }),
      prisma.task.count({
        where: {
          userId,
          status: "COMPLETED",
        },
      }),
      prisma.task.count({
        where: {
          userId,
          status: "IN_PROGRESS",
        },
      }),
    ]);

    return {
      pending,
      overdue,
      completed,
      inProgress,
      active: pending + inProgress,
    };
  }

  /**
   * Get water usage statistics
   * Aggregates irrigation logs within date range
   */
  static async getWaterUsageStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const where: Prisma.IrrigationLogWhereInput = { userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const logs = await prisma.irrigationLog.findMany({
      where,
      select: {
        waterAmount: true,
        duration: true,
      },
    });

    const totalWater = logs.reduce((sum, log) => sum + log.waterAmount, 0);
    const sessionCount = logs.length;
    const averagePerSession = sessionCount > 0 ? totalWater / sessionCount : 0;

    return {
      totalWater,
      averagePerSession,
      sessionCount,
    };
  }

  /**
   * Get fertilizer usage statistics
   * Aggregates fertilizer logs with type breakdown
   */
  static async getFertilizerUsageStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const where: Prisma.FertilizerLogWhereInput = { userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const logs = await prisma.fertilizerLog.findMany({
      where,
      select: {
        amount: true,
        fertilizerType: true,
      },
    });

    const totalAmount = logs.reduce((sum, log) => sum + log.amount, 0);
    const applicationCount = logs.length;

    // Build type breakdown
    const typeBreakdown: Record<string, number> = {};
    logs.forEach((log) => {
      if (!typeBreakdown[log.fertilizerType]) {
        typeBreakdown[log.fertilizerType] = 0;
      }
      typeBreakdown[log.fertilizerType] += log.amount;
    });

    return {
      totalAmount,
      applicationCount,
      typeBreakdown,
    };
  }

  /**
   * Get yield statistics
   * Aggregates harvest logs with crop breakdown
   */
  static async getYieldStats(userId: string, startDate?: Date, endDate?: Date) {
    const where: Prisma.HarvestLogWhereInput = { userId };

    if (startDate || endDate) {
      where.harvestDate = {};
      if (startDate) where.harvestDate.gte = startDate;
      if (endDate) where.harvestDate.lte = endDate;
    }

    const logs = await prisma.harvestLog.findMany({
      where,
      select: {
        quantity: true,
        crop: {
          select: {
            name: true,
          },
        },
      },
    });

    const totalYield = logs.reduce((sum, log) => sum + log.quantity, 0);
    const harvestCount = logs.length;

    // Build crop breakdown
    const cropBreakdown: Record<string, number> = {};
    logs.forEach((log) => {
      const cropName = log.crop.name;
      if (!cropBreakdown[cropName]) {
        cropBreakdown[cropName] = 0;
      }
      cropBreakdown[cropName] += log.quantity;
    });

    return {
      totalYield,
      harvestCount,
      cropBreakdown,
    };
  }

  /**
   * Get pest and disease statistics
   * Aggregates pest/disease logs with severity breakdown
   */
  static async getPestDiseaseStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const where: Prisma.PestDiseaseLogWhereInput = { userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const logs = await prisma.pestDiseaseLog.findMany({
      where,
      select: {
        type: true,
        severity: true,
      },
    });

    const totalIncidents = logs.length;
    const pestCount = logs.filter((log) => log.type === "PEST").length;
    const diseaseCount = logs.filter((log) => log.type === "DISEASE").length;

    // Build severity breakdown
    const severityBreakdown: Record<string, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
    };
    logs.forEach((log) => {
      severityBreakdown[log.severity]++;
    });

    return {
      totalIncidents,
      pestCount,
      diseaseCount,
      severityBreakdown,
    };
  }

  /**
   * Get recent harvest count
   * Returns number of harvests in the last N days
   */
  static async getRecentHarvestCount(
    userId: string,
    days: number = 30
  ): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return prisma.harvestLog.count({
      where: {
        userId,
        harvestDate: {
          gte: startDate,
        },
      },
    });
  }

  /**
   * Get first field for location data
   * Returns the first active field with coordinates
   */
  static async getFirstFieldWithLocation(userId: string) {
    return prisma.field.findFirst({
      where: {
        userId,
        isActive: true,
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
      },
    });
  }

  /**
   * Get financial summary
   * Aggregates income and expenses from transactions
   */
  static async getFinancialSummary(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const where: Prisma.FinancialTransactionWhereInput = { userId };

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate.gte = startDate;
      if (endDate) where.transactionDate.lte = endDate;
    }

    const [incomeTransactions, expenseTransactions] = await Promise.all([
      prisma.financialTransaction.findMany({
        where: {
          ...where,
          transactionType: "INCOME",
        },
        select: {
          amount: true,
        },
      }),
      prisma.financialTransaction.findMany({
        where: {
          ...where,
          transactionType: "EXPENSE",
        },
        select: {
          amount: true,
        },
      }),
    ]);

    const totalIncome = incomeTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );
    const totalExpenses = expenseTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );
    const balance = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      balance,
      transactionCount: incomeTransactions.length + expenseTransactions.length,
    };
  }

  /**
   * Get all dashboard data in a single optimized query batch
   * This is the main method used by the dashboard API
   */
  static async getDashboardSummary(
    userId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      includeInactive?: boolean;
    }
  ) {
    const { startDate, endDate } = options || {};

    // Execute all queries in parallel for optimal performance
    const [
      counts,
      activeCropsCount,
      taskStats,
      recentTasks,
      upcomingHarvests,
      waterStats,
      fertilizerStats,
      yieldStats,
      pestDiseaseStats,
      recentHarvestCount,
      fieldLocation,
      financialSummary,
    ] = await Promise.all([
      this.getTotalCounts(userId),
      this.getActiveCropsCount(userId),
      this.getTaskStats(userId),
      this.getRecentTasks(userId, 10),
      this.getUpcomingHarvests(userId, 30),
      this.getWaterUsageStats(userId, startDate, endDate),
      this.getFertilizerUsageStats(userId, startDate, endDate),
      this.getYieldStats(userId, startDate, endDate),
      this.getPestDiseaseStats(userId, startDate, endDate),
      this.getRecentHarvestCount(userId, 30),
      this.getFirstFieldWithLocation(userId),
      this.getFinancialSummary(userId, startDate, endDate),
    ]);

    return {
      counts: {
        ...counts,
        activeCrops: activeCropsCount,
      },
      tasks: {
        ...taskStats,
        recent: recentTasks,
      },
      harvests: {
        upcoming: upcomingHarvests,
        recentCount: recentHarvestCount,
      },
      resources: {
        water: waterStats,
        fertilizer: fertilizerStats,
      },
      yield: yieldStats,
      pestDisease: pestDiseaseStats,
      financial: financialSummary,
      location: fieldLocation
        ? {
            latitude: fieldLocation.latitude!,
            longitude: fieldLocation.longitude!,
            name: fieldLocation.address || fieldLocation.name,
          }
        : null,
    };
  }
}
