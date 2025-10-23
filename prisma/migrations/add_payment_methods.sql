-- Add payment methods and update subscription system

-- Create payment methods table
CREATE TABLE "payment_methods" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "last4" TEXT,
    "expiryMonth" INTEGER,
    "expiryYear" INTEGER,
    "cardBrand" TEXT,
    "phoneNumber" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "providerMethodId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- Add new fields to user_subscriptions
ALTER TABLE "user_subscriptions" ADD COLUMN "paymentMethodId" TEXT;
ALTER TABLE "user_subscriptions" ADD COLUMN "autoRenew" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "user_subscriptions" ADD COLUMN "requiresPaymentMethod" BOOLEAN NOT NULL DEFAULT true;

-- Update subscription status enum to include PENDING_PAYMENT_METHOD
ALTER TYPE "SubscriptionStatus" ADD VALUE 'PENDING_PAYMENT_METHOD';

-- Create indexes
CREATE INDEX "payment_methods_userId_idx" ON "payment_methods"("userId");
CREATE INDEX "payment_methods_isDefault_idx" ON "payment_methods"("isDefault");

-- Add foreign key constraint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;