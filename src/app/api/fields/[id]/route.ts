import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateFieldSchema = z.object({
  name: z.string().min(1, "Field name is required").optional(),
  description: z.string().optional(),
  area: z.number().min(0, "Area must be positive").optional(),
  unit: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.string().optional(),
  boundaries: z.any().optional(), // GeoJSON polygon
  soilType: z.string().optional(),
  drainageType: z.string().optional(),
  irrigationType: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/fields/[id] - Get specific field with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const field = await prisma.field.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        crops: {
          orderBy: { createdAt: "desc" },
          include: {
            harvestLogs: {
              orderBy: { createdAt: "desc" },
              take: 5,
            },
          },
        },
        soilTests: {
          orderBy: { sampleDate: "desc" },
        },
        soilAmendments: {
          orderBy: { applicationDate: "desc" },
        },
        tillageOps: {
          orderBy: { operationDate: "desc" },
        },
        costEntries: {
          orderBy: { date: "desc" },
          include: {
            category: {
              select: { name: true },
            },
            supplier: {
              select: { name: true },
            },
          },
        },
        _count: {
          select: {
            crops: true,
            soilTests: true,
            soilAmendments: true,
            tillageOps: true,
            costEntries: true,
          },
        },
      },
    });

    if (!field) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    // Calculate field analytics
    const [fieldAnalytics, currentSeasonCrops, costSummary] = await Promise.all(
      [
        // Field productivity analytics
        prisma.crop.aggregate({
          where: {
            fieldId: field.id,
            status: "COMPLETED",
          },
          _avg: {
            area: true,
          },
          _count: true,
        }),

        // Current season active crops
        prisma.crop.findMany({
          where: {
            fieldId: field.id,
            status: { not: "COMPLETED" },
          },
          include: {
            harvestLogs: true,
          },
        }),

        // Cost analysis by category
        prisma.costEntry.groupBy({
          by: ["categoryId"],
          where: { fieldId: field.id },
          _sum: { amount: true },
          _count: true,
        }),
      ]
    );

    // Get soil health trends (last 5 soil tests)
    const soilHealthTrend = field.soilTests.slice(0, 5).map((test) => ({
      date: test.sampleDate,
      pH: test.pH,
      organicMatter: test.organicMatter,
      nitrogen: test.nitrogen,
      phosphorus: test.phosphorus,
      potassium: test.potassium,
    }));

    return NextResponse.json({
      ...field,
      analytics: {
        fieldAnalytics,
        currentSeasonCrops,
        costSummary,
        soilHealthTrend,
        utilizationRate:
          fieldAnalytics._count > 0
            ? (currentSeasonCrops.length / fieldAnalytics._count) * 100
            : 0,
      },
    });
  } catch (error) {
    console.error("Get field error:", error);
    return NextResponse.json(
      { error: "Failed to fetch field" },
      { status: 500 }
    );
  }
}

// PUT /api/fields/[id] - Update field
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateFieldSchema.parse(body);

    // Check if field exists and belongs to user
    const existingField = await prisma.field.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingField) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    const updatedField = await prisma.field.update({
      where: { id },
      data: validatedData,
      include: {
        _count: {
          select: {
            crops: true,
            soilTests: true,
            soilAmendments: true,
            tillageOps: true,
            costEntries: true,
          },
        },
      },
    });

    return NextResponse.json(updatedField);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Update field error:", error);
    return NextResponse.json(
      { error: "Failed to update field" },
      { status: 500 }
    );
  }
}

// DELETE /api/fields/[id] - Deactivate field (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if field exists and belongs to user
    const existingField = await prisma.field.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        _count: {
          select: {
            crops: true,
          },
        },
      },
    });

    if (!existingField) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    // Check if field has active crops
    const activeCrops = await prisma.crop.count({
      where: {
        fieldId: id,
        status: { not: "COMPLETED" },
      },
    });

    if (activeCrops > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete field with active crops",
          details: `${activeCrops} active crop(s) found`,
        },
        { status: 400 }
      );
    }

    // Soft delete - deactivate the field
    await prisma.field.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Field deactivated successfully",
    });
  } catch (error) {
    console.error("Delete field error:", error);
    return NextResponse.json(
      { error: "Failed to deactivate field" },
      { status: 500 }
    );
  }
}
