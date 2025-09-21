import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { CropService } from "@/lib/db";
import { cropCreateSchema } from "@/lib/validations/crop";

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const crops = await CropService.findAllByUser(userId);

    return NextResponse.json({
      success: true,
      data: crops,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching crops:", error);
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
    const validatedData = cropCreateSchema.parse(body);

    const crop = await CropService.create({
      userId: userId,
      name: validatedData.name,
      variety: validatedData.variety,
      plantingDate: new Date(validatedData.plantingDate),
      expectedHarvestDate: new Date(validatedData.expectedHarvestDate),
      area: validatedData.area,
    });

    return NextResponse.json(
      {
        success: true,
        data: crop,
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating crop:", error);

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
