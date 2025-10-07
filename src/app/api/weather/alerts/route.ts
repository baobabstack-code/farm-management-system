import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { WeatherService } from "@/lib/services/weather-service";

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clean up expired alerts before fetching
    await WeatherService.deactivateExpiredAlerts();

    const alerts = await WeatherService.getActiveAlertsForUser(userId);

    return NextResponse.json({
      success: true,
      data: alerts,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Alerts API error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch weather alerts",
      },
      { status: 500 }
    );
  }
}
