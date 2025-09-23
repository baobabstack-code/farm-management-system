import { z } from "zod";
import {
  IrrigationMethod,
  ApplicationMethod,
  QualityGrade,
  Severity,
  PestDiseaseType,
} from "@prisma/client";

export const irrigationLogCreateSchema = z.object({
  cropId: z
    .string()
    .min(1, "Crop selection is required")
    .cuid("Invalid crop ID"),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date",
  }),
  duration: z.number().positive("Duration must be positive"),
  waterAmount: z.number().positive("Water amount must be positive"),
  method: z.nativeEnum(IrrigationMethod),
  notes: z.string().max(500, "Notes too long").optional(),
});

export const fertilizerLogCreateSchema = z.object({
  cropId: z
    .string()
    .min(1, "Crop selection is required")
    .cuid("Invalid crop ID"),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date",
  }),
  fertilizerType: z
    .string()
    .min(1, "Fertilizer type is required")
    .max(100, "Fertilizer type too long"),
  amount: z.number().positive("Amount must be positive"),
  applicationMethod: z.nativeEnum(ApplicationMethod),
  notes: z.string().max(500, "Notes too long").optional(),
});

export const harvestLogCreateSchema = z.object({
  cropId: z
    .string()
    .min(1, "Crop selection is required")
    .cuid("Invalid crop ID"),
  harvestDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid harvest date",
  }),
  quantity: z.number().positive("Quantity must be positive"),
  unit: z.string().min(1, "Unit is required").max(50, "Unit too long"),
  qualityGrade: z.nativeEnum(QualityGrade),
  notes: z.string().max(500, "Notes too long").optional(),
});

export const pestDiseaseLogCreateSchema = z.object({
  cropId: z
    .string()
    .min(1, "Crop selection is required")
    .cuid("Invalid crop ID"),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date",
  }),
  type: z.nativeEnum(PestDiseaseType),
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  severity: z.nativeEnum(Severity),
  affectedArea: z.number().positive("Affected area must be positive"),
  treatment: z.string().max(200, "Treatment description too long").optional(),
  notes: z.string().max(500, "Notes too long").optional(),
});

export type IrrigationLogCreateInput = z.infer<
  typeof irrigationLogCreateSchema
>;
export type FertilizerLogCreateInput = z.infer<
  typeof fertilizerLogCreateSchema
>;
export type HarvestLogCreateInput = z.infer<typeof harvestLogCreateSchema>;
export type PestDiseaseLogCreateInput = z.infer<
  typeof pestDiseaseLogCreateSchema
>;
