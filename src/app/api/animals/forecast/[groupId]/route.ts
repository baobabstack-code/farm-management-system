import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { forecastRequestSchema } from "@/lib/validators/animals";
import { Queue } from "bullmq";

// Initialize queue
// Note: In a real serverless env (Vercel), this might need a separate worker service or use a different pattern (e.g. QStash).
// For this implementation as requested, we'll assume a long-running server or compatible env, or just enqueue here.
const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
};

const forecastQueue = new Queue("animal-forecast", { connection });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await params;
    const body = await request.json();
    const parsed = forecastRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: 400 }
      );
    }

    const { type, model, horizonDays, inputOverrides } = parsed.data;

    // Verify ownership
    const group = await prisma.animalGroup.findUnique({
      where: { id: groupId },
    });
    if (!group)
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    if (group.userId !== userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    // Create forecast record
    const forecast = await prisma.animalForecast.create({
      data: {
        groupId,
        type,
        modelName: model || "default-model",
        inputJson: { horizonDays, ...inputOverrides },
        status: "pending",
      },
    });

    // Enqueue job
    await forecastQueue.add("generate-forecast", {
      forecastId: forecast.id,
      groupId,
      type,
      model: model || "default-model",
      horizonDays,
      inputOverrides,
    });

    return NextResponse.json(
      {
        success: true,
        data: { forecastId: forecast.id },
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("Error requesting forecast:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await params;

    const group = await prisma.animalGroup.findUnique({
      where: { id: groupId },
    });
    if (!group)
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    if (group.userId !== userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const forecasts = await prisma.animalForecast.findMany({
      where: { groupId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: forecasts,
    });
  } catch (error) {
    console.error("Error fetching forecasts:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
