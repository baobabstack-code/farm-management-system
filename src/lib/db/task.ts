import { prisma } from "@/lib/prisma";
import { Task, TaskWithRelations } from "@/types";
import { TaskStatus, TaskPriority, TaskCategory } from "@prisma/client";

export class TaskService {
  static async findById(id: string, userId: string): Promise<Task | null> {
    return await prisma.task.findFirst({
      where: { id, userId },
    });
  }

  static async findByIdWithRelations(
    id: string,
    userId: string
  ): Promise<TaskWithRelations | null> {
    return (await prisma.task.findFirst({
      where: { id, userId },
      include: {
        crop: true,
      },
    })) as TaskWithRelations | null;
  }

  static async findAllByUser(
    userId: string,
    filters?: {
      status?: TaskStatus;
      priority?: TaskPriority;
      category?: TaskCategory;
      cropId?: string;
      overdue?: boolean;
    }
  ): Promise<Task[]> {
    const where: {
      userId: string;
      status?: TaskStatus | { not: TaskStatus };
      priority?: TaskPriority;
      category?: TaskCategory;
      cropId?: string;
      dueDate?: { lt: Date };
    } = { userId };

    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.category) where.category = filters.category;
    if (filters?.cropId) where.cropId = filters.cropId;

    if (filters?.overdue) {
      where.dueDate = { lt: new Date() };
      where.status = { not: TaskStatus.COMPLETED };
    }

    return await prisma.task.findMany({
      where,
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
    });
  }

  static async create(data: {
    userId: string;
    title: string;
    description?: string;
    dueDate: Date;
    priority: TaskPriority;
    category: TaskCategory;
    cropId?: string;
  }): Promise<Task> {
    return await prisma.task.create({
      data: {
        ...data,
        dueDate: new Date(data.dueDate),
      },
    });
  }

  static async update(
    id: string,
    userId: string,
    data: Partial<{
      title: string;
      description: string;
      dueDate: Date;
      priority: TaskPriority;
      category: TaskCategory;
      status: TaskStatus;
      cropId: string | null;
      completedAt: Date | null;
    }>
  ): Promise<Task> {
    const updateData = { ...data };

    // Convert date strings to Date objects if present
    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate);
    }
    if (updateData.completedAt) {
      updateData.completedAt = new Date(updateData.completedAt);
    }

    return await prisma.task.update({
      where: { id, userId },
      data: updateData,
    });
  }

  static async delete(id: string, userId: string): Promise<void> {
    await prisma.task.delete({
      where: { id, userId },
    });
  }

  static async markComplete(
    id: string,
    userId: string,
    completedAt: Date = new Date()
  ): Promise<Task> {
    return await prisma.task.update({
      where: { id, userId },
      data: {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(completedAt),
      },
    });
  }

  static async getUpcomingTasks(
    userId: string,
    days: number = 7
  ): Promise<Task[]> {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return await prisma.task.findMany({
      where: {
        userId,
        status: { not: TaskStatus.COMPLETED },
        dueDate: {
          gte: new Date(),
          lte: endDate,
        },
      },
      orderBy: { dueDate: "asc" },
    });
  }

  static async getOverdueTasks(userId: string): Promise<Task[]> {
    return await prisma.task.findMany({
      where: {
        userId,
        status: { not: TaskStatus.COMPLETED },
        dueDate: { lt: new Date() },
      },
      orderBy: { dueDate: "asc" },
    });
  }

  static async getTasksByCrop(userId: string, cropId: string): Promise<Task[]> {
    return await prisma.task.findMany({
      where: { userId, cropId },
      orderBy: { dueDate: "asc" },
    });
  }

  static async getTaskStats(userId: string): Promise<{
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  }> {
    const [total, completed, pending, overdue] = await Promise.all([
      prisma.task.count({ where: { userId } }),
      prisma.task.count({
        where: { userId, status: TaskStatus.COMPLETED },
      }),
      prisma.task.count({
        where: { userId, status: TaskStatus.PENDING },
      }),
      prisma.task.count({
        where: {
          userId,
          status: { not: TaskStatus.COMPLETED },
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    return { total, completed, pending, overdue };
  }
}
