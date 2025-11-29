import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { expenseSchema } from "@/lib/validators/animals";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");

    if (!groupId) {
      return NextResponse.json(
        { error: "groupId is required" },
        { status: 400 }
      );
    }

    const group = await prisma.animalGroup.findUnique({
      where: { id: groupId },
    });
    if (!group)
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    if (group.userId !== userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const records = await prisma.animalExpense.findMany({
      where: { groupId },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: records,
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
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
    const parsed = expenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: 400 }
      );
    }

    const { groupId, date, category, cost } = parsed.data;

    const group = await prisma.animalGroup.findUnique({
      where: { id: groupId },
    });
    if (!group)
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    if (group.userId !== userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const record = await prisma.animalExpense.create({
      data: {
        groupId,
        date: new Date(date),
        category,
        cost,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: record,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error recording expense:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
