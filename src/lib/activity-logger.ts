import { prisma } from "@/lib/prisma";
import { EntityType, ActivityType } from "@/types";

interface LogActivityParams {
  userId: string;
  entityType: EntityType;
  entityId: string;
  actionType: ActivityType;
  description: string;
  metadata?: Record<string, unknown>;
}

export async function logActivity({
  userId,
  entityType,
  entityId,
  actionType,
  description,
  metadata = {},
}: LogActivityParams): Promise<void> {
  try {
    await prisma.activity.create({
      data: {
        userId,
        entityType,
        entityId,
        actionType,
        description,
        metadata: metadata as any,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    // Don't throw error to avoid breaking main operations
  }
}

// Helper functions for common activity logging patterns
export const ActivityLogger = {
  // Crop activities
  cropCreated: (userId: string, cropId: string, cropName: string) =>
    logActivity({
      userId,
      entityType: EntityType.CROP,
      entityId: cropId,
      actionType: ActivityType.CREATED,
      description: `Created crop: ${cropName}`,
    }),

  cropUpdated: (
    userId: string,
    cropId: string,
    cropName: string,
    changes: Record<string, unknown>
  ) =>
    logActivity({
      userId,
      entityType: EntityType.CROP,
      entityId: cropId,
      actionType: ActivityType.UPDATED,
      description: `Updated crop: ${cropName}`,
      metadata: { changes },
    }),

  cropDeleted: (userId: string, cropId: string, cropName: string) =>
    logActivity({
      userId,
      entityType: EntityType.CROP,
      entityId: cropId,
      actionType: ActivityType.DELETED,
      description: `Deleted crop: ${cropName}`,
    }),

  cropStatusChanged: (
    userId: string,
    cropId: string,
    cropName: string,
    oldStatus: string,
    newStatus: string
  ) =>
    logActivity({
      userId,
      entityType: EntityType.CROP,
      entityId: cropId,
      actionType: ActivityType.STATUS_CHANGED,
      description: `Changed crop status: ${cropName} from ${oldStatus} to ${newStatus}`,
      metadata: { oldStatus, newStatus },
    }),

  cropHarvested: (
    userId: string,
    cropId: string,
    cropName: string,
    quantity: number,
    unit: string
  ) =>
    logActivity({
      userId,
      entityType: EntityType.CROP,
      entityId: cropId,
      actionType: ActivityType.HARVESTED,
      description: `Harvested ${quantity} ${unit} of ${cropName}`,
      metadata: { quantity, unit },
    }),

  // Field activities
  fieldCreated: (userId: string, fieldId: string, fieldName: string) =>
    logActivity({
      userId,
      entityType: EntityType.FIELD,
      entityId: fieldId,
      actionType: ActivityType.CREATED,
      description: `Created field: ${fieldName}`,
    }),

  fieldUpdated: (
    userId: string,
    fieldId: string,
    fieldName: string,
    changes: Record<string, unknown>
  ) =>
    logActivity({
      userId,
      entityType: EntityType.FIELD,
      entityId: fieldId,
      actionType: ActivityType.UPDATED,
      description: `Updated field: ${fieldName}`,
      metadata: { changes },
    }),

  fieldDeleted: (userId: string, fieldId: string, fieldName: string) =>
    logActivity({
      userId,
      entityType: EntityType.FIELD,
      entityId: fieldId,
      actionType: ActivityType.DELETED,
      description: `Deleted field: ${fieldName}`,
    }),

  // Equipment activities
  equipmentCreated: (
    userId: string,
    equipmentId: string,
    equipmentName: string
  ) =>
    logActivity({
      userId,
      entityType: EntityType.EQUIPMENT,
      entityId: equipmentId,
      actionType: ActivityType.CREATED,
      description: `Added equipment: ${equipmentName}`,
    }),

  equipmentUpdated: (
    userId: string,
    equipmentId: string,
    equipmentName: string,
    changes: Record<string, unknown>
  ) =>
    logActivity({
      userId,
      entityType: EntityType.EQUIPMENT,
      entityId: equipmentId,
      actionType: ActivityType.UPDATED,
      description: `Updated equipment: ${equipmentName}`,
      metadata: { changes },
    }),

  equipmentDeleted: (
    userId: string,
    equipmentId: string,
    equipmentName: string
  ) =>
    logActivity({
      userId,
      entityType: EntityType.EQUIPMENT,
      entityId: equipmentId,
      actionType: ActivityType.DELETED,
      description: `Removed equipment: ${equipmentName}`,
    }),

  equipmentMaintained: (
    userId: string,
    equipmentId: string,
    equipmentName: string,
    maintenanceType: string
  ) =>
    logActivity({
      userId,
      entityType: EntityType.EQUIPMENT,
      entityId: equipmentId,
      actionType: ActivityType.MAINTAINED,
      description: `Performed ${maintenanceType} maintenance on ${equipmentName}`,
      metadata: { maintenanceType },
    }),

  // Task activities
  taskCreated: (userId: string, taskId: string, taskTitle: string) =>
    logActivity({
      userId,
      entityType: EntityType.TASK,
      entityId: taskId,
      actionType: ActivityType.CREATED,
      description: `Created task: ${taskTitle}`,
    }),

  taskCompleted: (userId: string, taskId: string, taskTitle: string) =>
    logActivity({
      userId,
      entityType: EntityType.TASK,
      entityId: taskId,
      actionType: ActivityType.COMPLETED,
      description: `Completed task: ${taskTitle}`,
    }),

  taskScheduled: (
    userId: string,
    taskId: string,
    taskTitle: string,
    dueDate: Date
  ) =>
    logActivity({
      userId,
      entityType: EntityType.TASK,
      entityId: taskId,
      actionType: ActivityType.SCHEDULED,
      description: `Scheduled task: ${taskTitle} for ${dueDate.toLocaleDateString()}`,
      metadata: { dueDate: dueDate.toISOString() },
    }),

  // Log activities
  irrigationLogged: (
    userId: string,
    logId: string,
    cropName: string,
    waterAmount: number
  ) =>
    logActivity({
      userId,
      entityType: EntityType.IRRIGATION_LOG,
      entityId: logId,
      actionType: ActivityType.LOGGED,
      description: `Logged irrigation: ${waterAmount}L for ${cropName}`,
      metadata: { waterAmount, cropName },
    }),

  fertilizerLogged: (
    userId: string,
    logId: string,
    cropName: string,
    fertilizerType: string,
    amount: number
  ) =>
    logActivity({
      userId,
      entityType: EntityType.FERTILIZER_LOG,
      entityId: logId,
      actionType: ActivityType.LOGGED,
      description: `Applied ${amount}kg of ${fertilizerType} to ${cropName}`,
      metadata: { fertilizerType, amount, cropName },
    }),

  pestTreatmentLogged: (
    userId: string,
    logId: string,
    cropName: string,
    treatment: string
  ) =>
    logActivity({
      userId,
      entityType: EntityType.PEST_DISEASE_LOG,
      entityId: logId,
      actionType: ActivityType.TREATED,
      description: `Applied ${treatment} treatment to ${cropName}`,
      metadata: { treatment, cropName },
    }),

  soilTested: (
    userId: string,
    testId: string,
    fieldName: string,
    testType: string
  ) =>
    logActivity({
      userId,
      entityType: EntityType.SOIL_TEST,
      entityId: testId,
      actionType: ActivityType.TESTED,
      description: `Conducted ${testType} soil test for ${fieldName}`,
      metadata: { testType, fieldName },
    }),
};
