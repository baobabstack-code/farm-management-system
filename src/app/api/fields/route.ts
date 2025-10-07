import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createFieldSchema = z.object({
  name: z.string().min(1, "Field name is required"),
  description: z.string().optional(),
  area: z.number().min(0, "Area must be positive"),
  unit: z.string().default("acres"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.string().optional(),
  boundaries: z.any().optional(), // GeoJSON polygon
  soilType: z.string().optional(),
  drainageType: z.string().optional(),
  irrigationType: z.string().optional(),
});

const updateFieldSchema = createFieldSchema.partial();

// GET /api/fields - Get all fields for user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get("includeStats") === "true";
    const isActive = searchParams.get("isActive");

    const where: any = { userId };
    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    const fields = await prisma.field.findMany({
      where,
      include: {
        crops: includeStats,
        soilTests: includeStats
          ? {
              orderBy: { createdAt: "desc" },
              take: 1,
            }
          : false,
        tillageOps: includeStats
          ? {
              orderBy: { createdAt: "desc" },
              take: 5,
            }
          : false,
        _count: includeStats
          ? {
              select: {
                crops: true,
                soilTests: true,
                soilAmendments: true,
                tillageOps: true,
                costEntries: true,
              },
            }
          : false,
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate additional statistics if requested
    if (includeStats) {
      const fieldsWithStats = await Promise.all(
        fields.map(async (field) => {
          const [activeCropsCount, totalCosts, recentActivity] =
            await Promise.all([
              prisma.crop.count({
                where: {
                  fieldId: field.id,
                  status: { not: "COMPLETED" },
                },
              }),
              prisma.costEntry.aggregate({
                where: { fieldId: field.id },
                _sum: { amount: true },
              }),
              prisma.tillageOperation.findMany({
                where: { fieldId: field.id },
                orderBy: { createdAt: "desc" },
                take: 3,
                select: {
                  operationType: true,
                  operationDate: true,
                  createdAt: true,
                },
              }),
            ]);

          return {
            ...field,
            stats: {
              activeCropsCount,
              totalCosts: totalCosts._sum.amount || 0,
              recentActivity,
            },
          };
        })
      );

      return NextResponse.json(fieldsWithStats);
    }

    return NextResponse.json(fields);
  } catch (error) {
    console.error("Get fields error:", error);
    return NextResponse.json(
      { error: "Failed to fetch fields" },
      { status: 500 }
    );
  }
}

// POST /api/fields - Create new field
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createFieldSchema.parse(body);

    const field = await prisma.field.create({
      data: {
        userId,
        ...validatedData,
      },
      include: {
        _count: {
          select: {
            crops: true,
            soilTests: true,
          },
        },
      },
    });

    return NextResponse.json(field, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Create field error:", error);
    return NextResponse.json(
      { error: "Failed to create field" },
      { status: 500 }
    );
  }
}
