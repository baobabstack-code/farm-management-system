import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { EnhancedWeatherService } from "@/lib/services/enhanced-weather-service";

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const latitude = parseFloat(searchParams.get("latitude") || "0");
    const longitude = parseFloat(searchParams.get("longitude") || "0");
    const location = searchParams.get("location") || "Unknown Location";

    if (latitude === 0 || longitude === 0) {
      return NextResponse.json(
        { success: false, error: "Valid latitude and longitude are required" },
        { status: 400 }
      );
    }

    const weatherConditions =
      await EnhancedWeatherService.getComprehensiveWeatherData(
        latitude,
        longitude,
        location,
        userId
      );

    // Store insights (when database is ready)
    await EnhancedWeatherService.storeAgricultureInsights(
      weatherConditions.insights,
      userId
    );

    return NextResponse.json({
      success: true,
      data: weatherConditions,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Enhanced weather API error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch weather data",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, latitude, longitude, days = 30 } = body;

    if (action === "historical-trends") {
      const trends = await EnhancedWeatherService.getHistoricalWeatherTrends(
        latitude,
        longitude,
        days
      );

      return NextResponse.json({
        success: true,
        data: trends,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action specified" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Enhanced weather POST API error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to process request",
      },
      { status: 500 }
    );
  }
}
