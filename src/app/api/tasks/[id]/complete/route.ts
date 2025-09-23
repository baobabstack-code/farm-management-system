import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { TaskService } from "@/lib/db";
import { taskCompleteSchema } from "@/lib/validations/task";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = taskCompleteSchema.parse(body);
    const { id } = await params;

    // Check if task exists and belongs to user
    const existingTask = await TaskService.findById(id, userId);
    if (!existingTask) {
      return NextResponse.json(
        {
          success: false,
          error: "Task not found",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const completedTask = await TaskService.markComplete(
      id,
      userId,
      new Date(validatedData.completedAt)
    );

    return NextResponse.json({
      success: true,
      data: completedTask,
      message: "Task marked as complete",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error completing task:", error);

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
