/**
 * API Route: Get Payment History
 * GET /api/payments/history
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getUserPayments } from "@/lib/db/payments";

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's payment history
    const payments = await getUserPayments(user.id);

    return NextResponse.json({
      success: true,
      payments: payments.map((payment) => ({
        id: payment.id,
        reference: payment.reference,
        paynowReference: payment.paynowReference,
        amount: parseFloat(payment.amount.toString()),
        currency: payment.currency,
        status: payment.status,
        packageType: payment.packageType,
        paidAt: payment.paidAt?.toISOString(),
        createdAt: payment.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Payment history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment history" },
      { status: 500 }
    );
  }
}
