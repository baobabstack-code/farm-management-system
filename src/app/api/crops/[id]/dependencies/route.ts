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

    const { id: cropId } = await params;

    // Check if crop exists and belongs to user
    const crop = await prisma.crop.findFirst({
      where: {
        id: cropId,
        userId: userId,
      },
    });

    if (!crop) {
      return NextResponse.json({ error: "Crop not found" }, { status: 404 });
    }

    // Check for dependencies
    const dependencies = [];

    // Check for tasks
    const taskCount = await prisma.task.count({
      where: { cropId: cropId },
    });
    if (taskCount > 0) {
      dependencies.push({
        entity: "Tasks",
        count: taskCount,
        blocking: false, // Tasks can be deleted with crop
      });
    }

    // Check for irrigation logs
    const irrigationCount = await prisma.irrigationLog.count({
      where: { cropId: cropId },
    });
    if (irrigationCount > 0) {
      dependencies.push({
        entity: "Irrigation Logs",
        count: irrigationCount,
        blocking: false, // Logs can be deleted with crop
      });
    }

    // Check for fertilizer logs
    const fertilizerCount = await prisma.fertilizerLog.count({
      where: { cropId: cropId },
    });
    if (fertilizerCount > 0) {
      dependencies.push({
        entity: "Fertilizer Logs",
        count: fertilizerCount,
        blocking: false, // Logs can be deleted with crop
      });
    }

    // Check for pest/disease logs
    const pestDiseaseCount = await prisma.pestDiseaseLog.count({
      where: { cropId: cropId },
    });
    if (pestDiseaseCount > 0) {
      dependencies.push({
        entity: "Pest/Disease Logs",
        count: pestDiseaseCount,
        blocking: false, // Logs can be deleted with crop
      });
    }

    // Check for harvest logs
    const harvestCount = await prisma.harvestLog.count({
      where: { cropId: cropId },
    });
    if (harvestCount > 0) {
      dependencies.push({
        entity: "Harvest Records",
        count: harvestCount,
        blocking: false, // Harvest logs can be deleted with crop
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        canDelete: true, // Crops can always be deleted (no blocking dependencies)
        dependencies,
        warnings:
          dependencies.length > 0
            ? [
                "All associated data will be permanently deleted with this crop.",
              ]
            : [],
      },
    });
  } catch (error) {
    console.error("Error checking crop dependencies:", error);
    return NextResponse.json(
      { error: "Failed to check dependencies" },
      { status: 500 }
    );
  }
}
