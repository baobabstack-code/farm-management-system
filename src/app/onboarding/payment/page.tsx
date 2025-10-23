"use client";

import React from "react";
import { useRouter } from "next/navigation";
import PaymentPlans from "@/components/payments/PaymentPlans";
import { PageHeader } from "@/components/ui/farm-theme";
import { CreditCard } from "lucide-react";

export default function OnboardingPaymentPage() {
  const router = useRouter();

  const handlePaymentInitiated = (reference: string) => {
    // Redirect to status page after payment initiation
    router.push(`/payments/status?ref=${reference}`);
  };

  const handleSkip = () => {
    // Allow users to skip payment during onboarding
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <PageHeader
            title="Choose Your FarmFlow Plan"
            description="Select a plan to unlock the full potential of your farm management system"
            icon={<CreditCard className="h-8 w-8" />}
          />

          <div className="mb-8 text-center">
            <button
              onClick={handleSkip}
              className="text-gray-600 hover:text-gray-800 underline"
            >
              Skip for now and explore with free features
            </button>
          </div>

          <PaymentPlans onPaymentInitiated={handlePaymentInitiated} />
        </div>
      </div>
    </div>
  );
}
