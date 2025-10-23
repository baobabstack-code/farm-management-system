import { prisma } from "@/lib/db/connection";
import { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

export interface SubscriptionInfo {
  id: string;
  userId: string;
  planType: SubscriptionPlan;
  status: SubscriptionStatus;
  trialStartDate: Date;
  trialEndDate: Date;
  subscriptionStartDate?: Date | null;
  subscriptionEndDate?: Date | null;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  isActive: boolean;
  daysRemaining: number;
  isTrialActive: boolean;
  isSubscriptionActive: boolean;
}

export class SubscriptionService {
  /**
   * Create a new subscription for a user - requires payment method for trial
   */
  static async createUserSubscription(
    userId: string,
    planType: SubscriptionPlan = SubscriptionPlan.BASIC,
    paymentMethodId?: string
  ): Promise<SubscriptionInfo> {
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialStartDate.getDate() + 7); // 7-day trial

    // If no payment method provided, create subscription in pending state
    const status = paymentMethodId
      ? SubscriptionStatus.TRIAL
      : SubscriptionStatus.PENDING_PAYMENT_METHOD;

    const subscription = await prisma.userSubscription.create({
      data: {
        userId,
        planType,
        status,
        trialStartDate,
        trialEndDate,
        paymentMethodId,
        isActive: paymentMethodId ? true : false,
        requiresPaymentMethod: true,
        autoRenew: true,
      },
    });

    return this.formatSubscriptionInfo(subscription);
  }

  /**
   * Get or create user subscription
   */
  static async getOrCreateUserSubscription(
    userId: string,
    planType: SubscriptionPlan = SubscriptionPlan.BASIC
  ): Promise<SubscriptionInfo> {
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return await this.createUserSubscription(userId, planType);
    }

    return this.formatSubscriptionInfo(subscription);
  }

  /**
   * Get user subscription info
   */
  static async getUserSubscription(
    userId: string
  ): Promise<SubscriptionInfo | null> {
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return null;
    }

    return this.formatSubscriptionInfo(subscription);
  }

  /**
   * Upgrade user subscription after successful payment
   */
  static async upgradeSubscription(
    userId: string,
    planType: SubscriptionPlan,
    paymentId: string
  ): Promise<SubscriptionInfo> {
    const now = new Date();
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1); // 1 month subscription

    const subscription = await prisma.userSubscription.update({
      where: { userId },
      data: {
        planType,
        status: SubscriptionStatus.ACTIVE,
        subscriptionStartDate: now,
        subscriptionEndDate,
        currentPeriodStart: now,
        currentPeriodEnd: subscriptionEndDate,
        lastPaymentDate: now,
        nextBillingDate: subscriptionEndDate,
        isActive: true,
      },
    });

    // Update the payment record
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        subscriptionId: subscription.id,
        planType,
        status: "completed",
        paidAt: now,
      },
    });

    return this.formatSubscriptionInfo(subscription);
  }

  /**
   * Cancel user subscription
   */
  static async cancelSubscription(
    userId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<SubscriptionInfo> {
    const subscription = await prisma.userSubscription.update({
      where: { userId },
      data: {
        cancelAtPeriodEnd,
        canceledAt: new Date(),
        status: cancelAtPeriodEnd
          ? SubscriptionStatus.ACTIVE
          : SubscriptionStatus.CANCELED,
        isActive: !cancelAtPeriodEnd,
      },
    });

    return this.formatSubscriptionInfo(subscription);
  }

  /**
   * Add payment method and activate trial
   */
  static async addPaymentMethodAndActivateTrial(
    userId: string,
    paymentMethodData: {
      type: string;
      provider: string;
      last4?: string;
      expiryMonth?: number;
      expiryYear?: number;
      cardBrand?: string;
      phoneNumber?: string;
      providerMethodId?: string;
      metadata?: any;
    }
  ): Promise<SubscriptionInfo> {
    // Create payment method
    const paymentMethod = await prisma.userPaymentMethod.create({
      data: {
        userId,
        ...paymentMethodData,
        isDefault: true,
        isActive: true,
      },
    });

    // Update subscription to active trial status
    const subscription = await prisma.userSubscription.update({
      where: { userId },
      data: {
        paymentMethodId: paymentMethod.id,
        status: SubscriptionStatus.TRIAL,
        isActive: true,
      },
    });

    return this.formatSubscriptionInfo(subscription);
  }

  /**
   * Get user's default payment method
   */
  static async getDefaultPaymentMethod(userId: string) {
    return await prisma.userPaymentMethod.findFirst({
      where: {
        userId,
        isDefault: true,
        isActive: true,
      },
    });
  }

  /**
   * Check if user has access to features
   */
  static async hasAccess(userId: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription) {
      return false;
    }

    // Require payment method for access
    if (subscription.status === "PENDING_PAYMENT_METHOD") {
      return false;
    }

    return subscription.isTrialActive || subscription.isSubscriptionActive;
  }

  /**
   * Get subscription plan limits
   */
  static getPlanLimits(planType: SubscriptionPlan) {
    const limits = {
      [SubscriptionPlan.BASIC]: {
        fields: 5,
        crops: 10,
        equipment: 5,
        aiRequests: 50,
        storage: "1GB",
        features: ["basic_analytics", "crop_tracking", "basic_reports"],
      },
      [SubscriptionPlan.PROFESSIONAL]: {
        fields: 25,
        crops: 50,
        equipment: 20,
        aiRequests: 200,
        storage: "10GB",
        features: [
          "advanced_analytics",
          "ai_recommendations",
          "financial_tracking",
          "weather_alerts",
        ],
      },
      [SubscriptionPlan.ENTERPRISE]: {
        fields: -1, // unlimited
        crops: -1,
        equipment: -1,
        aiRequests: -1,
        storage: "100GB",
        features: [
          "all_features",
          "priority_support",
          "custom_integrations",
          "advanced_ai",
        ],
      },
    };

    return limits[planType];
  }

  /**
   * Process expired trials and auto-charge
   */
  static async processExpiredTrials(): Promise<void> {
    const now = new Date();

    // Get expired trials with payment methods
    const expiredTrials = await prisma.userSubscription.findMany({
      where: {
        status: SubscriptionStatus.TRIAL,
        trialEndDate: {
          lt: now,
        },
        paymentMethodId: {
          not: null,
        },
        autoRenew: true,
      },
      include: {
        payments: true,
      },
    });

    // Process each expired trial
    for (const subscription of expiredTrials) {
      try {
        await this.processTrialExpiry(subscription.userId);
      } catch (error) {
        console.error(
          `Failed to process trial expiry for user ${subscription.userId}:`,
          error
        );
      }
    }

    // Mark trials without payment methods as expired
    await prisma.userSubscription.updateMany({
      where: {
        status: SubscriptionStatus.TRIAL,
        trialEndDate: {
          lt: now,
        },
        OR: [{ paymentMethodId: null }, { autoRenew: false }],
      },
      data: {
        status: SubscriptionStatus.EXPIRED,
        isActive: false,
      },
    });
  }

  /**
   * Process individual trial expiry with auto-billing
   */
  static async processTrialExpiry(userId: string): Promise<void> {
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId },
    });

    if (!subscription || !subscription.paymentMethodId) {
      throw new Error("No subscription or payment method found");
    }

    // Create automatic payment
    const { createPayment, generatePaymentReference, FARM_PAYMENT_PACKAGES } =
      await import("@/lib/services/paynow-service");

    const packageKey =
      `${subscription.planType}_PLAN` as keyof typeof FARM_PAYMENT_PACKAGES;
    const packageInfo = FARM_PAYMENT_PACKAGES[packageKey];

    if (!packageInfo) {
      throw new Error("Invalid plan type");
    }

    // Get user info for payment
    const { currentUser } = await import("@clerk/nextjs/server");
    // Note: In a real implementation, you'd need to get user info differently
    // since this runs in a background job, not in a request context

    const reference = generatePaymentReference(userId, packageKey);

    // Create payment record for auto-billing
    await prisma.payment.create({
      data: {
        userId,
        subscriptionId: subscription.id,
        reference,
        amount: packageInfo.amount,
        currency: "USD",
        status: "pending",
        packageType: packageKey,
        planType: subscription.planType,
        email: "auto-billing@farmflow.com", // You'd get this from user profile
        phone: null,
      },
    });

    // Update subscription status to pending payment
    await prisma.userSubscription.update({
      where: { userId },
      data: {
        status: SubscriptionStatus.PAST_DUE,
        nextBillingDate: new Date(),
      },
    });

    // Here you would trigger the actual payment with the stored payment method
    // This depends on your payment provider's API for stored payment methods
  }

  /**
   * Format subscription info with calculated fields
   */
  private static formatSubscriptionInfo(subscription: any): SubscriptionInfo {
    const now = new Date();
    const trialEndDate = new Date(subscription.trialEndDate);
    const subscriptionEndDate = subscription.subscriptionEndDate
      ? new Date(subscription.subscriptionEndDate)
      : null;

    const isTrialActive =
      subscription.status === SubscriptionStatus.TRIAL && trialEndDate > now;
    const isSubscriptionActive =
      subscription.status === SubscriptionStatus.ACTIVE &&
      subscriptionEndDate &&
      subscriptionEndDate > now;

    let daysRemaining = 0;
    if (isTrialActive) {
      daysRemaining = Math.ceil(
        (trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
    } else if (isSubscriptionActive && subscriptionEndDate) {
      daysRemaining = Math.ceil(
        (subscriptionEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    return {
      ...subscription,
      daysRemaining,
      isTrialActive,
      isSubscriptionActive,
    };
  }
}

export default SubscriptionService;
