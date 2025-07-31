import { z } from "zod";
import { CropStatus } from "@prisma/client";

export const cropCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Crop name is required")
    .max(100, "Crop name must be less than 100 characters"),
  variety: z
    .string()
    .max(100, "Variety must be less than 100 characters")
    .optional(),
  plantingDate: z.string().datetime("Invalid planting date").or(z.date()),
  expectedHarvestDate: z
    .string()
    .datetime("Invalid expected harvest date")
    .or(z.date()),
  area: z.number().positive("Area must be a positive number").optional(),
});

export const cropUpdateSchema = z.object({
  name: z
    .string()
    .min(1, "Crop name is required")
    .max(100, "Crop name must be less than 100 characters")
    .optional(),
  variety: z
    .string()
    .max(100, "Variety must be less than 100 characters")
    .optional(),
  plantingDate: z
    .string()
    .datetime("Invalid planting date")
    .or(z.date())
    .optional(),
  expectedHarvestDate: z
    .string()
    .datetime("Invalid expected harvest date")
    .or(z.date())
    .optional(),
  actualHarvestDate: z
    .string()
    .datetime("Invalid actual harvest date")
    .or(z.date())
    .optional()
    .nullable(),
  status: z.nativeEnum(CropStatus).optional(),
  area: z.number().positive("Area must be a positive number").optional(),
});

export type CropCreate = z.infer<typeof cropCreateSchema>;
export type CropUpdate = z.infer<typeof cropUpdateSchema>;
