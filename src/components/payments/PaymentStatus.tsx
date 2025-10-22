"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  CreditCard,
} from "lucide-react";
import { formatAmount } from "@/lib/services/paynow-service";

interface PaymentStatusProps {
  reference: string;
  pollUrl?: string;
  amount?: number;
  onStatusChange?: (status: string, paid: boolean) => void;
}

export default function PaymentStatus({
  reference,
  pollUrl,
  amount,
  onStatusChange,
}: PaymentStatusProps) {
  const [status, setStatus] = useState<string>("Pending");
  const [paid, setPaid] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkPaymentStatus = async () => {
    if (!pollUrl) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/paynow/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pollUrl }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus(data.status);
        setPaid(data.paid);
        setLastChecked(new Date());

        if (onStatusChange) {
          onStatusChange(data.status, data.paid);
        }
      } else {
        setError(data.error || "Failed to check payment status");
      }
    } catch (error) {
      console.error("Status check error:", error);
      setError("Failed to check payment status");
    } finally {
      setLoading(false);
    }
  };

  // Auto-check status every 10 seconds for pending payments
  useEffect(() => {
    if (pollUrl && !paid && status !== "Cancelled") {
      const interval = setInterval(checkPaymentStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [pollUrl, paid, status]);

  // Initial status check
  useEffect(() => {
    if (pollUrl) {
      checkPaymentStatus();
    }
  }, [pollUrl]);

  const getStatusIcon = () => {
    switch (status) {
      case "Paid":
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case "Cancelled":
        return <XCircle className="h-8 w-8 text-red-500" />;
      case "Pending":
      case "Sent":
        return <Clock className="h-8 w-8 text-yellow-500" />;
      default:
        return <CreditCard className="h-8 w-8 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "Cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "Pending":
      case "Sent":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case "Paid":
        return "Payment completed successfully! Your subscription is now active.";
      case "Cancelled":
        return "Payment was cancelled. Please try again if you wish to proceed.";
      case "Pending":
        return "Payment is being processed. Please complete the payment using your preferred method.";
      case "Sent":
        return "Payment request sent. Please check your mobile device for payment prompts.";
      default:
        return "Checking payment status...";
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">{getStatusIcon()}</div>
        <CardTitle>Payment Status</CardTitle>
        <Badge className={`${getStatusColor()} border`}>{status}</Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">{getStatusMessage()}</p>

          {amount && (
            <p className="text-lg font-semibold">
              Amount: {formatAmount(amount)}
            </p>
          )}

          <p className="text-xs text-gray-500">Reference: {reference}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}

        {lastChecked && (
          <p className="text-xs text-gray-500 text-center">
            Last checked: {lastChecked.toLocaleTimeString()}
          </p>
        )}

        {pollUrl && !paid && status !== "Cancelled" && (
          <Button
            onClick={checkPaymentStatus}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Check Status
              </>
            )}
          </Button>
        )}

        {status === "Paid" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <p className="text-green-800 font-medium">Payment Successful!</p>
            <p className="text-green-700 text-sm">
              Thank you for your payment. Your FarmFlow subscription is now
              active.
            </p>
          </div>
        )}

        {status === "Cancelled" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <XCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
            <p className="text-red-800 font-medium">Payment Cancelled</p>
            <p className="text-red-700 text-sm">
              The payment was cancelled. You can try again anytime.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
