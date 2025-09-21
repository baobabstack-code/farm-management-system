import { z } from "zod";
import { CropStatus } from "@prisma/client";

export const cropCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  variety: z.string().max(100, "Variety name too long").optional(),
  plantingDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid planting date",
  }),
  expectedHarvestDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid expected harvest date",
  }),
  area: z.number().positive("Area must be positive").optional(),
});

export const cropUpdateSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .optional(),
  variety: z.string().max(100, "Variety name too long").optional(),
  plantingDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid planting date",
    })
    .optional(),
  expectedHarvestDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid expected harvest date",
    })
    .optional(),
  area: z.number().positive("Area must be positive").optional(),
  status: z.nativeEnum(CropStatus).optional(),
});

export type CropCreateInput = z.infer<typeof cropCreateSchema>;
export type CropUpdateInput = z.infer<typeof cropUpdateSchema>;
