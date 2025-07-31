import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CropService } from "@/lib/db";
import { cropUpdateSchema } from "@/lib/validations/crop";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const crop = await CropService.findById(params.id, session.user.id);

    if (!crop) {
      return NextResponse.json(
        {
          success: false,
          error: "Crop not found",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: crop,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching crop:", error);
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = cropUpdateSchema.parse(body);

    // Check if crop exists and belongs to user
    const existingCrop = await CropService.findById(params.id, session.user.id);
    if (!existingCrop) {
      return NextResponse.json(
        {
          success: false,
          error: "Crop not found",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const updatedCrop = await CropService.update(
      params.id,
      session.user.id,
      validatedData
    );

    return NextResponse.json({
      success: true,
      data: updatedCrop,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating crop:", error);

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if crop exists and belongs to user
    const existingCrop = await CropService.findById(params.id, session.user.id);
    if (!existingCrop) {
      return NextResponse.json(
        {
          success: false,
          error: "Crop not found",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    await CropService.delete(params.id, session.user.id);

    return NextResponse.json({
      success: true,
      message: "Crop deleted successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error deleting crop:", error);
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
