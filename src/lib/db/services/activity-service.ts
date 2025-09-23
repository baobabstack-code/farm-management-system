import {
  PestDiseaseType,
  IrrigationMethod,
  ApplicationMethod,
  QualityGrade,
  Severity,
} from "@prisma/client";
import { prisma } from "../connection";

export interface IrrigationLogCreateData {
  userId: string;
  cropId: string;
  date: Date;
  duration: number;
  waterAmount: number;
  method: IrrigationMethod;
  notes?: string;
}

export interface FertilizerLogCreateData {
  userId: string;
  cropId: string;
  date: Date;
  fertilizerType: string;
  amount: number;
  applicationMethod: ApplicationMethod;
  notes?: string;
}

export interface HarvestLogCreateData {
  userId: string;
  cropId: string;
  harvestDate: Date;
  quantity: number;
  unit: string;
  qualityGrade: QualityGrade;
  notes?: string;
}

export interface PestDiseaseLogCreateData {
  userId: string;
  cropId: string;
  date: Date;
  type: PestDiseaseType;
  name: string;
  severity: Severity;
  affectedArea: number;
  treatment?: string;
  notes?: string;
}

export class ActivityService {
  // Irrigation methods
  static async createIrrigationLog(data: IrrigationLogCreateData) {
    return prisma.irrigationLog.create({
      data,
      include: { crop: true },
    });
  }

  static async getIrrigationLogs(userId: string, cropId?: string) {
    return prisma.irrigationLog.findMany({
      where: {
        userId,
        ...(cropId && { cropId }),
      },
      include: { crop: true },
      orderBy: { date: "desc" },
    });
  }

  // Fertilizer methods
  static async createFertilizerLog(data: FertilizerLogCreateData) {
    return prisma.fertilizerLog.create({
      data,
      include: { crop: true },
    });
  }

  static async getFertilizerLogs(userId: string, cropId?: string) {
    return prisma.fertilizerLog.findMany({
      where: {
        userId,
        ...(cropId && { cropId }),
      },
      include: { crop: true },
      orderBy: { date: "desc" },
    });
  }

  // Harvest methods
  static async createHarvestLog(data: HarvestLogCreateData) {
    return prisma.harvestLog.create({
      data,
      include: { crop: true },
    });
  }

  static async getHarvestLogs(userId: string, cropId?: string) {
    return prisma.harvestLog.findMany({
      where: {
        userId,
        ...(cropId && { cropId }),
      },
      include: { crop: true },
      orderBy: { harvestDate: "desc" },
    });
  }

  // Pest/Disease methods
  static async createPestDiseaseLog(data: PestDiseaseLogCreateData) {
    return prisma.pestDiseaseLog.create({
      data,
      include: { crop: true },
    });
  }

  static async getPestDiseaseLogs(
    userId: string,
    cropId?: string,
    type?: PestDiseaseType
  ) {
    return prisma.pestDiseaseLog.findMany({
      where: {
        userId,
        ...(cropId && { cropId }),
        ...(type && { type }),
      },
      include: { crop: true },
      orderBy: { date: "desc" },
    });
  }

  // Analytics methods
  static async getWaterUsageStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const where: any = { userId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const logs = await prisma.irrigationLog.findMany({ where });
    const totalWater = logs.reduce((sum, log) => sum + log.waterAmount, 0);
    const totalDuration = logs.reduce((sum, log) => sum + log.duration, 0);

    return {
      totalWater,
      totalDuration,
      sessionCount: logs.length,
      averagePerSession: logs.length > 0 ? totalWater / logs.length : 0,
    };
  }

  static async getFertilizerUsageStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const where: any = { userId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const logs = await prisma.fertilizerLog.findMany({ where });
    const totalAmount = logs.reduce((sum, log) => sum + log.amount, 0);

    return {
      totalAmount,
      applicationCount: logs.length,
      averagePerApplication: logs.length > 0 ? totalAmount / logs.length : 0,
    };
  }

  static async getYieldStats(userId: string, startDate?: Date, endDate?: Date) {
    const where: any = { userId };
    if (startDate || endDate) {
      where.harvestDate = {};
      if (startDate) where.harvestDate.gte = startDate;
      if (endDate) where.harvestDate.lte = endDate;
    }

    const logs = await prisma.harvestLog.findMany({ where });
    const totalYield = logs.reduce((sum, log) => sum + log.quantity, 0);

    return {
      totalYield,
      harvestCount: logs.length,
      averagePerHarvest: logs.length > 0 ? totalYield / logs.length : 0,
    };
  }

  static async getPestDiseaseStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const where: any = { userId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const logs = await prisma.pestDiseaseLog.findMany({ where });
    const pestCount = logs.filter((log) => log.type === "PEST").length;
    const diseaseCount = logs.filter((log) => log.type === "DISEASE").length;

    return {
      totalIncidents: logs.length,
      pestCount,
      diseaseCount,
      severityBreakdown: {
        LOW: logs.filter((log) => log.severity === "LOW").length,
        MEDIUM: logs.filter((log) => log.severity === "MEDIUM").length,
        HIGH: logs.filter((log) => log.severity === "HIGH").length,
      },
    };
  }
}
