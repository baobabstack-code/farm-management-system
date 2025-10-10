import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { EntityType, ActivityType } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType") as EntityType | null;
    const entityId = searchParams.get("entityId");
    const actionType = searchParams.get("actionType") as ActivityType | null;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = {
      userId,
    };

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (actionType) {
      where.actionType = actionType;
    }

    const activities = await prisma.activity.findMany({
      where,
      orderBy: {
        timestamp: "desc",
      },
      take: limit,
      skip: offset,
    });

    const total = await prisma.activity.count({ where });

    return NextResponse.json({
      success: true,
      data: activities,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch activities",
        timestamp: new Date().toISOString(),
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
    const { entityType, entityId, actionType, description, metadata } = body;

    if (!entityType || !entityId || !actionType || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const activity = await prisma.activity.create({
      data: {
        userId,
        entityType,
        entityId,
        actionType,
        description,
        metadata: metadata || {},
      },
    });

    return NextResponse.json({
      success: true,
      data: activity,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create activity",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
