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

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: "Invalid coordinates" },
        { status: 400 }
      );
    }

    const weatherData = await WeatherService.getCurrentWeather(
      latitude,
      longitude,
      location
    );

    // Also get forecast for alerts
    const forecast = await WeatherService.getWeatherForecast(
      latitude,
      longitude,
      location,
      3
    );

    // Analyze and create alerts
    const alerts = await WeatherService.analyzeWeatherAlerts(
      userId,
      weatherData,
      forecast
    );

    return NextResponse.json({
      success: true,
      data: {
        current: weatherData,
        alerts: alerts,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Weather API error:", error);
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
