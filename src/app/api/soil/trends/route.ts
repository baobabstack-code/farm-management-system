import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { SoilService } from "@/lib/services/soil-service";

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get("fieldId") || undefined;
    const timeframe =
      (searchParams.get("timeframe") as "year" | "two-years" | "five-years") ||
      "year";

    const trends = await SoilService.getSoilHealthTrends(
      userId,
      fieldId,
      timeframe
    );

    return NextResponse.json({
      success: true,
      data: trends,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Soil trends API error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch soil trends",
      },
      { status: 500 }
    );
  }
}
