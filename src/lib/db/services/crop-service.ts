import { CropStatus } from "@prisma/client";
import { prisma } from "../connection";
import DatabaseService from "../database-service";

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
    return DatabaseService.execute(
      () =>
        prisma.crop.create({
          data: {
            ...data,
            status: "PLANTED",
          },
        }),
      "create crop"
    );
  }

  static async findAllByUser(userId: string) {
    return DatabaseService.execute(
      () =>
        prisma.crop.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
        }),
      "find crops by user"
    );
  }

  static async findById(id: string, userId: string) {
    return DatabaseService.execute(
      () =>
        prisma.crop.findFirst({
          where: { id, userId },
        }),
      "find crop by id"
    );
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
