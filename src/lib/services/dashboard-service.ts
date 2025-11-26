import { DashboardRepository } from "../db/services/dashboard-repository";
import type {
  DashboardSummaryResponse,
  DashboardStats,
  CropSummary,
  TaskSummary,
} from "../validations/dashboard";

/**
 * Dashboard Service
 *
 * Business logic layer for dashboard functionality.
 * Transforms repository data into the format expected by the API/UI.
 * Handles edge cases and data enrichment.
 */
export class DashboardService {
  /**
   * Get complete dashboard summary
   * Main method that orchestrates all dashboard data retrieval
   */
  static async getDashboardSummary(
    userId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      includeInactive?: boolean;
    }
  ): Promise<DashboardSummaryResponse> {
    // Fetch all data from repository
    const data = await DashboardRepository.getDashboardSummary(userId, options);

    // Transform to match API response schema
    const dashboardStats: DashboardStats = {
      totalCrops: data.counts.totalCrops,
      activeTasks: data.tasks.active,
      overdueTasks: data.tasks.overdue,
      recentHarvests: data.harvests.recentCount,
      totalYield: data.yield.totalYield,
      waterUsage: data.resources.water.totalWater,
    };

    // Transform recent tasks to include crop names
    const recentTasks: TaskSummary[] = data.tasks.recent.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate.toISOString(),
      priority: task.priority,
      status: task.status,
      cropId: task.cropId,
      cropName: task.crop?.name || null,
      createdAt: task.createdAt.toISOString(),
    }));

    // Transform upcoming harvests
    const upcomingHarvests: CropSummary[] = data.harvests.upcoming.map(
      (crop) => ({
        id: crop.id,
        name: crop.name,
        variety: crop.variety,
        status: crop.status,
        plantingDate: crop.plantingDate.toISOString(),
        expectedHarvestDate: crop.expectedHarvestDate.toISOString(),
        actualHarvestDate: crop.actualHarvestDate?.toISOString() || null,
        area: crop.area,
      })
    );

    return {
      dashboard: dashboardStats,
      water: data.resources.water,
      fertilizer: data.resources.fertilizer,
      yield: data.yield,
      pestDisease: data.pestDisease,
      financial: data.financial,
      recentTasks,
      upcomingHarvests,
      location: data.location,
    };
  }

  /**
   * Get dashboard stats only (lightweight)
   * For quick metric updates without full data
   */
  static async getDashboardStats(userId: string): Promise<DashboardStats> {
    const [
      counts,
      activeCropsCount,
      taskStats,
      recentHarvestCount,
      waterStats,
    ] = await Promise.all([
      DashboardRepository.getTotalCounts(userId),
      DashboardRepository.getActiveCropsCount(userId),
      DashboardRepository.getTaskStats(userId),
      DashboardRepository.getRecentHarvestCount(userId, 30),
      DashboardRepository.getWaterUsageStats(userId),
    ]);

    const yieldStats = await DashboardRepository.getYieldStats(userId);

    return {
      totalCrops: counts.totalCrops,
      activeTasks: taskStats.active,
      overdueTasks: taskStats.overdue,
      recentHarvests: recentHarvestCount,
      totalYield: yieldStats.totalYield,
      waterUsage: waterStats.totalWater,
    };
  }

  /**
   * Get recent tasks with enriched data
   * Includes crop information and formatted dates
   */
  static async getRecentTasks(
    userId: string,
    limit: number = 10
  ): Promise<TaskSummary[]> {
    const tasks = await DashboardRepository.getRecentTasks(userId, limit);

    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate.toISOString(),
      priority: task.priority,
      status: task.status,
      cropId: task.cropId,
      cropName: task.crop?.name || null,
      createdAt: task.createdAt.toISOString(),
    }));
  }

  /**
   * Get upcoming harvests with enriched data
   * Includes days until harvest calculation
   */
  static async getUpcomingHarvests(
    userId: string,
    days: number = 30
  ): Promise<CropSummary[]> {
    const crops = await DashboardRepository.getUpcomingHarvests(userId, days);

    return crops.map((crop) => ({
      id: crop.id,
      name: crop.name,
      variety: crop.variety,
      status: crop.status,
      plantingDate: crop.plantingDate.toISOString(),
      expectedHarvestDate: crop.expectedHarvestDate.toISOString(),
      actualHarvestDate: crop.actualHarvestDate?.toISOString() || null,
      area: crop.area,
    }));
  }

  /**
   * Calculate days until harvest for a crop
   * Helper method for UI display
   */
  static calculateDaysUntilHarvest(expectedHarvestDate: Date): number {
    const now = new Date();
    const diffTime = expectedHarvestDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Get resource usage summary
   * Combines water and fertilizer stats
   */
  static async getResourceUsageSummary(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const [waterStats, fertilizerStats] = await Promise.all([
      DashboardRepository.getWaterUsageStats(userId, startDate, endDate),
      DashboardRepository.getFertilizerUsageStats(userId, startDate, endDate),
    ]);

    return {
      water: waterStats,
      fertilizer: fertilizerStats,
    };
  }

  /**
   * Get health and issues summary
   * Pest and disease statistics
   */
  static async getHealthSummary(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    return DashboardRepository.getPestDiseaseStats(userId, startDate, endDate);
  }

  /**
   * Get financial summary with calculations
   * Includes profit margin and other derived metrics
   */
  static async getFinancialSummary(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const summary = await DashboardRepository.getFinancialSummary(
      userId,
      startDate,
      endDate
    );

    // Calculate additional metrics
    const profitMargin =
      summary.totalIncome > 0
        ? ((summary.totalIncome - summary.totalExpenses) /
            summary.totalIncome) *
          100
        : 0;

    return {
      ...summary,
      profitMargin: Math.round(profitMargin * 100) / 100, // Round to 2 decimals
    };
  }

  /**
   * Validate date range
   * Ensures start date is before end date
   */
  static validateDateRange(startDate?: Date, endDate?: Date): boolean {
    if (!startDate || !endDate) return true;
    return startDate <= endDate;
  }

  /**
   * Get default date range (last 30 days)
   * Helper for when no dates are provided
   */
  static getDefaultDateRange(): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    return { startDate, endDate };
  }

  /**
   * Check if user has any data
   * Useful for showing onboarding vs dashboard
   */
  static async hasAnyData(userId: string): Promise<boolean> {
    const counts = await DashboardRepository.getTotalCounts(userId);
    return (
      counts.totalCrops > 0 ||
      counts.totalFields > 0 ||
      counts.totalTasks > 0 ||
      counts.totalEquipment > 0
    );
  }

  /**
   * Get dashboard alerts
   * Returns important items that need attention
   */
  static async getDashboardAlerts(userId: string) {
    const [taskStats, upcomingHarvests, pestDiseaseStats] = await Promise.all([
      DashboardRepository.getTaskStats(userId),
      DashboardRepository.getUpcomingHarvests(userId, 7), // Next 7 days
      DashboardRepository.getPestDiseaseStats(userId),
    ]);

    const alerts = [];

    // Overdue tasks alert
    if (taskStats.overdue > 0) {
      alerts.push({
        type: "warning",
        title: "Overdue Tasks",
        message: `You have ${taskStats.overdue} overdue task${taskStats.overdue > 1 ? "s" : ""}`,
        count: taskStats.overdue,
      });
    }

    // Upcoming harvests alert
    if (upcomingHarvests.length > 0) {
      alerts.push({
        type: "info",
        title: "Upcoming Harvests",
        message: `${upcomingHarvests.length} crop${upcomingHarvests.length > 1 ? "s" : ""} ready to harvest in the next 7 days`,
        count: upcomingHarvests.length,
      });
    }

    // High severity pest/disease alert
    const highSeverityCount = pestDiseaseStats.severityBreakdown.HIGH || 0;
    if (highSeverityCount > 0) {
      alerts.push({
        type: "error",
        title: "High Severity Issues",
        message: `${highSeverityCount} high severity pest/disease incident${highSeverityCount > 1 ? "s" : ""}`,
        count: highSeverityCount,
      });
    }

    return alerts;
  }

  /**
   * Get quick stats for mobile/compact view
   * Returns only the most important metrics
   */
  static async getQuickStats(userId: string) {
    const [counts, taskStats, upcomingHarvests] = await Promise.all([
      DashboardRepository.getTotalCounts(userId),
      DashboardRepository.getTaskStats(userId),
      DashboardRepository.getUpcomingHarvests(userId, 7),
    ]);

    return {
      crops: counts.totalCrops,
      tasks: taskStats.active,
      overdue: taskStats.overdue,
      harvests: upcomingHarvests.length,
    };
  }

  /**
   * Format currency for display
   * Helper method for financial data
   */
  static formatCurrency(amount: number, currency: string = "USD"): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  }

  /**
   * Format large numbers with abbreviations
   * e.g., 1500 -> "1.5K", 1500000 -> "1.5M"
   */
  static formatLargeNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  }

  /**
   * Get percentage change between two values
   * Useful for trend indicators
   */
  static calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }
}
