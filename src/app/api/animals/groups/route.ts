import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { createGroupSchema } from "@/lib/validators/animals";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const farmId = searchParams.get("farmId");

    const where: any = { userId };
    if (farmId) {
      where.farmId = farmId;
    }
    // Filter out archived by default unless requested? Spec doesn't say.
    // Usually we want active ones.
    where.status = { not: "archived" };

    const groups = await prisma.animalGroup.findMany({
      where,
      include: {
        species: true,
        _count: {
          select: { production: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: groups,
    });
  } catch (error) {
    console.error("Error fetching groups:", error);
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
    const parsed = createGroupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const group = await prisma.animalGroup.create({
      data: {
        userId,
        speciesId: data.speciesId,
        name: data.name,
        quantity: data.quantity,
        startDate: new Date(data.startDate),
        notes: data.notes,
        farmId: data.farmId,
        status: "active",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: group,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating group:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
