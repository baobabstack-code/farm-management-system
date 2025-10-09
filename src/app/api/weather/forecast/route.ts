import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { WeatherService } from "@/lib/services/weather-service";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const latitude = parseFloat(searchParams.get("latitude") || "");
    const longitude = parseFloat(searchParams.get("longitude") || "");
    const location = searchParams.get("location") || "Unknown";
    const days = parseInt(searchParams.get("days") || "7");

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: "Invalid coordinates" },
        { status: 400 }
      );
    }

    if (days < 1 || days > 7) {
      return NextResponse.json(
        { error: "Days must be between 1 and 7" },
        { status: 400 }
      );
    }

    const forecast = await WeatherService.getWeatherForecast(
      latitude,
      longitude,
      location,
      days
    );

    return NextResponse.json({
      success: true,
      data: forecast,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Forecast API error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch weather forecast",
      },
      { status: 500 }
    );
  }
}
