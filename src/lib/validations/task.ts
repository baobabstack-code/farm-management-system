import { z } from "zod";
import { TaskStatus, TaskPriority, TaskCategory } from "@prisma/client";

export const taskCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  dueDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid due date",
  }),
  priority: z.nativeEnum(TaskPriority),
  category: z.nativeEnum(TaskCategory),
  cropId: z.string().cuid("Invalid crop ID").optional(),
});

export const taskUpdateSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title too long")
    .optional(),
  description: z.string().max(1000, "Description too long").optional(),
  dueDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid due date",
    })
    .optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  category: z.nativeEnum(TaskCategory).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  cropId: z.string().cuid("Invalid crop ID").optional(),
});

export const taskCompleteSchema = z.object({
  completedAt: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid completion date",
  }),
});

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
export type TaskCompleteInput = z.infer<typeof taskCompleteSchema>;
