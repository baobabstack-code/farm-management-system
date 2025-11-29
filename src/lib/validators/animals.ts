import { z } from "zod";

export const createSpeciesSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().optional(),
});

export const createGroupSchema = z.object({
  speciesId: z.string().cuid(),
  name: z.string().min(2).max(100),
  quantity: z.number().int().nonnegative(),
  startDate: z.coerce.date(),
  notes: z.string().optional(),
  farmId: z.string().optional(),
});

export const updateGroupSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  quantity: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "sold", "archived"]).optional(),
});

export const productionEntrySchema = z.object({
  groupId: z.string().cuid(),
  date: z.coerce.date(),
  eggs: z.number().int().nonnegative().optional(),
  weightKg: z.number().positive().optional(),
  notes: z.string().optional(),
});

export const feedRecordSchema = z.object({
  groupId: z.string().cuid(),
  date: z.coerce.date(),
  feedType: z.string().min(1),
  quantityKg: z.number().positive(),
  cost: z.number().nonnegative().optional(),
});

export const healthRecordSchema = z.object({
  groupId: z.string().cuid(),
  date: z.coerce.date(),
  issue: z.string().min(1),
  treatment: z.string().optional(),
  cost: z.number().nonnegative().optional(),
});

export const expenseSchema = z.object({
  groupId: z.string().cuid(),
  date: z.coerce.date(),
  category: z.string().min(1),
  cost: z.number().nonnegative(),
});

export const forecastRequestSchema = z.object({
  type: z.enum(["egg_production", "growth", "mortality"]),
  model: z.string().optional(),
  horizonDays: z.number().int().positive().default(30),
  inputOverrides: z.record(z.string(), z.any()).optional(),
});
