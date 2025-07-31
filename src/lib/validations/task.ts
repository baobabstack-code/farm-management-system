import { z } from "zod";
import { TaskPriority, TaskCategory, TaskStatus } from "@prisma/client";

export const taskCreateSchema = z.object({
  title: z
    .string()
    .min(1, "Task title is required")
    .max(200, "Task title must be less than 200 characters"),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  dueDate: z.string().datetime("Invalid due date").or(z.date()),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  category: z.nativeEnum(TaskCategory),
  cropId: z.string().cuid("Invalid crop ID").optional(),
});

export const taskUpdateSchema = z.object({
  title: z
    .string()
    .min(1, "Task title is required")
    .max(200, "Task title must be less than 200 characters")
    .optional(),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  dueDate: z.string().datetime("Invalid due date").or(z.date()).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  category: z.nativeEnum(TaskCategory).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  cropId: z.string().cuid("Invalid crop ID").optional().nullable(),
  completedAt: z
    .string()
    .datetime("Invalid completion date")
    .or(z.date())
    .optional()
    .nullable(),
});

export const taskCompleteSchema = z.object({
  completedAt: z
    .string()
    .datetime("Invalid completion date")
    .or(z.date())
    .default(new Date().toISOString()),
});

export type TaskCreate = z.infer<typeof taskCreateSchema>;
export type TaskUpdate = z.infer<typeof taskUpdateSchema>;
export type TaskComplete = z.infer<typeof taskCompleteSchema>;
