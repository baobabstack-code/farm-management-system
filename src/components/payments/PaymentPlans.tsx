"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Loader2 } from "lucide-react";
import {
  FARM_PAYMENT_PACKAGES,
  formatAmount,
} from "@/lib/services/paynow-service";
import { useAnalytics } from "@/hooks/use-analytics";

interface PaymentPlansProps {
  onPaymentInitiated?: (reference: string) => void;
}

export default function PaymentPlans({
  onPaymentInitiated,
}: PaymentPlansProps) {
  const { user } = useUser();
  const { trackUserAction } = useAnalytics();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async (packageType: string) => {
    if (!user?.emailAddresses?.[0]?.emailAddress) {
      setError("Please ensure your email is verified");
      return;
    }

    setLoading(packageType);
    setError(null);

    try {
      // Track payment initiation
      trackUserAction("payment_initiated", "billing", {
        package_type: packageType,
        payment_method: "paynow",
      });

      const response = await fetch("/api/payments/paynow/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packageType,
          email: user.emailAddresses[0].emailAddress,
          phone: user.phoneNumbers?.[0]?.phoneNumber || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to Paynow payment page
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        }

        if (onPaymentInitiated) {
          onPaymentInitiated(data.reference);
        }
      } else {
        setError(data.error || "Payment creation failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      setError("Failed to create payment. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    {
      key: "BASIC_PLAN",
      ...FARM_PAYMENT_PACKAGES.BASIC_PLAN,
      popular: false,
      color: "border-gray-200",
    },
    {
      key: "PREMIUM_PLAN",
      ...FARM_PAYMENT_PACKAGES.PREMIUM_PLAN,
      popular: true,
      color: "border-green-500",
    },
    {
      key: "ENTERPRISE_PLAN",
      ...FARM_PAYMENT_PACKAGES.ENTERPRISE_PLAN,
      popular: false,
      color: "border-blue-500",
    },
  ];

  const services = [
    {
      key: "CONSULTATION",
      ...FARM_PAYMENT_PACKAGES.CONSULTATION,
      type: "service",
    },
    {
      key: "SOIL_ANALYSIS",
      ...FARM_PAYMENT_PACKAGES.SOIL_ANALYSIS,
      type: "service",
    },
  ];

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Subscription Plans */}
      <div>
        <h2 className="text-2xl font-bold text-center mb-2">
          Choose Your Plan
        </h2>
        <p className="text-gray-600 text-center mb-8">
          Select the perfect plan for your farm management needs
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.key}
              className={`relative ${plan.color} ${plan.popular ? "ring-2 ring-green-500" : ""}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500">
                  Most Popular
                </Badge>
              )}

              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="text-3xl font-bold text-green-600">
                  {formatAmount(plan.amount)}
                  <span className="text-sm font-normal text-gray-500">
                    /month
                  </span>
                </div>
                <p className="text-gray-600">{plan.description}</p>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handlePayment(plan.key)}
                  disabled={loading === plan.key}
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                >
                  {loading === plan.key ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Get Started
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Additional Services */}
      <div>
        <h2 className="text-2xl font-bold text-center mb-2">
          Professional Services
        </h2>
        <p className="text-gray-600 text-center mb-8">
          Expert agricultural services to boost your farm's productivity
        </p>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {services.map((service) => (
            <Card key={service.key} className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">{service.name}</CardTitle>
                <div className="text-2xl font-bold text-blue-600">
                  {formatAmount(service.amount)}
                </div>
                <p className="text-gray-600">{service.description}</p>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {service.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handlePayment(service.key)}
                  disabled={loading === service.key}
                  className="w-full"
                  variant="outline"
                >
                  {loading === service.key ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Book Service
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Payment Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <h3 className="font-semibold text-blue-900 mb-2">
          Secure Payment with Paynow
        </h3>
        <p className="text-blue-700 text-sm">
          Pay securely using EcoCash, OneMoney, or Visa/Mastercard through
          Paynow Zimbabwe. All transactions are encrypted and secure.
        </p>
      </div>
    </div>
  );
}
