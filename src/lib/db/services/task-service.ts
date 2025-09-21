import {
  PrismaClient,
  TaskStatus,
  TaskPriority,
  TaskCategory,
} from "@prisma/client";

const prisma = new PrismaClient();

export interface TaskCreateData {
  userId: string;
  title: string;
  description?: string;
  dueDate: Date;
  priority: TaskPriority;
  category: TaskCategory;
  cropId?: string;
}

export interface TaskUpdateData {
  title?: string;
  description?: string;
  dueDate?: Date;
  priority?: TaskPriority;
  category?: TaskCategory;
  status?: TaskStatus;
  cropId?: string;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: TaskCategory;
  cropId?: string;
  overdue?: boolean;
}

export class TaskService {
  static async create(data: TaskCreateData) {
    return prisma.task.create({
      data: {
        ...data,
        status: "PENDING",
      },
      include: {
        crop: true,
      },
    });
  }

  static async findAllByUser(userId: string, filters: TaskFilters = {}) {
    const where: any = { userId };

    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.category) where.category = filters.category;
    if (filters.cropId) where.cropId = filters.cropId;
    if (filters.overdue) {
      where.dueDate = { lt: new Date() };
      where.status = { not: "COMPLETED" };
    }

    return prisma.task.findMany({
      where,
      include: {
        crop: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async findById(id: string, userId: string) {
    return prisma.task.findFirst({
      where: { id, userId },
    });
  }

  static async findByIdWithRelations(id: string, userId: string) {
    return prisma.task.findFirst({
      where: { id, userId },
      include: {
        crop: true,
      },
    });
  }

  static async update(id: string, userId: string, data: TaskUpdateData) {
    return prisma.task.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        crop: true,
      },
    });
  }

  static async markComplete(
    id: string,
    userId: string,
    completedAt: Date = new Date()
  ) {
    return prisma.task.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt,
        updatedAt: new Date(),
      },
      include: {
        crop: true,
      },
    });
  }

  static async delete(id: string, userId: string) {
    return prisma.task.delete({
      where: { id },
    });
  }

  static async getTaskStats(userId: string) {
    const [pending, completed, overdue] = await Promise.all([
      prisma.task.count({
        where: { userId, status: "PENDING" },
      }),
      prisma.task.count({
        where: { userId, status: "COMPLETED" },
      }),
      prisma.task.count({
        where: {
          userId,
          status: { not: "COMPLETED" },
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    return { pending, completed, overdue };
  }
}
