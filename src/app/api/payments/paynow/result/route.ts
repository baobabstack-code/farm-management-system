/**
 * API Route: Paynow Payment Result Webhook
 * POST /api/payments/paynow/result
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyPaymentHash } from "@/lib/services/paynow-service";
import { trackFinancialEvent } from "@/lib/analytics";

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();

    // Extract Paynow result data
    const reference = body.get("reference") as string;
    const paynowReference = body.get("paynowreference") as string;
    const amount = parseFloat(body.get("amount") as string);
    const status = body.get("status") as string;
    const hash = body.get("hash") as string;

    console.log("Paynow webhook received:", {
      reference,
      paynowReference,
      amount,
      status,
      hash,
    });

    // Verify the hash for security
    const isValidHash = verifyPaymentHash(reference, amount, status, hash);

    if (!isValidHash) {
      console.error("Invalid payment hash received");
      return NextResponse.json({ error: "Invalid hash" }, { status: 400 });
    }

    // Update payment status in database
    try {
      const { updatePaymentStatus } = await import("@/lib/db/payments");
      await updatePaymentStatus(reference, {
        status: status.toLowerCase(),
        paynowReference,
        hash,
        paidAt: status === "Paid" ? new Date() : undefined,
      });
    } catch (dbError) {
      console.error("Database update error:", dbError);
      // Continue processing even if DB update fails
    }

    // Track successful payment
    if (status === "Paid") {
      trackFinancialEvent("income", amount, "subscription", {
        payment_method: "paynow",
        reference: reference,
        paynow_reference: paynowReference,
        status: "completed",
      });

      // Here you could also:
      // 1. Activate user subscription
      // 2. Send confirmation email
      // 3. Update user permissions
      // 4. Log the successful payment

      console.log(`Payment successful: ${reference} - $${amount}`);
    } else {
      console.log(`Payment status update: ${reference} - ${status}`);
    }

    // Paynow expects "OK" response
    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("Paynow webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
