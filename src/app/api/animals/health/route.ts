import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { healthRecordSchema } from "@/lib/validators/animals";

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

    const records = await prisma.animalHealthRecord.findMany({
      where: { groupId },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: records,
    });
  } catch (error) {
    console.error("Error fetching health records:", error);
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
    const parsed = healthRecordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: 400 }
      );
    }

    const { groupId, date, issue, treatment, cost } = parsed.data;

    const group = await prisma.animalGroup.findUnique({
      where: { id: groupId },
    });
    if (!group)
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    if (group.userId !== userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const record = await prisma.animalHealthRecord.create({
      data: {
        groupId,
        date: new Date(date),
        issue,
        treatment,
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
    console.error("Error recording health:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
