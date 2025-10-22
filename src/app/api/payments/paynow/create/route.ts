/**
 * API Route: Create Paynow Payment
 * POST /api/payments/paynow/create
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import {
  createPayment,
  generatePaymentReference,
  FARM_PAYMENT_PACKAGES,
} from "@/lib/services/paynow-service";
import { trackFinancialEvent } from "@/lib/analytics";

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { packageType, email, phone, customAmount } = body;

    // Validate required fields
    if (!packageType || !email) {
      return NextResponse.json(
        { error: "Package type and email are required" },
        { status: 400 }
      );
    }

    // Get package details or use custom amount
    let paymentItems;
    let reference;

    if (customAmount) {
      // Custom payment
      paymentItems = [
        {
          name: body.itemName || "FarmFlow Service",
          amount: customAmount,
          description: body.description || "Custom farm service payment",
        },
      ];
      reference = generatePaymentReference(user.id, "CUSTOM");
    } else {
      // Predefined package
      const packageInfo =
        FARM_PAYMENT_PACKAGES[
          packageType as keyof typeof FARM_PAYMENT_PACKAGES
        ];

      if (!packageInfo) {
        return NextResponse.json(
          { error: "Invalid package type" },
          { status: 400 }
        );
      }

      paymentItems = [
        {
          name: packageInfo.name,
          amount: packageInfo.amount,
          description: packageInfo.description,
        },
      ];
      reference = generatePaymentReference(user.id, packageType);
    }

    // Create payment request
    const paymentRequest = {
      email,
      phone,
      items: paymentItems,
      reference,
      additionalInfo: `FarmFlow payment for user ${user.id}`,
    };

    // Process payment with Paynow
    const paymentResponse = await createPayment(paymentRequest);

    if (paymentResponse.success) {
      // Track payment initiation
      trackFinancialEvent(
        "expense",
        paymentItems.reduce((sum, item) => sum + item.amount, 0),
        "subscription",
        {
          package_type: packageType || "custom",
          payment_method: "paynow",
          reference: reference,
        }
      );

      // Store payment record in database (you may want to add this)
      // await storePaymentRecord({
      //   userId,
      //   reference,
      //   amount: paymentItems.reduce((sum, item) => sum + item.amount, 0),
      //   packageType: packageType || "custom",
      //   status: "pending"
      // });

      return NextResponse.json({
        success: true,
        reference: reference,
        pollUrl: paymentResponse.pollUrl,
        redirectUrl: paymentResponse.redirectUrl,
        instructions: paymentResponse.instructions,
        amount: paymentItems.reduce((sum, item) => sum + item.amount, 0),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: paymentResponse.error || "Payment creation failed",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Payment creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
