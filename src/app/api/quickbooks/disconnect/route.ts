import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has QuickBooks connection
    const connection = await prisma.quickBooksConnection.findUnique({
      where: { userId },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "QuickBooks connection not found" },
        { status: 404 }
      );
    }

    // Deactivate the connection instead of deleting to preserve history
    await prisma.quickBooksConnection.update({
      where: { userId },
      data: {
        isActive: false,
        syncStatus: "disconnected",
        updatedAt: new Date(),
      },
    });

    // Log the disconnection
    await prisma.syncLog.create({
      data: {
        userId,
        syncType: "disconnect",
        status: "success",
        recordsAffected: 0,
        syncData: {
          disconnectedAt: new Date(),
          reason: "user_requested",
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "QuickBooks connection disconnected successfully",
    });
  } catch (error) {
    console.error("QuickBooks disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect QuickBooks" },
      { status: 500 }
    );
  }
}
