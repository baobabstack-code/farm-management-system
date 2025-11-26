import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ActivityLogger } from "@/lib/activity-logger";
import { ApiResponseHandler } from "@/lib/api-response-handler";

const updateFieldSchema = z.object({
  name: z.string().min(1, "Field name is required").optional(),
  description: z.string().optional(),
  area: z.number().min(0, "Area must be positive").optional(),
  unit: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.string().optional(),
  boundaries: z.unknown().optional(), // GeoJSON polygon
  soilType: z.string().optional(),
  drainageType: z.string().optional(),
  irrigationType: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/fields/[id] - Get specific field with full details
export const GET = ApiResponseHandler.withErrorHandling(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const { userId } = await auth();
    ApiResponseHandler.requireAuth(userId);

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
      return ApiResponseHandler.notFound("Field");
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

    return ApiResponseHandler.success({
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
  }
);

// PUT /api/fields/[id] - Update field
export const PUT = ApiResponseHandler.withErrorHandling(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const { userId } = await auth();
    ApiResponseHandler.requireAuth(userId);

    const validatedData = await ApiResponseHandler.validateBody(
      request,
      updateFieldSchema
    );

    // Check if field exists and belongs to user
    const existingField = await prisma.field.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingField) {
      return ApiResponseHandler.notFound("Field");
    }

    const updatedField = await prisma.field.update({
      where: { id },
      data: validatedData as any,
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

    // Log activity with changes
    const changes: Record<string, unknown> = {};
    if (validatedData && typeof validatedData === "object") {
      Object.entries(validatedData).forEach(([key, value]) => {
        if (value !== (existingField as Record<string, unknown>)[key]) {
          changes[key] = {
            from: (existingField as Record<string, unknown>)[key],
            to: value,
          };
        }
      });
    }

    if (Object.keys(changes).length > 0) {
      await ActivityLogger.fieldUpdated(userId, id, updatedField.name, changes);
    }

    return ApiResponseHandler.success(
      updatedField,
      "Field updated successfully"
    );
  }
);

// DELETE /api/fields/[id] - Deactivate field (soft delete)
export const DELETE = ApiResponseHandler.withErrorHandling(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const { userId } = await auth();
    ApiResponseHandler.requireAuth(userId);

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
      return ApiResponseHandler.notFound("Field");
    }

    // Check if field has active crops
    const activeCrops = await prisma.crop.count({
      where: {
        fieldId: id,
        status: { not: "COMPLETED" },
      },
    });

    if (activeCrops > 0) {
      return ApiResponseHandler.conflict(
        "Cannot delete field with active crops",
        { activeCrops: activeCrops }
      );
    }

    // Log activity before deletion
    await ActivityLogger.fieldDeleted(userId, id, existingField.name);

    // Soft delete - deactivate the field
    await prisma.field.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return ApiResponseHandler.success(
      { id, name: existingField.name },
      "Field deactivated successfully"
    );
  }
);
