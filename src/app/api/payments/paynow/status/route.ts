/**
 * API Route: Check Paynow Payment Status
 * POST /api/payments/paynow/status
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { checkPaymentStatus } from "@/lib/services/paynow-service";

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { pollUrl } = body;

    if (!pollUrl) {
      return NextResponse.json(
        { error: "Poll URL is required" },
        { status: 400 }
      );
    }

    // Check payment status
    const statusResponse = await checkPaymentStatus(pollUrl);

    if (statusResponse.success) {
      return NextResponse.json({
        success: true,
        paid: statusResponse.paid,
        amount: statusResponse.amount,
        reference: statusResponse.reference,
        paynowReference: statusResponse.paynowReference,
        status: statusResponse.status,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: statusResponse.error || "Status check failed",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Payment status check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
