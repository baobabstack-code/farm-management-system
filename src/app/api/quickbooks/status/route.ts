import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get QuickBooks connection status
    const connection = await prisma.quickBooksConnection.findUnique({
      where: { userId },
      select: {
        id: true,
        companyName: true,
        isActive: true,
        lastSyncAt: true,
        syncStatus: true,
        syncErrors: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!connection) {
      return NextResponse.json({
        connected: false,
        connection: null,
      });
    }

    // Get recent sync logs
    const syncLogs = await prisma.syncLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        syncType: true,
        status: true,
        recordsAffected: true,
        errorMessage: true,
        createdAt: true,
      },
    });

    // Get count of synced accounts and suppliers
    const [accountsCount, suppliersCount] = await Promise.all([
      prisma.financialAccount.count({
        where: { userId, quickbooksId: { not: null } },
      }),
      prisma.supplier.count({
        where: { userId, quickbooksId: { not: null } },
      }),
    ]);

    return NextResponse.json({
      connected: connection.isActive,
      connection,
      syncLogs,
      stats: {
        accountsCount,
        suppliersCount,
      },
    });
  } catch (error) {
    console.error("QuickBooks status error:", error);
    return NextResponse.json(
      { error: "Failed to get QuickBooks status" },
      { status: 500 }
    );
  }
}
