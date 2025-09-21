import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ActivityService } from "@/lib/db";
import { harvestLogCreateSchema } from "@/lib/validations/activity";

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cropId = searchParams.get("cropId");

    const logs = await ActivityService.getHarvestLogs(
      userId,
      cropId || undefined
    );

    return NextResponse.json({
      success: true,
      data: logs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching harvest logs:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = harvestLogCreateSchema.parse(body);

    const log = await ActivityService.createHarvestLog({
      userId: userId,
      cropId: validatedData.cropId,
      harvestDate: new Date(validatedData.harvestDate),
      quantity: validatedData.quantity,
      unit: validatedData.unit,
      qualityGrade: validatedData.qualityGrade,
      notes: validatedData.notes,
    });

    return NextResponse.json(
      {
        success: true,
        data: log,
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating harvest log:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input data",
          details: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
