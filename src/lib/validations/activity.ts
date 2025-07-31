import { z } from "zod";
import { PestDiseaseType, SeverityLevel } from "@prisma/client";

// Irrigation log validation
export const irrigationLogCreateSchema = z.object({
  cropId: z.string().cuid("Invalid crop ID"),
  date: z.string().datetime("Invalid date").or(z.date()),
  duration: z
    .number()
    .int("Duration must be a whole number")
    .positive("Duration must be positive"),
  waterAmount: z.number().positive("Water amount must be positive"),
  method: z
    .string()
    .max(50, "Method must be less than 50 characters")
    .optional(),
  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional(),
});

// Fertilizer log validation
export const fertilizerLogCreateSchema = z.object({
  cropId: z.string().cuid("Invalid crop ID"),
  date: z.string().datetime("Invalid date").or(z.date()),
  fertilizerType: z
    .string()
    .min(1, "Fertilizer type is required")
    .max(100, "Fertilizer type must be less than 100 characters"),
  amount: z.number().positive("Amount must be positive"),
  applicationMethod: z
    .string()
    .min(1, "Application method is required")
    .max(100, "Application method must be less than 100 characters"),
  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional(),
});

// Pest/Disease log validation
export const pestDiseaseLogCreateSchema = z.object({
  cropId: z.string().cuid("Invalid crop ID"),
  date: z.string().datetime("Invalid date").or(z.date()),
  type: z.nativeEnum(PestDiseaseType),
  name: z
    .string()
    .min(1, "Pest/Disease name is required")
    .max(100, "Name must be less than 100 characters"),
  severity: z.nativeEnum(SeverityLevel),
  affectedArea: z.number().nonnegative("Affected area cannot be negative"),
  treatment: z
    .string()
    .min(1, "Treatment is required")
    .max(200, "Treatment must be less than 200 characters"),
  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional(),
});

// Harvest log validation
export const harvestLogCreateSchema = z.object({
  cropId: z.string().cuid("Invalid crop ID"),
  harvestDate: z.string().datetime("Invalid harvest date").or(z.date()),
  quantity: z.number().positive("Quantity must be positive"),
  unit: z
    .string()
    .min(1, "Unit is required")
    .max(20, "Unit must be less than 20 characters"),
  qualityGrade: z
    .string()
    .min(1, "Quality grade is required")
    .max(50, "Quality grade must be less than 50 characters"),
  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional(),
});

export type IrrigationLogCreate = z.infer<typeof irrigationLogCreateSchema>;
export type FertilizerLogCreate = z.infer<typeof fertilizerLogCreateSchema>;
export type PestDiseaseLogCreate = z.infer<typeof pestDiseaseLogCreateSchema>;
export type HarvestLogCreate = z.infer<typeof harvestLogCreateSchema>;
