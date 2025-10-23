-- Add payments table for Paynow integration
CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reference" TEXT NOT NULL UNIQUE,
    "paynowReference" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "packageType" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "pollUrl" TEXT,
    "redirectUrl" TEXT,
    "hash" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "Payment_userId_idx" ON "Payment"("userId");
CREATE INDEX IF NOT EXISTS "Payment_reference_idx" ON "Payment"("reference");
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status");
CREATE INDEX IF NOT EXISTS "Payment_createdAt_idx" ON "Payment"("createdAt");