import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { updateGroupSchema } from "@/lib/validators/animals";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const group = await prisma.animalGroup.findUnique({
      where: { id },
      include: {
        species: true,
        _count: {
          select: { production: true, feedRecords: true },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { success: false, error: "Group not found" },
        { status: 404 }
      );
    }

    if (group.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Get latest production
    const latestProduction = await prisma.animalProduction.findFirst({
      where: { groupId: id },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...group,
        latestProduction,
      },
    });
  } catch (error) {
    console.error("Error fetching group details:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateGroupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: 400 }
      );
    }

    const group = await prisma.animalGroup.findUnique({ where: { id } });
    if (!group)
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 }
      );
    if (group.userId !== userId)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );

    const updated = await prisma.animalGroup.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error updating group:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const group = await prisma.animalGroup.findUnique({ where: { id } });
    if (!group)
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 }
      );
    if (group.userId !== userId)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );

    // Soft delete
    const updated = await prisma.animalGroup.update({
      where: { id },
      data: { status: "archived" },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error deleting group:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
