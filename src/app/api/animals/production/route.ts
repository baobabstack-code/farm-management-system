import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { productionEntrySchema } from "@/lib/validators/animals";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!groupId) {
      return NextResponse.json(
        { error: "groupId is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const group = await prisma.animalGroup.findUnique({
      where: { id: groupId },
    });
    if (!group)
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    if (group.userId !== userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const where: any = { groupId };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const production = await prisma.animalProduction.findMany({
      where,
      orderBy: { date: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: production,
    });
  } catch (error) {
    console.error("Error fetching production:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
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
    const parsed = productionEntrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: 400 }
      );
    }

    const { groupId, date, eggs, weightKg, notes } = parsed.data;

    // Verify ownership
    const group = await prisma.animalGroup.findUnique({
      where: { id: groupId },
    });
    if (!group)
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    if (group.userId !== userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const production = await prisma.animalProduction.upsert({
      where: {
        groupId_date: {
          groupId,
          date: new Date(date),
        },
      },
      update: {
        eggs,
        weightKg,
        notes,
      },
      create: {
        groupId,
        date: new Date(date),
        eggs,
        weightKg,
        notes,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: production,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error recording production:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
