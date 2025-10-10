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

    const { id: equipmentId } = await params;

    // Check if equipment exists and belongs to user
    const equipment = await prisma.equipment.findFirst({
      where: {
        id: equipmentId,
        userId: userId,
      },
    });

    if (!equipment) {
      return NextResponse.json(
        { error: "Equipment not found" },
        { status: 404 }
      );
    }

    // Check for dependencies
    const dependencies = [];

    // Check for maintenance logs
    const maintenanceCount = await prisma.maintenanceLog.count({
      where: { equipmentId: equipmentId },
    });
    if (maintenanceCount > 0) {
      dependencies.push({
        entity: "Maintenance Logs",
        count: maintenanceCount,
        blocking: false, // Maintenance logs can be deleted with equipment
      });
    }

    // Check for fuel logs
    const fuelLogCount = await prisma.fuelLog.count({
      where: { equipmentId: equipmentId },
    });
    if (fuelLogCount > 0) {
      dependencies.push({
        entity: "Fuel Logs",
        count: fuelLogCount,
        blocking: false, // Fuel logs can be deleted with equipment
      });
    }

    // Check for tillage operations (equipment usage)
    const tillageOpCount = await prisma.tillageOperation.count({
      where: { equipment: equipment.name }, // Assuming equipment name is used in operations
    });
    if (tillageOpCount > 0) {
      dependencies.push({
        entity: "Field Operations",
        count: tillageOpCount,
        blocking: true, // Cannot delete equipment that's been used in operations
      });
    }

    // Check for cost entries related to this equipment
    const costEntryCount = await prisma.costEntry.count({
      where: {
        description: {
          contains: equipment.name,
          mode: "insensitive",
        },
      },
    });
    if (costEntryCount > 0) {
      dependencies.push({
        entity: "Cost Entries",
        count: costEntryCount,
        blocking: false, // Cost entries can be updated or deleted
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
          ? [
              "This equipment has been used in field operations and cannot be deleted. Consider marking it as retired instead.",
            ]
          : dependencies.length > 0
            ? [
                "All associated maintenance and fuel logs will be permanently deleted with this equipment.",
              ]
            : [],
      },
    });
  } catch (error) {
    console.error("Error checking equipment dependencies:", error);
    return NextResponse.json(
      { error: "Failed to check dependencies" },
      { status: 500 }
    );
  }
}
