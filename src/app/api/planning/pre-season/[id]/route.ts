import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updatePlanSchema = z.object({
  planName: z.string().min(1, "Plan name is required").optional(),
  season: z.string().min(1, "Season is required").optional(),
  year: z.number().int().min(2020).max(2050).optional(),
  description: z.string().optional(),
  startDate: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  endDate: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  totalBudget: z.number().min(0).optional(),
  expectedRevenue: z.number().min(0).optional(),
  status: z
    .enum(["DRAFT", "IN_PROGRESS", "APPROVED", "COMPLETED", "ARCHIVED"])
    .optional(),
  riskAssessment: z.string().optional(),
  weatherRisk: z.string().optional(),
  marketRisk: z.string().optional(),
  operationalRisk: z.string().optional(),
  mitigationPlan: z.string().optional(),
  approvedBy: z.string().optional(),
  approvedAt: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  notes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const params = await context.params;
    const { id } = params;

    const plan = await prisma.preSeasonPlan.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        plannedCrops: {
          include: {
            field: {
              select: { id: true, name: true, area: true, unit: true },
            },
            resourceAllocations: {
              orderBy: { priority: "asc" },
            },
          },
          orderBy: { priority: "asc" },
        },
        rotationPlans: {
          include: {
            field: {
              select: { id: true, name: true, area: true, unit: true },
            },
            rotationPhases: {
              orderBy: { phaseNumber: "asc" },
            },
            soilBenefits: true,
          },
        },
        resourceAllocations: {
          where: { plannedCropId: null },
          orderBy: { priority: "asc" },
        },
        seasonalTasks: {
          orderBy: [{ priority: "desc" }, { plannedStartDate: "asc" }],
        },
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

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Plan not found" },
        { status: 404 }
      );
    }

    // Calculate additional statistics
    const stats = {
      totalPlannedArea: plan.plannedCrops.reduce(
        (sum, crop) => sum + crop.plannedArea,
        0
      ),
      totalEstimatedCosts: plan.plannedCrops.reduce(
        (sum, crop) => sum + crop.estimatedCosts,
        0
      ),
      totalEstimatedRevenue: plan.plannedCrops.reduce(
        (sum, crop) => sum + crop.estimatedRevenue,
        0
      ),
      profitMargin: 0,
      totalResourceCost: plan.resourceAllocations.reduce(
        (sum, res) => sum + res.totalCost,
        0
      ),
      completedTasks: plan.seasonalTasks.filter(
        (task) => task.status === "COMPLETED"
      ).length,
      pendingTasks: plan.seasonalTasks.filter(
        (task) => task.status === "PENDING"
      ).length,
      overdueTasks: plan.seasonalTasks.filter(
        (task) =>
          task.status !== "COMPLETED" &&
          task.plannedEndDate &&
          new Date(task.plannedEndDate) < new Date()
      ).length,
    };

    stats.profitMargin =
      stats.totalEstimatedRevenue > 0
        ? ((stats.totalEstimatedRevenue - stats.totalEstimatedCosts) /
            stats.totalEstimatedRevenue) *
          100
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        ...plan,
        stats,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching pre-season plan:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch plan",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const params = await context.params;
    const { id } = params;
    const body = await request.json();
    const validatedData = updatePlanSchema.parse(body);

    // Verify plan exists and belongs to user
    const existingPlan = await prisma.preSeasonPlan.findFirst({
      where: { id, userId },
    });

    if (!existingPlan) {
      return NextResponse.json(
        { success: false, error: "Plan not found" },
        { status: 404 }
      );
    }

    // If updating name/year, check for conflicts
    if (validatedData.planName || validatedData.year) {
      const planName = validatedData.planName || existingPlan.planName;
      const year = validatedData.year || existingPlan.year;

      const conflictingPlan = await prisma.preSeasonPlan.findFirst({
        where: {
          userId,
          planName,
          year,
          id: { not: id },
        },
      });

      if (conflictingPlan) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Another plan with this name already exists for the specified year",
          },
          { status: 409 }
        );
      }
    }

    const updatedPlan = await prisma.preSeasonPlan.update({
      where: { id },
      data: validatedData,
      include: {
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
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedPlan,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating pre-season plan:", error);

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
        error: error instanceof Error ? error.message : "Failed to update plan",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const params = await context.params;
    const { id } = params;

    // Verify plan exists and belongs to user
    const existingPlan = await prisma.preSeasonPlan.findFirst({
      where: { id, userId },
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

    if (!existingPlan) {
      return NextResponse.json(
        { success: false, error: "Plan not found" },
        { status: 404 }
      );
    }

    // Check if plan has associated data (for safety)
    const hasAssociatedData = Object.values(existingPlan._count).some(
      (count) => count > 0
    );

    if (hasAssociatedData && existingPlan.status !== "DRAFT") {
      // Archive instead of delete if plan has data and is not a draft
      const archivedPlan = await prisma.preSeasonPlan.update({
        where: { id },
        data: { status: "ARCHIVED" },
      });

      return NextResponse.json({
        success: true,
        data: { archived: true, plan: archivedPlan },
        message: "Plan archived instead of deleted due to associated data",
        timestamp: new Date().toISOString(),
      });
    }

    // Delete the plan (cascade will handle related records)
    await prisma.preSeasonPlan.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { deleted: true },
      message: "Plan deleted successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error deleting pre-season plan:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete plan",
      },
      { status: 500 }
    );
  }
}
