"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PaymentStatus from "@/components/payments/PaymentStatus";
import { PageHeader } from "@/components/ui/farm-theme";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard } from "lucide-react";
import Link from "next/link";

export default function PaymentStatusPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [reference, setReference] = useState<string | null>(null);
  const [pollUrl, setPollUrl] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);

  useEffect(() => {
    const ref = searchParams.get("ref");
    const poll = searchParams.get("poll");
    const amt = searchParams.get("amount");

    if (ref) setReference(ref);
    if (poll) setPollUrl(poll);
    if (amt) setAmount(parseFloat(amt));
  }, [searchParams]);

  const handleStatusChange = (status: string, paid: boolean) => {
    if (paid) {
      // Payment successful - could redirect to dashboard or show success
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    }
  };

  if (!reference) {
    return (
      <div className="page-container">
        <div className="content-container padding-responsive-lg mobile-header-spacing content-spacing">
          <PageHeader
            title="Payment Status"
            description="Track your payment progress"
            icon={<CreditCard className="h-8 w-8" />}
          />

          <div className="text-center space-y-4">
            <p className="text-gray-600">No payment reference found.</p>
            <Link href="/payments">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Payments
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="content-container padding-responsive-lg mobile-header-spacing content-spacing">
        <PageHeader
          title="Payment Status"
          description="Track your payment progress"
          icon={<CreditCard className="h-8 w-8" />}
        />

        <div className="max-w-2xl mx-auto space-y-6">
          <PaymentStatus
            reference={reference}
            pollUrl={pollUrl || undefined}
            amount={amount || undefined}
            onStatusChange={handleStatusChange}
          />

          <div className="text-center">
            <Link href="/payments">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Payments
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
