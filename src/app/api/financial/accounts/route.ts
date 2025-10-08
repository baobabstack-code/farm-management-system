import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createAccountSchema = z.object({
  accountName: z.string().min(1, "Account name is required"),
  accountType: z.enum([
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
  ]),
  accountNumber: z.string().optional(),
  description: z.string().optional(),
  balance: z.number().default(0),
});

// GET /api/financial/accounts - Get all financial accounts for user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountType = searchParams.get("accountType");
    const isActive = searchParams.get("isActive");

    const where: any = { userId };

    if (accountType) {
      where.accountType = accountType;
    }

    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    const accounts = await prisma.financialAccount.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        transactions: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            amount: true,
            transactionType: true,
            description: true,
            transactionDate: true,
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Get financial accounts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch financial accounts" },
      { status: 500 }
    );
  }
}

// POST /api/financial/accounts - Create new financial account
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createAccountSchema.parse(body);

    const account = await prisma.financialAccount.create({
      data: {
        userId,
        ...validatedData,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Create financial account error:", error);
    return NextResponse.json(
      { error: "Failed to create financial account" },
      { status: 500 }
    );
  }
}
