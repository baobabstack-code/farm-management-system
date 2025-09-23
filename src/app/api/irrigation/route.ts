import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ActivityService } from "@/lib/db";
import { irrigationLogCreateSchema } from "@/lib/validations/activity";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cropId = searchParams.get("cropId");

    const logs = await ActivityService.getIrrigationLogs(
      userId,
      cropId || undefined
    );

    return NextResponse.json({
      success: true,
      data: logs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching irrigation logs:", error);
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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = irrigationLogCreateSchema.parse(body);

    const log = await ActivityService.createIrrigationLog({
      userId: userId,
      cropId: validatedData.cropId,
      date: new Date(validatedData.date),
      duration: validatedData.duration,
      waterAmount: validatedData.waterAmount,
      method: validatedData.method,
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
    console.error("Error creating irrigation log:", error);

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
