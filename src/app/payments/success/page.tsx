"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Home } from "lucide-react";
import Link from "next/link";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-green-700">
            Payment Successful!
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-6">
          <div>
            <p className="text-gray-600 mb-2">
              Thank you for your payment. Your FarmFlow subscription is now
              active!
            </p>
            {reference && (
              <p className="text-sm text-gray-500">Reference: {reference}</p>
            )}
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">What's Next?</h3>
            <ul className="text-sm text-green-700 space-y-1 text-left">
              <li>• Access all premium features</li>
              <li>• Unlimited field management</li>
              <li>• Advanced analytics and reports</li>
              <li>• AI-powered recommendations</li>
              <li>• Priority customer support</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Link href="/dashboard" className="block">
              <Button className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </Link>

            <Link href="/settings/billing" className="block">
              <Button variant="outline" className="w-full">
                <ArrowRight className="h-4 w-4 mr-2" />
                View Billing Details
              </Button>
            </Link>
          </div>

          <div className="text-xs text-gray-500">
            <p>
              You will receive a confirmation email shortly. If you have any
              questions, please contact our support team.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
