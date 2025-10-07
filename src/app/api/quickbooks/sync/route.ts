import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { QuickBooksService } from "@/lib/services/quickbooks-service";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { syncType } = await request.json();

    // Check if user has QuickBooks connection
    const connection = await prisma.quickBooksConnection.findUnique({
      where: { userId, isActive: true },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "QuickBooks connection not found" },
        { status: 404 }
      );
    }

    let result = { recordsAffected: 0 };
    switch (syncType) {
      case "accounts":
        await QuickBooksService.syncAccounts(userId);
        result = { recordsAffected: 1 }; // Placeholder
        break;
      case "vendors":
        await QuickBooksService.syncVendors(userId);
        result = { recordsAffected: 1 }; // Placeholder
        break;
      case "all":
        // Sync accounts first, then vendors
        await QuickBooksService.syncAccounts(userId);
        await QuickBooksService.syncVendors(userId);
        result = { recordsAffected: 2 }; // Placeholder
        break;
      default:
        return NextResponse.json(
          { error: "Invalid sync type" },
          { status: 400 }
        );
    }

    // Update last sync time
    await prisma.quickBooksConnection.update({
      where: { userId },
      data: {
        lastSyncAt: new Date(),
        syncStatus: "success",
        syncErrors: null,
      },
    });

    return NextResponse.json({
      success: true,
      syncType,
      recordsAffected: result.recordsAffected || 0,
      message: "Sync completed successfully",
    });
  } catch (error) {
    console.error("QuickBooks sync error:", error);

    // Log sync error
    try {
      await prisma.syncLog.create({
        data: {
          userId: (await auth()).userId!,
          syncType: "error",
          status: "error",
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
          recordsAffected: 0,
        },
      });
    } catch (logError) {
      console.error("Failed to log sync error:", logError);
    }

    return NextResponse.json(
      {
        error: "Sync failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
