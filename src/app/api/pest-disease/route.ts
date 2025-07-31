import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ActivityService } from "@/lib/db";
import { pestDiseaseLogCreateSchema } from "@/lib/validations/activity";
import { PestDiseaseType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cropId = searchParams.get("cropId");
    const type = searchParams.get("type") as PestDiseaseType | null;

    const logs = await ActivityService.getPestDiseaseLogs(
      session.user.id,
      cropId || undefined,
      type || undefined
    );

    return NextResponse.json({
      success: true,
      data: logs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching pest/disease logs:", error);
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = pestDiseaseLogCreateSchema.parse(body);

    const log = await ActivityService.createPestDiseaseLog({
      userId: session.user.id,
      cropId: validatedData.cropId,
      date: new Date(validatedData.date),
      type: validatedData.type,
      name: validatedData.name,
      severity: validatedData.severity,
      affectedArea: validatedData.affectedArea,
      treatment: validatedData.treatment,
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
    console.error("Error creating pest/disease log:", error);

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
