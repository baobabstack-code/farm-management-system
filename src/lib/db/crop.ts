import { prisma } from "@/lib/prisma";
import { Crop, CropWithRelations } from "@/types";
import { CropStatus } from "@prisma/client";

export class CropService {
  static async findById(id: string, userId: string): Promise<Crop | null> {
    return await prisma.crop.findFirst({
      where: { id, userId },
    });
  }

  static async findByIdWithRelations(
    id: string,
    userId: string
  ): Promise<CropWithRelations | null> {
    return (await prisma.crop.findFirst({
      where: { id, userId },
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
        tasks: true,
        irrigationLogs: true,
        fertilizerLogs: true,
        pestDiseaseLogs: true,
        harvestLogs: true,
      },
    })) as CropWithRelations | null;
  }

  static async findAllByUser(userId: string): Promise<Crop[]> {
    return await prisma.crop.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  static async create(data: {
    userId: string;
    name: string;
    variety?: string;
    plantingDate: Date;
    expectedHarvestDate: Date;
    area?: number;
  }): Promise<Crop> {
    return await prisma.crop.create({
      data: {
        ...data,
        plantingDate: new Date(data.plantingDate),
        expectedHarvestDate: new Date(data.expectedHarvestDate),
      },
    });
  }

  static async update(
    id: string,
    userId: string,
    data: Partial<{
      name: string;
      variety: string;
      plantingDate: Date;
      expectedHarvestDate: Date;
      actualHarvestDate: Date | null;
      status: CropStatus;
      area: number;
    }>
  ): Promise<Crop> {
    const updateData = { ...data };

    // Convert date strings to Date objects if present
    if (updateData.plantingDate) {
      updateData.plantingDate = new Date(updateData.plantingDate);
    }
    if (updateData.expectedHarvestDate) {
      updateData.expectedHarvestDate = new Date(updateData.expectedHarvestDate);
    }
    if (updateData.actualHarvestDate) {
      updateData.actualHarvestDate = new Date(updateData.actualHarvestDate);
    }

    return await prisma.crop.update({
      where: { id, userId },
      data: updateData,
    });
  }

  static async delete(id: string, userId: string): Promise<void> {
    await prisma.crop.delete({
      where: { id, userId },
    });
  }

  static async updateStatus(
    id: string,
    userId: string,
    status: CropStatus
  ): Promise<Crop> {
    return await prisma.crop.update({
      where: { id, userId },
      data: { status },
    });
  }

  static async getActiveCrops(userId: string): Promise<Crop[]> {
    return await prisma.crop.findMany({
      where: {
        userId,
        status: {
          not: CropStatus.COMPLETED,
        },
      },
      orderBy: { plantingDate: "desc" },
    });
  }

  static async getCropsByStatus(
    userId: string,
    status: CropStatus
  ): Promise<Crop[]> {
    return await prisma.crop.findMany({
      where: { userId, status },
      orderBy: { createdAt: "desc" },
    });
  }
}
