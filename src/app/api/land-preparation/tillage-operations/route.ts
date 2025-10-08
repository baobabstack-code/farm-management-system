import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createTillageOperationSchema = z.object({
  fieldId: z.string().optional(),
  cropId: z.string().optional(),
  preparationPlanId: z.string().optional(),
  equipmentId: z.string().optional(),
  operationType: z.enum([
    "PRIMARY",
    "SECONDARY",
    "CULTIVATION",
    "SUBSOILING",
    "DISKING",
    "PLOWING",
  ]),
  operationDate: z.string().transform((str) => new Date(str)),
  status: z
    .enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "DELAYED"])
    .default("PLANNED"),
  depth: z.number().min(0),
  depthUnit: z.string().default("inches"),
  speed: z.number().min(0),
  speedUnit: z.string().default("mph"),
  area: z.number().min(0).optional(),
  areaUnit: z.string().default("acres"),
  equipment: z.string(), // Legacy field
  operator: z.string().optional(),
  assistant: z.string().optional(),
  fuelUsed: z.number().min(0),
  fuelCost: z.number().min(0).optional(),
  cost: z.number().min(0),
  soilConditions: z.string(),
  soilMoisture: z.number().min(0).max(100).optional(),
  weatherConditions: z.string().optional(),
  temperature: z.number().optional(),
  windSpeed: z.number().min(0).optional(),
  effectiveness: z.number().int().min(1).max(10).optional(),
  gpsCoordinates: z.any().optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get("fieldId");
    const preparationPlanId = searchParams.get("preparationPlanId");
    const status = searchParams.get("status");
    const operationType = searchParams.get("operationType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const includeStats = searchParams.get("includeStats") === "true";

    const whereClause: any = {
      userId,
      ...(fieldId && { fieldId }),
      ...(preparationPlanId && { preparationPlanId }),
      ...(status && { status }),
      ...(operationType && { operationType }),
      ...(startDate &&
        endDate && {
          operationDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
    };

    const operations = await prisma.tillageOperation.findMany({
      where: whereClause,
      include: {
        field: {
          select: { id: true, name: true, area: true, unit: true },
        },
        crop: {
          select: { id: true, name: true, variety: true },
        },
        preparationPlan: {
          select: { id: true, planName: true, status: true },
        },
        equipmentUsed: {
          select: {
            id: true,
            name: true,
            equipmentType: true,
            condition: true,
          },
        },
      },
      orderBy: { operationDate: "desc" },
    });

    let stats = null;
    if (includeStats) {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      stats = {
        totalOperations: operations.length,
        completedOperations: operations.filter(
          (op) => op.status === "COMPLETED"
        ).length,
        plannedOperations: operations.filter((op) => op.status === "PLANNED")
          .length,
        inProgressOperations: operations.filter(
          (op) => op.status === "IN_PROGRESS"
        ).length,
        recentOperations: operations.filter(
          (op) => op.operationDate >= thirtyDaysAgo
        ).length,
        totalCost: operations.reduce((sum, op) => sum + op.cost, 0),
        totalFuelUsed: operations.reduce((sum, op) => sum + op.fuelUsed, 0),
        totalAreaCovered: operations.reduce(
          (sum, op) => sum + (op.area || 0),
          0
        ),
        avgEffectiveness: operations
          .filter((op) => op.effectiveness)
          .reduce(
            (sum, op, _, arr) => sum + (op.effectiveness || 0) / arr.length,
            0
          ),
        operationsByType: operations.reduce(
          (acc, op) => {
            acc[op.operationType] = (acc[op.operationType] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
        operationsByStatus: operations.reduce(
          (acc, op) => {
            acc[op.status] = (acc[op.status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        operations,
        stats,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching tillage operations:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch operations",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createTillageOperationSchema.parse(body);

    // Verify field ownership if provided
    if (validatedData.fieldId) {
      const field = await prisma.field.findFirst({
        where: { id: validatedData.fieldId, userId },
      });
      if (!field) {
        return NextResponse.json(
          { success: false, error: "Field not found or access denied" },
          { status: 404 }
        );
      }
    }

    // Verify crop ownership if provided
    if (validatedData.cropId) {
      const crop = await prisma.crop.findFirst({
        where: { id: validatedData.cropId, userId },
      });
      if (!crop) {
        return NextResponse.json(
          { success: false, error: "Crop not found or access denied" },
          { status: 404 }
        );
      }
    }

    // Verify preparation plan ownership if provided
    if (validatedData.preparationPlanId) {
      const plan = await prisma.landPreparationPlan.findFirst({
        where: { id: validatedData.preparationPlanId, userId },
      });
      if (!plan) {
        return NextResponse.json(
          {
            success: false,
            error: "Preparation plan not found or access denied",
          },
          { status: 404 }
        );
      }
    }

    // Verify equipment ownership if provided
    if (validatedData.equipmentId) {
      const equipment = await prisma.equipment.findFirst({
        where: { id: validatedData.equipmentId, userId },
      });
      if (!equipment) {
        return NextResponse.json(
          { success: false, error: "Equipment not found or access denied" },
          { status: 404 }
        );
      }
    }

    const operation = await prisma.tillageOperation.create({
      data: {
        ...validatedData,
        userId,
      },
      include: {
        field: {
          select: { id: true, name: true, area: true, unit: true },
        },
        crop: {
          select: { id: true, name: true, variety: true },
        },
        preparationPlan: {
          select: { id: true, planName: true, status: true },
        },
        equipmentUsed: {
          select: {
            id: true,
            name: true,
            equipmentType: true,
            condition: true,
          },
        },
      },
    });

    // Update equipment hours if equipment is tracked
    if (validatedData.equipmentId && validatedData.area) {
      const estimatedHours = validatedData.area / (validatedData.speed || 1); // Simple calculation
      await prisma.equipment.update({
        where: { id: validatedData.equipmentId },
        data: {
          hoursUsed: {
            increment: estimatedHours,
          },
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: operation,
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating tillage operation:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create operation",
      },
      { status: 500 }
    );
  }
}
