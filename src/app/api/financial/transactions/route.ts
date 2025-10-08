import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createTransactionSchema = z.object({
  accountId: z.string().min(1, "Account ID is required"),
  cropId: z.string().optional(),
  fieldId: z.string().optional(),
  categoryId: z.string().optional(),
  supplierId: z.string().optional(),
  amount: z.number().min(0, "Amount must be positive"),
  transactionType: z.enum(["INCOME", "EXPENSE", "TRANSFER", "ADJUSTMENT"]),
  description: z.string().min(1, "Description is required"),
  transactionDate: z.string().transform((val) => new Date(val)),
  referenceNumber: z.string().optional(),
  invoiceNumber: z.string().optional(),
  paymentMethod: z
    .enum([
      "CASH",
      "CHECK",
      "CREDIT_CARD",
      "DEBIT_CARD",
      "BANK_TRANSFER",
      "ONLINE_PAYMENT",
      "OTHER",
    ])
    .optional(),
  paymentStatus: z
    .enum(["PENDING", "PAID", "OVERDUE", "CANCELLED"])
    .default("PENDING"),
  notes: z.string().optional(),
});

// GET /api/financial/transactions - Get all financial transactions for user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const cropId = searchParams.get("cropId");
    const fieldId = searchParams.get("fieldId");
    const categoryId = searchParams.get("categoryId");
    const supplierId = searchParams.get("supplierId");
    const transactionType = searchParams.get("transactionType");
    const paymentStatus = searchParams.get("paymentStatus");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = { userId };

    if (accountId) where.accountId = accountId;
    if (cropId) where.cropId = cropId;
    if (fieldId) where.fieldId = fieldId;
    if (categoryId) where.categoryId = categoryId;
    if (supplierId) where.supplierId = supplierId;
    if (transactionType) where.transactionType = transactionType;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate.gte = new Date(startDate);
      if (endDate) where.transactionDate.lte = new Date(endDate);
    }

    const [transactions, totalCount] = await Promise.all([
      prisma.financialTransaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { transactionDate: "desc" },
        include: {
          account: {
            select: { id: true, accountName: true, accountType: true },
          },
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
      }),
      prisma.financialTransaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Get financial transactions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch financial transactions" },
      { status: 500 }
    );
  }
}

// POST /api/financial/transactions - Create new financial transaction
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createTransactionSchema.parse(body);

    // Verify that the account belongs to the user
    const account = await prisma.financialAccount.findFirst({
      where: {
        id: validatedData.accountId,
        userId,
        isActive: true,
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Financial account not found or inactive" },
        { status: 404 }
      );
    }

    // Verify related entities belong to the user if provided
    if (validatedData.cropId) {
      const crop = await prisma.crop.findFirst({
        where: { id: validatedData.cropId, userId },
      });
      if (!crop) {
        return NextResponse.json({ error: "Crop not found" }, { status: 404 });
      }
    }

    if (validatedData.fieldId) {
      const field = await prisma.field.findFirst({
        where: { id: validatedData.fieldId, userId },
      });
      if (!field) {
        return NextResponse.json({ error: "Field not found" }, { status: 404 });
      }
    }

    if (validatedData.categoryId) {
      const category = await prisma.costCategory.findFirst({
        where: { id: validatedData.categoryId, userId },
      });
      if (!category) {
        return NextResponse.json(
          { error: "Cost category not found" },
          { status: 404 }
        );
      }
    }

    if (validatedData.supplierId) {
      const supplier = await prisma.supplier.findFirst({
        where: { id: validatedData.supplierId, userId },
      });
      if (!supplier) {
        return NextResponse.json(
          { error: "Supplier not found" },
          { status: 404 }
        );
      }
    }

    const transaction = await prisma.$transaction(async (tx) => {
      // Create the transaction
      const newTransaction = await tx.financialTransaction.create({
        data: {
          userId,
          ...validatedData,
        },
        include: {
          account: {
            select: { id: true, accountName: true, accountType: true },
          },
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
      });

      // Update account balance based on transaction type
      let balanceChange = 0;
      switch (validatedData.transactionType) {
        case "INCOME":
          balanceChange = validatedData.amount;
          break;
        case "EXPENSE":
          balanceChange = -validatedData.amount;
          break;
        case "TRANSFER":
          // For transfers, this would typically involve two transactions
          balanceChange = 0; // Handle transfer logic separately
          break;
        case "ADJUSTMENT":
          // Adjustments can be positive or negative based on context
          balanceChange = validatedData.amount;
          break;
      }

      if (balanceChange !== 0) {
        await tx.financialAccount.update({
          where: { id: validatedData.accountId },
          data: {
            balance: {
              increment: balanceChange,
            },
          },
        });
      }

      return newTransaction;
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Create financial transaction error:", error);
    return NextResponse.json(
      { error: "Failed to create financial transaction" },
      { status: 500 }
    );
  }
}
