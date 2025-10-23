/**
 * API Route: Get User Subscription Status
 * GET /api/user/subscription
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getUserActiveSubscriptions } from "@/lib/db/payments";
import { FARM_PAYMENT_PACKAGES } from "@/lib/services/paynow-service";

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's active subscriptions
    const activePayments = await getUserActiveSubscriptions(user.id);

    // Find the highest tier active subscription
    const activePlan = activePayments.find((payment: any) =>
      ["BASIC_PLAN", "PREMIUM_PLAN", "ENTERPRISE_PLAN"].includes(
        payment.packageType
      )
    );

    let subscription: any = {
      isActive: false,
      features: [] as string[],
    };

    if (activePlan) {
      const planInfo =
        FARM_PAYMENT_PACKAGES[
          activePlan.packageType as keyof typeof FARM_PAYMENT_PACKAGES
        ];

      subscription = {
        isActive: true,
        plan: activePlan.packageType,
        paidAt: activePlan.paidAt,
        features: planInfo.features,
      };
    }

    return NextResponse.json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error("Subscription check error:", error);
    return NextResponse.json(
      { error: "Failed to check subscription status" },
      { status: 500 }
    );
  }
}
