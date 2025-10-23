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
   * Create a new subscription for a user with 7-day trial
   */
  static async createUserSubscription(
    userId: string,
    planType: SubscriptionPlan = SubscriptionPlan.BASIC
  ): Promise<SubscriptionInfo> {
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialStartDate.getDate() + 7); // 7-day trial

    const subscription = await prisma.userSubscription.create({
      data: {
        userId,
        planType,
        status: SubscriptionStatus.TRIAL,
        trialStartDate,
        trialEndDate,
        isActive: true,
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
   * Check if user has access to features
   */
  static async hasAccess(userId: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription) {
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
   * Check expired trials and update status
   */
  static async processExpiredTrials(): Promise<void> {
    const now = new Date();

    await prisma.userSubscription.updateMany({
      where: {
        status: SubscriptionStatus.TRIAL,
        trialEndDate: {
          lt: now,
        },
      },
      data: {
        status: SubscriptionStatus.EXPIRED,
        isActive: false,
      },
    });
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
