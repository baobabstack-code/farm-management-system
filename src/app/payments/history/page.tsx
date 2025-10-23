"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatAmount } from "@/lib/services/paynow-service";
import { ArrowLeft, CreditCard, Calendar, DollarSign } from "lucide-react";
import Link from "next/link";

interface Payment {
  id: string;
  reference: string;
  paynowReference?: string;
  amount: number;
  currency: string;
  status: string;
  packageType: string;
  paidAt?: string;
  createdAt: string;
}

export default function PaymentHistoryPage() {
  const { user } = useUser();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPaymentHistory();
    }
  }, [user]);

  const fetchPaymentHistory = async () => {
    try {
      const response = await fetch("/api/payments/history");
      const data = await response.json();

      if (data.success) {
        setPayments(data.payments);
      } else {
        setError(data.error || "Failed to load payment history");
      }
    } catch (error) {
      console.error("Error fetching payment history:", error);
      setError("Failed to load payment history");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatPackageType = (packageType: string) => {
    return packageType
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payment history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/payments">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payments
          </Button>
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Payment History
        </h1>
        <p className="text-gray-600">
          View all your FarmFlow payment transactions
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {payments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No payments yet
            </h3>
            <p className="text-gray-600 mb-4">
              You haven't made any payments yet. Choose a plan to get started.
            </p>
            <Link href="/payments">
              <Button>View Payment Plans</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <Card key={payment.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {formatPackageType(payment.packageType)}
                  </CardTitle>
                  <Badge className={getStatusColor(payment.status)}>
                    {payment.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="font-semibold">
                        {formatAmount(payment.amount, payment.currency)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-semibold">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Reference</p>
                    <p className="font-mono text-sm">{payment.reference}</p>
                  </div>

                  {payment.paynowReference && (
                    <div>
                      <p className="text-sm text-gray-500">Paynow Reference</p>
                      <p className="font-mono text-sm">
                        {payment.paynowReference}
                      </p>
                    </div>
                  )}
                </div>

                {payment.paidAt && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-green-600">
                      ✓ Paid on
                      {new Date(payment.paidAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
