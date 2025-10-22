"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import PaymentPlans from "@/components/payments/PaymentPlans";
import { PageHeader } from "@/components/ui/farm-theme";
import { CreditCard } from "lucide-react";

export default function PaymentsPage() {
  const router = useRouter();
  const [paymentReference, setPaymentReference] = useState<string | null>(null);

  const handlePaymentInitiated = (reference: string) => {
    setPaymentReference(reference);
    // Redirect to status page
    router.push(`/payments/status?ref=${reference}`);
  };

  return (
    <div className="page-container">
      <div className="content-container padding-responsive-lg mobile-header-spacing content-spacing">
        <PageHeader
          title="FarmFlow Payments"
          description="Choose your plan and unlock the full potential of your farm management"
          icon={<CreditCard className="h-8 w-8" />}
        />

        <PaymentPlans onPaymentInitiated={handlePaymentInitiated} />
      </div>
    </div>
  );
}
