/**
 * Paynow Payment Service for FarmFlow
 * Handles payment processing using Paynow Zimbabwe
 */

import { Paynow } from "paynow";

// Paynow configuration
const paynow = new Paynow(
  process.env.PAYNOW_INTEGRATION_ID!,
  process.env.PAYNOW_INTEGRATION_KEY!,
  process.env.PAYNOW_RESULT_URL ||
    `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/paynow/result`,
  process.env.PAYNOW_RETURN_URL ||
    `${process.env.NEXT_PUBLIC_APP_URL}/payments/success`
);

// Payment types for farm management
export interface FarmPaymentItem {
  name: string;
  amount: number;
  description?: string;
}

export interface PaymentRequest {
  email: string;
  phone?: string;
  items: FarmPaymentItem[];
  reference: string;
  additionalInfo?: string;
}

export interface PaymentResponse {
  success: boolean;
  pollUrl?: string;
  redirectUrl?: string;
  instructions?: string;
  error?: string;
  reference?: string;
}

/**
 * Create a payment request for farm services
 */
export async function createPayment(
  paymentData: PaymentRequest
): Promise<PaymentResponse> {
  try {
    // Create payment object
    const payment = paynow.createPayment(
      paymentData.reference,
      paymentData.email
    );

    // Add items to payment
    paymentData.items.forEach((item) => {
      payment.add(item.name, item.amount);
    });

    // Send payment to Paynow
    const response = await paynow.send(payment);

    if (response.success) {
      return {
        success: true,
        pollUrl: response.pollUrl,
        redirectUrl: response.redirectUrl,
        instructions: response.instructions,
        reference: paymentData.reference,
      };
    } else {
      return {
        success: false,
        error: response.error || "Payment creation failed",
      };
    }
  } catch (error) {
    console.error("Paynow payment error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown payment error",
    };
  }
}

/**
 * Check payment status
 */
export async function checkPaymentStatus(pollUrl: string) {
  try {
    const status = await paynow.pollTransaction(pollUrl);

    return {
      success: true,
      paid: status.paid,
      amount: status.amount,
      reference: status.reference,
      paynowReference: status.paynowReference,
      status: status.status,
      hash: status.hash,
    };
  } catch (error) {
    console.error("Payment status check error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Status check failed",
    };
  }
}

/**
 * Verify payment hash for security
 */
export function verifyPaymentHash(
  reference: string,
  amount: number,
  status: string,
  hash: string
): boolean {
  try {
    const expectedHash = paynow.hash(reference, amount.toString(), status);
    return expectedHash === hash;
  } catch (error) {
    console.error("Hash verification error:", error);
    return false;
  }
}

/**
 * Farm-specific payment packages
 */
export const FARM_PAYMENT_PACKAGES = {
  BASIC_PLAN: {
    name: "FarmFlow Basic Plan",
    amount: 25.0, // USD
    description: "Basic farm management features for small farms",
    features: [
      "Up to 5 fields",
      "Basic crop tracking",
      "Weather updates",
      "Mobile access",
    ],
  },
  PREMIUM_PLAN: {
    name: "FarmFlow Premium Plan",
    amount: 50.0, // USD
    description: "Advanced farm management for growing operations",
    features: [
      "Unlimited fields",
      "Advanced analytics",
      "AI recommendations",
      "Equipment tracking",
      "Financial reports",
      "Priority support",
    ],
  },
  ENTERPRISE_PLAN: {
    name: "FarmFlow Enterprise Plan",
    amount: 100.0, // USD
    description: "Complete farm management solution for large operations",
    features: [
      "Everything in Premium",
      "Multi-farm management",
      "Custom integrations",
      "Dedicated support",
      "Advanced reporting",
      "API access",
    ],
  },
  CONSULTATION: {
    name: "Farm Consultation Service",
    amount: 75.0, // USD
    description: "Professional agricultural consultation",
    features: [
      "1-hour video consultation",
      "Crop planning advice",
      "Soil analysis review",
      "Custom recommendations",
    ],
  },
  SOIL_ANALYSIS: {
    name: "Soil Analysis Service",
    amount: 35.0, // USD
    description: "Professional soil testing and analysis",
    features: [
      "Comprehensive soil test",
      "Nutrient analysis",
      "pH testing",
      "Improvement recommendations",
    ],
  },
};

/**
 * Generate payment reference
 */
export function generatePaymentReference(
  userId: string,
  packageType: string
): string {
  const timestamp = Date.now();
  return `FARM_${packageType}_${userId}_${timestamp}`;
}

/**
 * Format amount for display
 */
export function formatAmount(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

/**
 * Convert USD to ZWL (approximate - should use real exchange rate API)
 */
export function convertUSDToZWL(usdAmount: number): number {
  // This is a placeholder - in production, use a real exchange rate API
  const exchangeRate = 320; // Approximate USD to ZWL rate
  return usdAmount * exchangeRate;
}

export default {
  createPayment,
  checkPaymentStatus,
  verifyPaymentHash,
  generatePaymentReference,
  formatAmount,
  convertUSDToZWL,
  FARM_PAYMENT_PACKAGES,
};
