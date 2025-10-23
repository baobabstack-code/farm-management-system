/**
 * API Route: User Subscription Management with 7-day trials
 * GET /api/user/subscription - Get subscription status
 * POST /api/user/subscription - Update subscription
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { SubscriptionService } from "@/lib/services/subscription-service";
import { SubscriptionPlan } from "@prisma/client";

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create user subscription with 7-day trial
    const subscription = await SubscriptionService.getOrCreateUserSubscription(
      user.id,
      SubscriptionPlan.BASIC
    );

    // Check if user has access
    const hasAccess = await SubscriptionService.hasAccess(user.id);

    return NextResponse.json({
      success: true,
      subscription,
      hasAccess,
    });
  } catch (error) {
    console.error("Subscription check error:", error);
    return NextResponse.json(
      { error: "Failed to check subscription status" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, planType, paymentId, cancelAtPeriodEnd } =
      await request.json();

    switch (action) {
      case "upgrade":
        if (!planType || !paymentId) {
          return NextResponse.json(
            { error: "Missing planType or paymentId" },
            { status: 400 }
          );
        }

        const upgradedSubscription =
          await SubscriptionService.upgradeSubscription(
            user.id,
            planType,
            paymentId
          );

        return NextResponse.json({
          success: true,
          subscription: upgradedSubscription,
        });

      case "cancel":
        const canceledSubscription =
          await SubscriptionService.cancelSubscription(
            user.id,
            cancelAtPeriodEnd ?? true
          );

        return NextResponse.json({
          success: true,
          subscription: canceledSubscription,
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Subscription action error:", error);
    return NextResponse.json(
      { error: "Failed to process subscription action" },
      { status: 500 }
    );
  }
}
