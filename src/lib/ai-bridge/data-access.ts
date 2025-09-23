// AI Data Bridge - Read-only access to existing data for AI agents
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export class AIDataBridge {
  // Read-only access to crop data for AI agents
  static async getCropData(userId: string) {
    try {
      const crops = await prisma.crop.findMany({
        where: { userId },
        include: {
          tasks: {
            orderBy: { createdAt: "desc" },
            take: 10, // Limit for performance
          },
          irrigationLogs: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          fertilizerLogs: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });

      return {
        success: true,
        data: crops,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("AI Bridge - Crop data access error:", error);
      return {
        success: false,
        error: "Failed to fetch crop data",
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Read-only access to financial data
  static async getFinancialSummary(userId: string) {
    try {
      // This would aggregate existing financial data from different log types
      // without modifying the current system
      const [fertilizerLogs, irrigationLogs, harvestLogs] = await Promise.all([
        prisma.fertilizerLog.findMany({
          where: { userId },
          select: {
            amount: true,
            createdAt: true,
            crop: { select: { name: true, id: true } },
          },
          take: 50,
        }),
        prisma.irrigationLog.findMany({
          where: { userId },
          select: {
            waterAmount: true,
            createdAt: true,
            crop: { select: { name: true, id: true } },
          },
          take: 50,
        }),
        prisma.harvestLog.findMany({
          where: { userId },
          select: {
            quantity: true,
            createdAt: true,
            crop: { select: { name: true, id: true } },
          },
          take: 50,
        }),
      ]);

      // Combine all activities into a unified format
      const activities = [
        ...fertilizerLogs.map((log) => ({
          type: "FERTILIZER",
          cost: log.amount * 10, // Estimate cost
          createdAt: log.createdAt,
          crop: log.crop,
        })),
        ...irrigationLogs.map((log) => ({
          type: "IRRIGATION",
          cost: log.waterAmount * 0.1, // Estimate cost
          createdAt: log.createdAt,
          crop: log.crop,
        })),
        ...harvestLogs.map((log) => ({
          type: "HARVEST",
          cost: 0, // Revenue, not cost
          createdAt: log.createdAt,
          crop: log.crop,
        })),
      ];

      return {
        success: true,
        data: activities,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("AI Bridge - Financial data access error:", error);
      return {
        success: false,
        error: "Failed to fetch financial data",
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Safe method to get user context for AI agents
  static async getUserContext() {
    try {
      const { userId } = await auth();
      if (!userId) {
        return { success: false, error: "Unauthorized" };
      }

      return {
        success: true,
        userId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("User context error:", error);
      return {
        success: false,
        error: "Failed to get user context",
        timestamp: new Date().toISOString(),
      };
    }
  }
}
