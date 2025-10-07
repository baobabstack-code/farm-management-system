import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const rotationPhaseSchema = z.object({
  phaseNumber: z.number().int().min(1),
  cropName: z.string().min(1),
  variety: z.string().optional(),
  plantingWindow: z.string(),
  expectedDuration: z.number().int().min(1),
  soilRequirements: z.any().optional(),
  nutrients: z.any().optional(),
  waterRequirements: z.number().optional(),
  laborRequirements: z.number().optional(),
  expectedYield: z.number().optional(),
  marketValue: z.number().optional(),
  notes: z.string().optional(),
});

const soilBenefitSchema = z.object({
  benefitType: z.enum([
    "NITROGEN_FIXATION",
    "ORGANIC_MATTER",
    "EROSION_CONTROL",
    "PEST_SUPPRESSION",
    "WEED_SUPPRESSION",
    "SOIL_STRUCTURE",
    "WATER_RETENTION",
    "NUTRIENT_CYCLING",
  ]),
  description: z.string().min(1),
  measurableImpact: z.string().optional(),
  timeFrame: z.string(),
});

const createRotationPlanSchema = z.object({
  planId: z.string().optional(),
  fieldId: z.string().min(1, "Field ID is required"),
  rotationName: z.string().min(1, "Rotation name is required"),
  description: z.string().optional(),
  rotationYears: z.number().int().min(2).max(10).default(4),
  startYear: z.number().int().min(2020).max(2050),
  rotationType: z
    .enum(["SEQUENTIAL", "INTERCROPPING", "COVER_CROP", "FALLOW", "MIXED"])
    .default("SEQUENTIAL"),
  rotationPhases: z
    .array(rotationPhaseSchema)
    .min(2, "At least 2 rotation phases required"),
  soilBenefits: z.array(soilBenefitSchema).optional().default([]),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get("fieldId");
    const planId = searchParams.get("planId");
    const isActive = searchParams.get("isActive");

    const whereClause: any = {
      userId,
      ...(fieldId && { fieldId }),
      ...(planId && { planId }),
      ...(isActive !== null && { isActive: isActive === "true" }),
    };

    const rotationPlans = await prisma.cropRotationPlan.findMany({
      where: whereClause,
      include: {
        field: {
          select: {
            id: true,
            name: true,
            area: true,
            unit: true,
            soilType: true,
          },
        },
        plan: {
          select: { id: true, planName: true, year: true, season: true },
        },
        rotationPhases: {
          orderBy: { phaseNumber: "asc" },
        },
        soilBenefits: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate summary statistics
    const stats = {
      totalRotations: rotationPlans.length,
      activeRotations: rotationPlans.filter((r) => r.isActive).length,
      fieldsWithRotation: new Set(rotationPlans.map((r) => r.fieldId)).size,
      avgRotationYears:
        rotationPlans.length > 0
          ? rotationPlans.reduce((sum, r) => sum + r.rotationYears, 0) /
            rotationPlans.length
          : 0,
      rotationTypes: rotationPlans.reduce(
        (acc, r) => {
          acc[r.rotationType] = (acc[r.rotationType] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    };

    return NextResponse.json({
      success: true,
      data: {
        rotationPlans,
        stats,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching crop rotation plans:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch rotation plans",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createRotationPlanSchema.parse(body);

    // Verify field exists and belongs to user
    const field = await prisma.field.findFirst({
      where: { id: validatedData.fieldId, userId },
    });

    if (!field) {
      return NextResponse.json(
        { success: false, error: "Field not found or access denied" },
        { status: 404 }
      );
    }

    // If planId is provided, verify it exists and belongs to user
    if (validatedData.planId) {
      const plan = await prisma.preSeasonPlan.findFirst({
        where: { id: validatedData.planId, userId },
      });

      if (!plan) {
        return NextResponse.json(
          { success: false, error: "Plan not found or access denied" },
          { status: 404 }
        );
      }
    }

    // Check for existing rotation plan for the same field and year
    const existingRotation = await prisma.cropRotationPlan.findFirst({
      where: {
        userId,
        fieldId: validatedData.fieldId,
        rotationName: validatedData.rotationName,
      },
    });

    if (existingRotation) {
      return NextResponse.json(
        {
          success: false,
          error: "Rotation plan with this name already exists for this field",
        },
        { status: 409 }
      );
    }

    // Create rotation plan with phases and benefits
    const { rotationPhases, soilBenefits, ...rotationData } = validatedData;

    const rotationPlan = await prisma.cropRotationPlan.create({
      data: {
        ...rotationData,
        userId,
        rotationPhases: {
          create: rotationPhases,
        },
        soilBenefits: {
          create: soilBenefits,
        },
      },
      include: {
        field: {
          select: { id: true, name: true, area: true, unit: true },
        },
        plan: {
          select: { id: true, planName: true, year: true, season: true },
        },
        rotationPhases: {
          orderBy: { phaseNumber: "asc" },
        },
        soilBenefits: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: rotationPlan,
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating crop rotation plan:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create rotation plan",
      },
      { status: 500 }
    );
  }
}
