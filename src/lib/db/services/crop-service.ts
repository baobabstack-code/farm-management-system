import { PrismaClient, CropStatus } from "@prisma/client";

const prisma = new PrismaClient();

export interface CropCreateData {
  userId: string;
  name: string;
  variety?: string;
  plantingDate: Date;
  expectedHarvestDate: Date;
  area?: number;
}

export interface CropUpdateData {
  name?: string;
  variety?: string;
  plantingDate?: Date;
  expectedHarvestDate?: Date;
  area?: number;
  status?: CropStatus;
}

export class CropService {
  static async create(data: CropCreateData) {
    return prisma.crop.create({
      data: {
        ...data,
        status: "PLANTED",
      },
    });
  }

  static async findAllByUser(userId: string) {
    return prisma.crop.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  static async findById(id: string, userId: string) {
    return prisma.crop.findFirst({
      where: { id, userId },
    });
  }

  static async update(id: string, userId: string, data: CropUpdateData) {
    return prisma.crop.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  static async delete(id: string, userId: string) {
    return prisma.crop.delete({
      where: { id },
    });
  }
}
