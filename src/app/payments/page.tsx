"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PaymentPlans from "@/components/payments/PaymentPlans";
import SubscriptionStatus from "@/components/subscription/SubscriptionStatus";
import { PageHeader } from "@/components/ui/farm-theme";
import { Button } from "@/components/ui/button";
import { CreditCard, History } from "lucide-react";
import Link from "next/link";

export default function PaymentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const expired = searchParams.get("expired");

  const handlePaymentInitiated = (reference: string) => {
    // Redirect to status page
    router.push(`/payments/status?ref=${reference}`);
  };

  return (
    <div className="page-container">
      <div className="content-container padding-responsive-lg mobile-header-spacing content-spacing">
        <div className="flex items-center justify-between mb-8">
          <PageHeader
            title="FarmFlow Payments"
            description="Choose your plan and unlock the full potential of your farm management"
            icon={<CreditCard className="h-8 w-8" />}
          />

          <Link href="/payments/history">
            <Button variant="outline">
              <History className="h-4 w-4 mr-2" />
              Payment History
            </Button>
          </Link>
        </div>

        {/* Trial Expired Notice */}
        {expired && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-red-900 mb-2">
              🚨 Trial Expired
            </h3>
            <p className="text-red-700">
              Your 7-day free trial has expired. Please choose a plan below to
              continue using FarmFlow.
            </p>
          </div>
        )}

        {/* Current Subscription Status */}
        <div className="mb-8">
          <SubscriptionStatus />
        </div>

        <PaymentPlans onPaymentInitiated={handlePaymentInitiated} />
      </div>
    </div>
  );
}
