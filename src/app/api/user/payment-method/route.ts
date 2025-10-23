import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { SubscriptionService } from "@/lib/services/subscription-service";

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paymentMethodData = await request.json();

    // Validate required fields
    if (!paymentMethodData.type || !paymentMethodData.provider) {
      return NextResponse.json(
        { error: "Missing required payment method data" },
        { status: 400 }
      );
    }

    // Add payment method and activate trial
    const subscription =
      await SubscriptionService.addPaymentMethodAndActivateTrial(
        user.id,
        paymentMethodData
      );

    return NextResponse.json({
      success: true,
      subscription,
      paymentMethodId: subscription.id,
    });
  } catch (error) {
    console.error("Payment method API error:", error);
    return NextResponse.json(
      { error: "Failed to add payment method" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's payment methods
    const paymentMethod = await SubscriptionService.getDefaultPaymentMethod(
      user.id
    );

    return NextResponse.json({
      success: true,
      paymentMethod,
    });
  } catch (error) {
    console.error("Get payment method error:", error);
    return NextResponse.json(
      { error: "Failed to get payment method" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentMethodId = searchParams.get("id");

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: "Payment method ID required" },
        { status: 400 }
      );
    }

    // Deactivate payment method
    const { prisma } = await import("@/lib/db/connection");

    await prisma.userPaymentMethod.update({
      where: {
        id: paymentMethodId,
        userId: user.id,
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment method removed",
    });
  } catch (error) {
    console.error("Delete payment method error:", error);
    return NextResponse.json(
      { error: "Failed to remove payment method" },
      { status: 500 }
    );
  }
}
