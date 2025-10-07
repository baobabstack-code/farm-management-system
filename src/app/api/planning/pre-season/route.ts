import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createPlanSchema = z.object({
  planName: z.string().min(1, "Plan name is required"),
  season: z.string().min(1, "Season is required"),
  year: z.number().int().min(2020).max(2050),
  description: z.string().optional(),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  totalBudget: z.number().min(0),
  expectedRevenue: z.number().min(0),
  riskAssessment: z.string().optional(),
  weatherRisk: z.string().optional(),
  marketRisk: z.string().optional(),
  operationalRisk: z.string().optional(),
  mitigationPlan: z.string().optional(),
  notes: z.string().optional(),
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
    const includeDetails = searchParams.get("includeDetails") === "true";
    const status = searchParams.get("status");
    const year = searchParams.get("year");

    const whereClause: any = {
      userId,
      ...(status && { status }),
      ...(year && { year: parseInt(year) }),
    };

    const plans = await prisma.preSeasonPlan.findMany({
      where: whereClause,
      include: includeDetails
        ? {
            plannedCrops: {
              include: {
                field: {
                  select: { id: true, name: true, area: true, unit: true },
                },
                resourceAllocations: true,
              },
            },
            rotationPlans: {
              include: {
                field: {
                  select: { id: true, name: true },
                },
                rotationPhases: true,
                soilBenefits: true,
              },
            },
            resourceAllocations: true,
            seasonalTasks: true,
            _count: {
              select: {
                plannedCrops: true,
                rotationPlans: true,
                resourceAllocations: true,
                seasonalTasks: true,
              },
            },
          }
        : {
            _count: {
              select: {
                plannedCrops: true,
                rotationPlans: true,
                resourceAllocations: true,
                seasonalTasks: true,
              },
            },
          },
      orderBy: { createdAt: "desc" },
    });

    // Calculate summary statistics
    const stats = {
      totalPlans: plans.length,
      draftPlans: plans.filter((p) => p.status === "DRAFT").length,
      activePlans: plans.filter(
        (p) => p.status === "IN_PROGRESS" || p.status === "APPROVED"
      ).length,
      completedPlans: plans.filter((p) => p.status === "COMPLETED").length,
      totalBudget: plans.reduce((sum, p) => sum + p.totalBudget, 0),
      totalExpectedRevenue: plans.reduce(
        (sum, p) => sum + p.expectedRevenue,
        0
      ),
    };

    return NextResponse.json({
      success: true,
      data: {
        plans,
        stats,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching pre-season plans:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch plans",
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
    const validatedData = createPlanSchema.parse(body);

    // Check if plan with same name and year already exists
    const existingPlan = await prisma.preSeasonPlan.findFirst({
      where: {
        userId,
        planName: validatedData.planName,
        year: validatedData.year,
      },
    });

    if (existingPlan) {
      return NextResponse.json(
        {
          success: false,
          error: "Plan with this name already exists for the specified year",
        },
        { status: 409 }
      );
    }

    const plan = await prisma.preSeasonPlan.create({
      data: {
        ...validatedData,
        userId,
      },
      include: {
        _count: {
          select: {
            plannedCrops: true,
            rotationPlans: true,
            resourceAllocations: true,
            seasonalTasks: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: plan,
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating pre-season plan:", error);

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
        error: error instanceof Error ? error.message : "Failed to create plan",
      },
      { status: 500 }
    );
  }
}
