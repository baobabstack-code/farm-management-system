/**
 * Database operations for payments
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface PaymentRecord {
  id?: string;
  userId: string;
  subscriptionId?: string;
  reference: string;
  paynowReference?: string;
  amount: number;
  currency?: string;
  status: "pending" | "paid" | "failed" | "cancelled";
  packageType: string;
  planType?: "BASIC" | "PROFESSIONAL" | "ENTERPRISE" | null;
  email: string;
  phone?: string;
  pollUrl?: string;
  redirectUrl?: string;
  hash?: string;
  paidAt?: Date;
}

/**
 * Create a new payment record
 */
export async function createPaymentRecord(payment: PaymentRecord) {
  try {
    return await prisma.payment.create({
      data: {
        userId: payment.userId,
        subscriptionId: payment.subscriptionId,
        reference: payment.reference,
        amount: payment.amount,
        currency: payment.currency || "USD",
        status: payment.status,
        packageType: payment.packageType,
        planType: payment.planType as any,
        email: payment.email,
        phone: payment.phone,
        pollUrl: payment.pollUrl,
        redirectUrl: payment.redirectUrl,
      },
    });
  } catch (error) {
    console.error("Error creating payment record:", error);
    throw error;
  }
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  reference: string,
  updates: {
    status?: string;
    paynowReference?: string;
    hash?: string;
    paidAt?: Date;
  }
) {
  try {
    return await prisma.payment.update({
      where: { reference },
      data: updates,
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    throw error;
  }
}

/**
 * Get payment by reference
 */
export async function getPaymentByReference(reference: string) {
  try {
    return await prisma.payment.findUnique({
      where: { reference },
    });
  } catch (error) {
    console.error("Error getting payment by reference:", error);
    throw error;
  }
}

/**
 * Get user payments
 */
export async function getUserPayments(userId: string) {
  try {
    return await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error getting user payments:", error);
    throw error;
  }
}

/**
 * Get successful payments for user
 */
export async function getUserActiveSubscriptions(userId: string) {
  try {
    return await prisma.payment.findMany({
      where: {
        userId,
        status: "paid",
        packageType: {
          in: ["BASIC_PLAN", "PREMIUM_PLAN", "ENTERPRISE_PLAN"],
        },
      },
      orderBy: { paidAt: "desc" },
    });
  } catch (error) {
    console.error("Error getting user subscriptions:", error);
    throw error;
  }
}

const paymentService = {
  createPaymentRecord,
  updatePaymentStatus,
  getPaymentByReference,
  getUserPayments,
  getUserActiveSubscriptions,
};

export default paymentService;
