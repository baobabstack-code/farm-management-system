import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateAccountSchema = z.object({
  accountName: z.string().min(1, "Account name is required").optional(),
  accountType: z
    .enum([
      "CHECKING",
      "SAVINGS",
      "CREDIT_CARD",
      "ACCOUNTS_PAYABLE",
      "ACCOUNTS_RECEIVABLE",
      "EXPENSE",
      "REVENUE",
      "ASSET",
      "LIABILITY",
      "EQUITY",
    ])
    .optional(),
  accountNumber: z.string().optional(),
  description: z.string().optional(),
  balance: z.number().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/financial/accounts/[id] - Get specific financial account
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await prisma.financialAccount.findFirst({
      where: {
        id: params.id,
        userId,
      },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          include: {
            crop: {
              select: { id: true, name: true },
            },
            field: {
              select: { id: true, name: true },
            },
            category: {
              select: { id: true, name: true },
            },
            supplier: {
              select: { id: true, name: true },
            },
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Financial account not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error("Get financial account error:", error);
    return NextResponse.json(
      { error: "Failed to fetch financial account" },
      { status: 500 }
    );
  }
}

// PUT /api/financial/accounts/[id] - Update financial account
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateAccountSchema.parse(body);

    // Check if account exists and belongs to user
    const existingAccount = await prisma.financialAccount.findFirst({
      where: {
        id: params.id,
        userId,
      },
    });

    if (!existingAccount) {
      return NextResponse.json(
        { error: "Financial account not found" },
        { status: 404 }
      );
    }

    const updatedAccount = await prisma.financialAccount.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json(updatedAccount);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Update financial account error:", error);
    return NextResponse.json(
      { error: "Failed to update financial account" },
      { status: 500 }
    );
  }
}

// DELETE /api/financial/accounts/[id] - Deactivate financial account
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if account exists and belongs to user
    const existingAccount = await prisma.financialAccount.findFirst({
      where: {
        id: params.id,
        userId,
      },
    });

    if (!existingAccount) {
      return NextResponse.json(
        { error: "Financial account not found" },
        { status: 404 }
      );
    }

    // Deactivate instead of deleting to preserve transaction history
    await prisma.financialAccount.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: "Financial account deactivated successfully",
    });
  } catch (error) {
    console.error("Delete financial account error:", error);
    return NextResponse.json(
      { error: "Failed to deactivate financial account" },
      { status: 500 }
    );
  }
}
