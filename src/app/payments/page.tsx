"use client";

import React from "react";
import { useRouter } from "next/navigation";
import PaymentPlans from "@/components/payments/PaymentPlans";
import { PageHeader } from "@/components/ui/farm-theme";
import { Button } from "@/components/ui/button";
import { CreditCard, History } from "lucide-react";
import Link from "next/link";

export default function PaymentsPage() {
  const router = useRouter();

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

        <PaymentPlans onPaymentInitiated={handlePaymentInitiated} />
      </div>
    </div>
  );
}
