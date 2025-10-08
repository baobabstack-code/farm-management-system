import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { SoilService } from "@/lib/services/soil-service";
import { z } from "zod";

const soilAmendmentCreateSchema = z.object({
  cropId: z.string().optional(),
  fieldId: z.string().optional(),
  amendmentType: z.string().min(1, "Amendment type is required"),
  applicationDate: z.string(),
  rate: z.number().min(0),
  unit: z.string().min(1, "Unit is required"),
  cost: z.number().min(0),
  supplier: z.string().optional(),
  method: z.string().min(1, "Application method is required"),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cropId = searchParams.get("cropId") || undefined;
    const fieldId = searchParams.get("fieldId") || undefined;
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined;
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : undefined;

    const amendments = await SoilService.getSoilAmendmentsForUser(userId, {
      cropId,
      fieldId,
      startDate,
      endDate,
    });

    return NextResponse.json({
      success: true,
      data: amendments,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Soil amendments API error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch soil amendments",
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
    const validatedData = soilAmendmentCreateSchema.parse(body);

    const amendment = await SoilService.createSoilAmendment({
      ...validatedData,
      userId,
      applicationDate: new Date(validatedData.applicationDate),
    });

    return NextResponse.json(
      {
        success: true,
        data: amendment,
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create soil amendment API error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.issues,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create soil amendment",
      },
      { status: 500 }
    );
  }
}
