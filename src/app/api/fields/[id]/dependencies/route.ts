import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: fieldId } = await params;

    // Check if field exists and belongs to user
    const field = await prisma.field.findFirst({
      where: {
        id: fieldId,
        userId: userId,
      },
    });

    if (!field) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    // Check for dependencies
    const dependencies = [];

    // Check for crops - these are blocking dependencies
    const cropCount = await prisma.crop.count({
      where: { fieldId: fieldId },
    });
    if (cropCount > 0) {
      dependencies.push({
        entity: "Crops",
        count: cropCount,
        blocking: true, // Cannot delete field with active crops
      });
    }

    // Check for soil tests
    const soilTestCount = await prisma.soilTest.count({
      where: { fieldId: fieldId },
    });
    if (soilTestCount > 0) {
      dependencies.push({
        entity: "Soil Tests",
        count: soilTestCount,
        blocking: false, // Soil tests can be deleted with field
      });
    }

    // Check for soil amendments
    const soilAmendmentCount = await prisma.soilAmendment.count({
      where: { fieldId: fieldId },
    });
    if (soilAmendmentCount > 0) {
      dependencies.push({
        entity: "Soil Amendments",
        count: soilAmendmentCount,
        blocking: false, // Amendments can be deleted with field
      });
    }

    // Check for tillage operations
    const tillageOpCount = await prisma.tillageOperation.count({
      where: { fieldId: fieldId },
    });
    if (tillageOpCount > 0) {
      dependencies.push({
        entity: "Tillage Operations",
        count: tillageOpCount,
        blocking: false, // Operations can be deleted with field
      });
    }

    // Check for cost entries
    const costEntryCount = await prisma.costEntry.count({
      where: { fieldId: fieldId },
    });
    if (costEntryCount > 0) {
      dependencies.push({
        entity: "Cost Entries",
        count: costEntryCount,
        blocking: false, // Cost entries can be deleted with field
      });
    }

    const hasBlockingDependencies = dependencies.some((dep) => dep.blocking);
    const canDelete = !hasBlockingDependencies;

    return NextResponse.json({
      success: true,
      data: {
        canDelete,
        dependencies,
        warnings: hasBlockingDependencies
          ? ["Please remove or reassign all crops before deleting this field."]
          : dependencies.length > 0
            ? [
                "All associated data will be permanently deleted with this field.",
              ]
            : [],
      },
    });
  } catch (error) {
    console.error("Error checking field dependencies:", error);
    return NextResponse.json(
      { error: "Failed to check dependencies" },
      { status: 500 }
    );
  }
}
