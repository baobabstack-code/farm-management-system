import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/onboarding/status
 * Check if user has completed onboarding
 */
export async function GET() {
  try {
    const authResult = await auth();
    const userId = authResult.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has at least one field (indicates onboarding complete)
    const fieldCount = await prisma.field.count({
      where: { userId },
    });

    return NextResponse.json({
      completed: fieldCount > 0,
      hasFields: fieldCount > 0,
      fieldCount,
    });
  } catch (error) {
    console.error("Onboarding status check error:", error);
    return NextResponse.json(
      { error: "Failed to check onboarding status" },
      { status: 500 }
    );
  }
}
