import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { TaskService } from "@/lib/db";
import { taskCreateSchema } from "@/lib/validations/task";
import { TaskStatus, TaskPriority, TaskCategory } from "@prisma/client";

interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: TaskCategory;
  cropId?: string;
  overdue?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as TaskStatus | null;
    const priority = searchParams.get("priority") as TaskPriority | null;
    const category = searchParams.get("category") as TaskCategory | null;
    const cropId = searchParams.get("cropId");
    const overdue = searchParams.get("overdue") === "true";

    const filters: TaskFilters = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (category) filters.category = category;
    if (cropId) filters.cropId = cropId;
    if (overdue) filters.overdue = true;

    const tasks = await TaskService.findAllByUser(userId, filters);

    return NextResponse.json({
      success: true,
      data: tasks,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
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
    const validatedData = taskCreateSchema.parse(body);

    const task = await TaskService.create({
      userId: userId,
      title: validatedData.title,
      description: validatedData.description,
      dueDate: new Date(validatedData.dueDate),
      priority: validatedData.priority,
      category: validatedData.category,
      cropId: validatedData.cropId,
    });

    return NextResponse.json(
      {
        success: true,
        data: task,
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating task:", error);

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
