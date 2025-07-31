import { prisma } from "@/lib/prisma";
import {
  IrrigationLog,
  FertilizerLog,
  PestDiseaseLog,
  HarvestLog,
  IrrigationLogWithRelations,
  FertilizerLogWithRelations,
  PestDiseaseLogWithRelations,
  HarvestLogWithRelations,
} from "@/types";
import { PestDiseaseType, SeverityLevel } from "@prisma/client";

export class ActivityService {
  // Irrigation Log Methods
  static async createIrrigationLog(data: {
    userId: string;
    cropId: string;
    date: Date;
    duration: number;
    waterAmount: number;
    method?: string;
    notes?: string;
  }): Promise<IrrigationLog> {
    return await prisma.irrigationLog.create({
      data: {
        ...data,
        date: new Date(data.date),
      },
    });
  }

  static async getIrrigationLogs(
    userId: string,
    cropId?: string
  ): Promise<IrrigationLogWithRelations[]> {
    const where: { userId: string; cropId?: string } = { userId };
    if (cropId) where.cropId = cropId;

    return (await prisma.irrigationLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        crop: true,
      },
      orderBy: { date: "desc" },
    })) as IrrigationLogWithRelations[];
  }

  // Fertilizer Log Methods
  static async createFertilizerLog(data: {
    userId: string;
    cropId: string;
    date: Date;
    fertilizerType: string;
    amount: number;
    applicationMethod: string;
    notes?: string;
  }): Promise<FertilizerLog> {
    return await prisma.fertilizerLog.create({
      data: {
        ...data,
        date: new Date(data.date),
      },
    });
  }

  static async getFertilizerLogs(
    userId: string,
    cropId?: string
  ): Promise<FertilizerLogWithRelations[]> {
    const where: { userId: string; cropId?: string } = { userId };
    if (cropId) where.cropId = cropId;

    return (await prisma.fertilizerLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        crop: true,
      },
      orderBy: { date: "desc" },
    })) as FertilizerLogWithRelations[];
  }

  // Pest/Disease Log Methods
  static async createPestDiseaseLog(data: {
    userId: string;
    cropId: string;
    date: Date;
    type: PestDiseaseType;
    name: string;
    severity: SeverityLevel;
    affectedArea: number;
    treatment: string;
    notes?: string;
  }): Promise<PestDiseaseLog> {
    return await prisma.pestDiseaseLog.create({
      data: {
        ...data,
        date: new Date(data.date),
      },
    });
  }

  static async getPestDiseaseLogs(
    userId: string,
    cropId?: string,
    type?: PestDiseaseType
  ): Promise<PestDiseaseLogWithRelations[]> {
    const where: { userId: string; cropId?: string; type?: PestDiseaseType } = {
      userId,
    };
    if (cropId) where.cropId = cropId;
    if (type) where.type = type;

    return (await prisma.pestDiseaseLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        crop: true,
      },
      orderBy: { date: "desc" },
    })) as PestDiseaseLogWithRelations[];
  }

  // Harvest Log Methods
  static async createHarvestLog(data: {
    userId: string;
    cropId: string;
    harvestDate: Date;
    quantity: number;
    unit: string;
    qualityGrade: string;
    notes?: string;
  }): Promise<HarvestLog> {
    return await prisma.harvestLog.create({
      data: {
        ...data,
        harvestDate: new Date(data.harvestDate),
      },
    });
  }

  static async getHarvestLogs(
    userId: string,
    cropId?: string
  ): Promise<HarvestLogWithRelations[]> {
    const where: { userId: string; cropId?: string } = { userId };
    if (cropId) where.cropId = cropId;

    return (await prisma.harvestLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        crop: true,
      },
      orderBy: { harvestDate: "desc" },
    })) as HarvestLogWithRelations[];
  }

  // Analytics Methods
  static async getWaterUsageStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalWater: number;
    averagePerSession: number;
    sessionCount: number;
  }> {
    const where: { userId: string; date?: { gte?: Date; lte?: Date } } = {
      userId,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const logs = await prisma.irrigationLog.findMany({ where });

    const totalWater = logs.reduce((sum, log) => sum + log.waterAmount, 0);
    const sessionCount = logs.length;
    const averagePerSession = sessionCount > 0 ? totalWater / sessionCount : 0;

    return { totalWater, averagePerSession, sessionCount };
  }

  static async getFertilizerUsageStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalAmount: number;
    applicationCount: number;
    typeBreakdown: Record<string, number>;
  }> {
    const where: { userId: string; date?: { gte?: Date; lte?: Date } } = {
      userId,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const logs = await prisma.fertilizerLog.findMany({ where });

    const totalAmount = logs.reduce((sum, log) => sum + log.amount, 0);
    const applicationCount = logs.length;
    const typeBreakdown = logs.reduce(
      (acc, log) => {
        acc[log.fertilizerType] = (acc[log.fertilizerType] || 0) + log.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    return { totalAmount, applicationCount, typeBreakdown };
  }

  static async getYieldStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalYield: number;
    harvestCount: number;
    cropBreakdown: Record<string, number>;
  }> {
    const where: { userId: string; harvestDate?: { gte?: Date; lte?: Date } } =
      { userId };

    if (startDate || endDate) {
      where.harvestDate = {};
      if (startDate) where.harvestDate.gte = startDate;
      if (endDate) where.harvestDate.lte = endDate;
    }

    const logs = await prisma.harvestLog.findMany({
      where,
      include: { crop: true },
    });

    const totalYield = logs.reduce((sum, log) => sum + log.quantity, 0);
    const harvestCount = logs.length;
    const cropBreakdown = logs.reduce(
      (acc, log) => {
        const cropName = log.crop.name;
        acc[cropName] = (acc[cropName] || 0) + log.quantity;
        return acc;
      },
      {} as Record<string, number>
    );

    return { totalYield, harvestCount, cropBreakdown };
  }

  static async getPestDiseaseStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalIncidents: number;
    pestCount: number;
    diseaseCount: number;
    severityBreakdown: Record<string, number>;
  }> {
    const where: { userId: string; date?: { gte?: Date; lte?: Date } } = {
      userId,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const logs = await prisma.pestDiseaseLog.findMany({ where });

    const totalIncidents = logs.length;
    const pestCount = logs.filter(
      (log) => log.type === PestDiseaseType.PEST
    ).length;
    const diseaseCount = logs.filter(
      (log) => log.type === PestDiseaseType.DISEASE
    ).length;
    const severityBreakdown = logs.reduce(
      (acc, log) => {
        acc[log.severity] = (acc[log.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return { totalIncidents, pestCount, diseaseCount, severityBreakdown };
  }
}
