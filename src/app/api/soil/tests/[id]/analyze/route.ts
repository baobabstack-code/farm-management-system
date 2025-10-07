import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { SoilService } from "@/lib/services/soil-service";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const { id } = params;

    // Fetch the soil test
    const soilTest = await prisma.soilTest.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        crop: true,
        field: true,
      },
    });

    if (!soilTest) {
      return NextResponse.json(
        { error: "Soil test not found" },
        { status: 404 }
      );
    }

    // Generate analysis and recommendations
    const analysis = SoilService.analyzeSoilTest(soilTest as any);
    const recommendations = SoilService.generateSoilRecommendations(
      soilTest as any
    );

    return NextResponse.json({
      success: true,
      data: {
        soilTest,
        analysis,
        recommendations,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Soil test analysis API error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze soil test",
      },
      { status: 500 }
    );
  }
}
