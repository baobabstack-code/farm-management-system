import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const forecast = await prisma.animalForecast.findUnique({
      where: { id },
      include: { group: true },
    });

    if (!forecast) {
      return NextResponse.json(
        { error: "Forecast not found" },
        { status: 404 }
      );
    }

    if (forecast.group.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: forecast,
    });
  } catch (error) {
    console.error("Error fetching forecast:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
