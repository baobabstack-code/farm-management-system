// Removed unused imports
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ActivityLogger } from "@/lib/activity-logger";
import { ApiResponseHandler } from "@/lib/api-response-handler";

const updateEquipmentSchema = z.object({
  name: z.string().min(1, "Equipment name is required").optional(),
  equipmentType: z
    .enum([
      "PLOW",
      "CULTIVATOR",
      "DISC",
      "HARROW",
      "SUBSOILER",
      "FIELD_CULTIVATOR",
      "CHISEL_PLOW",
      "ROTARY_TILLER",
      "PLANTER",
      "DRILL",
      "SPREADER",
      "SPRAYER",
      "MOWER",
      "RAKE",
      "BALER",
      "COMBINE",
      "TRACTOR",
      "OTHER",
    ])
    .optional(),
  category: z
    .enum([
      "TILLAGE",
      "PLANTING",
      "HARVESTING",
      "SPRAYING",
      "MOWING",
      "TRANSPORT",
      "POWER",
      "SPECIALTY",
    ])
    .optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  yearManufactured: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .optional(),
  purchaseDate: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  purchasePrice: z.number().min(0).optional(),
  currentValue: z.number().min(0).optional(),
  status: z
    .enum(["ACTIVE", "MAINTENANCE", "REPAIR", "RETIRED", "RENTED", "LEASED"])
    .optional(),
  condition: z
    .enum(["EXCELLENT", "GOOD", "FAIR", "POOR", "NEEDS_REPAIR"])
    .optional(),
  fuelType: z
    .enum(["DIESEL", "GASOLINE", "PROPANE", "ELECTRIC", "HYBRID"])
    .optional(),
  horsepower: z.number().min(0).optional(),
  workingWidth: z.number().min(0).optional(),
  weight: z.number().min(0).optional(),
  hoursUsed: z.number().min(0).optional(),
  lastServiceDate: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  serviceInterval: z.number().min(0).optional(),
  insuranceExpiry: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  warrantyExpiry: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  location: z.string().optional(),
  isShared: z.boolean().optional(),
  dailyRate: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const GET = ApiResponseHandler.withErrorHandling(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { userId } = await auth();
    ApiResponseHandler.requireAuth(userId);

    const { id } = await params;

    const url = new URL(request.url);
    const includeDetails = url.searchParams.get("includeDetails") === "true";

    const equipment = await prisma.equipment.findFirst({
      where: {
        id: id,
        userId,
      },
      include: includeDetails
        ? {
            tillageOps: {
              include: {
                field: {
                  select: { id: true, name: true, area: true, unit: true },
                },
                crop: {
                  select: { id: true, name: true, variety: true, status: true },
                },
              },
              orderBy: { operationDate: "desc" },
              take: 20,
            },
            maintenanceLogs: {
              orderBy: { serviceDate: "desc" },
            },
            fuelLogs: {
              orderBy: { fuelDate: "desc" },
            },
            _count: {
              select: {
                tillageOps: true,
                maintenanceLogs: true,
                fuelLogs: true,
              },
            },
          }
        : {
            _count: {
              select: {
                tillageOps: true,
                maintenanceLogs: true,
                fuelLogs: true,
              },
            },
          },
    });

    if (!equipment) {
      return ApiResponseHandler.notFound("Equipment");
    }

    return ApiResponseHandler.success(equipment);
  }
);

export const PUT = ApiResponseHandler.withErrorHandling(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { userId } = await auth();
    ApiResponseHandler.requireAuth(userId);

    const { id } = await params;

    const validatedData = await ApiResponseHandler.validateBody<
      z.infer<typeof updateEquipmentSchema>
    >(request, updateEquipmentSchema);

    // Check if equipment exists and belongs to user
    const existingEquipment = await prisma.equipment.findFirst({
      where: {
        id: id,
        userId,
      },
    });

    if (!existingEquipment) {
      return ApiResponseHandler.notFound("Equipment");
    }

    // Check for duplicate serial number if provided and different from current
    if (
      validatedData.serialNumber &&
      validatedData.serialNumber !== existingEquipment.serialNumber
    ) {
      const duplicateEquipment = await prisma.equipment.findFirst({
        where: {
          userId,
          serialNumber: validatedData.serialNumber,
          id: { not: id },
        },
      });

      if (duplicateEquipment) {
        return ApiResponseHandler.conflict(
          "Equipment with this serial number already exists"
        );
      }
    }

    // Calculate next service due date if service interval is provided
    let nextServiceDue = existingEquipment.nextServiceDue;
    const data = validatedData;
    if (
      data.serviceInterval !== undefined ||
      data.lastServiceDate !== undefined
    ) {
      const serviceInterval =
        data.serviceInterval ?? existingEquipment.serviceInterval;
      const lastServiceDate =
        data.lastServiceDate ?? existingEquipment.lastServiceDate;

      if (serviceInterval && lastServiceDate) {
        nextServiceDue = new Date(lastServiceDate);
        // Add service interval in days (assuming interval is in hours and equipment runs 8 hours per day)
        const intervalDays = Math.ceil(serviceInterval / 8);
        nextServiceDue.setDate(nextServiceDue.getDate() + intervalDays);
      }
    }

    const equipment = await prisma.equipment.update({
      where: { id: id },
      data: {
        ...validatedData,
        nextServiceDue,
      },
      include: {
        tillageOps: {
          include: {
            field: {
              select: { id: true, name: true, area: true, unit: true },
            },
            crop: {
              select: { id: true, name: true, variety: true, status: true },
            },
          },
          orderBy: { operationDate: "desc" },
          take: 20,
        },
        maintenanceLogs: {
          orderBy: { serviceDate: "desc" },
        },
        fuelLogs: {
          orderBy: { fuelDate: "desc" },
        },
        _count: {
          select: {
            tillageOps: true,
            maintenanceLogs: true,
            fuelLogs: true,
          },
        },
      },
    });

    // Log activity with changes
    const changes: Record<string, unknown> = {};
    if (validatedData && typeof validatedData === "object") {
      Object.entries(validatedData).forEach(([key, value]) => {
        if (value !== (existingEquipment as Record<string, unknown>)[key]) {
          changes[key] = {
            from: (existingEquipment as Record<string, unknown>)[key],
            to: value,
          };
        }
      });
    }

    if (Object.keys(changes).length > 0) {
      await ActivityLogger.equipmentUpdated(
        userId,
        id,
        equipment.name,
        changes
      );
    }

    return ApiResponseHandler.success(
      equipment,
      "Equipment updated successfully"
    );
  }
);

export const DELETE = ApiResponseHandler.withErrorHandling(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { userId } = await auth();
    ApiResponseHandler.requireAuth(userId);

    const { id } = await params;

    // Check if equipment exists and belongs to user
    const equipment = await prisma.equipment.findFirst({
      where: {
        id: id,
        userId,
      },
      include: {
        _count: {
          select: {
            tillageOps: true,
            maintenanceLogs: true,
            fuelLogs: true,
          },
        },
      },
    });

    if (!equipment) {
      return ApiResponseHandler.notFound("Equipment");
    }

    // Check for dependencies
    const hasOperations = equipment._count.tillageOps > 0;

    if (hasOperations) {
      return ApiResponseHandler.conflict(
        "Cannot delete equipment that has been used in operations. Consider marking it as retired instead.",
        { operations: equipment._count.tillageOps }
      );
    }

    // Log activity before deletion
    await ActivityLogger.equipmentDeleted(userId, id, equipment.name);

    // Delete the equipment (maintenance and fuel logs will be cascade deleted)
    await prisma.equipment.delete({
      where: { id: id },
    });

    return ApiResponseHandler.success(
      { id: id, name: equipment.name },
      "Equipment deleted successfully"
    );
  }
);
