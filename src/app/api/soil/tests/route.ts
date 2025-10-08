import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { SoilService } from "@/lib/services/soil-service";
import { z } from "zod";
import { SoilTestType } from "@/types";

const soilTestCreateSchema = z.object({
  cropId: z.string().optional(),
  fieldId: z.string().optional(),
  sampleDate: z.string(),
  labName: z.string().min(1, "Lab name is required"),
  testType: z.nativeEnum(SoilTestType),
  pH: z.number().min(0).max(14),
  organicMatter: z.number().min(0).max(100),
  nitrogen: z.number().min(0),
  phosphorus: z.number().min(0),
  potassium: z.number().min(0),
  calcium: z.number().min(0),
  magnesium: z.number().min(0),
  sulfur: z.number().min(0),
  cationExchangeCapacity: z.number().min(0),
  soilTexture: z.string().min(1, "Soil texture is required"),
  recommendations: z.string().optional().default(""),
  cost: z.number().min(0),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cropId = searchParams.get("cropId") || undefined;
    const fieldId = searchParams.get("fieldId") || undefined;
    const testType =
      (searchParams.get("testType") as SoilTestType) || undefined;
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined;
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : undefined;

    const soilTests = await SoilService.getSoilTestsForUser(userId, {
      cropId,
      fieldId,
      testType,
      startDate,
      endDate,
    });

    return NextResponse.json({
      success: true,
      data: soilTests,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Soil tests API error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch soil tests",
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
    const validatedData = soilTestCreateSchema.parse(body);

    const soilTest = await SoilService.createSoilTest({
      ...validatedData,
      userId,
      sampleDate: new Date(validatedData.sampleDate),
    });

    // Generate analysis and recommendations
    const analysis = SoilService.analyzeSoilTest(soilTest);
    const recommendations = SoilService.generateSoilRecommendations(soilTest);

    return NextResponse.json(
      {
        success: true,
        data: {
          soilTest,
          analysis,
          recommendations,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create soil test API error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.issues,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create soil test",
      },
      { status: 500 }
    );
  }
}
