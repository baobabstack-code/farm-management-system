"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Smartphone,
  Shield,
  CheckCircle,
  Loader2,
} from "lucide-react";

interface PaymentMethodFormProps {
  onPaymentMethodAdded?: (paymentMethodId: string) => void;
  onSuccess?: () => void;
  onSkip?: () => void;
  required?: boolean;
  showTrialInfo?: boolean;
}

export function PaymentMethodForm({
  onPaymentMethodAdded,
  onSuccess,
  onSkip,
  required = false,
  showTrialInfo = false,
}: PaymentMethodFormProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<"card" | "mobile">("card");
  const [formData, setFormData] = useState({
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    phoneNumber: "",
    mobileProvider: "ecocash",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let paymentMethodData;

      if (paymentType === "card") {
        // Validate card data
        if (
          !formData.cardNumber ||
          !formData.expiryMonth ||
          !formData.expiryYear ||
          !formData.cvv
        ) {
          throw new Error("Please fill in all card details");
        }

        paymentMethodData = {
          type: "card",
          provider: "paynow",
          last4: formData.cardNumber.slice(-4),
          expiryMonth: parseInt(formData.expiryMonth),
          expiryYear: parseInt(formData.expiryYear),
          cardBrand: getCardBrand(formData.cardNumber),
          metadata: {
            cardNumber: formData.cardNumber, // In production, tokenize this
            cvv: formData.cvv, // In production, don't store this
          },
        };
      } else {
        // Mobile money
        if (!formData.phoneNumber) {
          throw new Error("Please enter your mobile number");
        }

        paymentMethodData = {
          type: "mobile_money",
          provider: formData.mobileProvider,
          phoneNumber: formData.phoneNumber,
          metadata: {
            provider: formData.mobileProvider,
          },
        };
      }

      // Save payment method and activate trial
      const response = await fetch("/api/user/payment-method", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentMethodData),
      });

      const data = await response.json();

      if (data.success) {
        if (onPaymentMethodAdded) {
          onPaymentMethodAdded(data.paymentMethodId);
        }
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(data.error || "Failed to add payment method");
      }
    } catch (error) {
      console.error("Payment method error:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const getCardBrand = (cardNumber: string): string => {
    const number = cardNumber.replace(/\s/g, "");
    if (number.startsWith("4")) return "visa";
    if (number.startsWith("5") || number.startsWith("2")) return "mastercard";
    return "unknown";
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-green-600" />
          Add Payment Method
        </CardTitle>
        <div className="space-y-2">
          <p className="text-gray-600">
            {required
              ? "Add a payment method to start your 7-day free trial"
              : "Add a payment method for seamless billing"}
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800 font-medium">
                No charge for 7 days - Cancel anytime
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Payment Type Selection */}
        <div className="space-y-3">
          <Label>Payment Method Type</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentType("card")}
              className={`p-4 border rounded-lg flex items-center gap-3 transition-colors ${
                paymentType === "card"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <CreditCard className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Credit/Debit Card</div>
                <div className="text-xs text-gray-500">Visa, Mastercard</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentType("mobile")}
              className={`p-4 border rounded-lg flex items-center gap-3 transition-colors ${
                paymentType === "mobile"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Smartphone className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Mobile Money</div>
                <div className="text-xs text-gray-500">EcoCash, OneMoney</div>
              </div>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {paymentType === "card" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={formData.cardNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cardNumber: formatCardNumber(e.target.value),
                    }))
                  }
                  maxLength={19}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="expiryMonth">Month</Label>
                  <Input
                    id="expiryMonth"
                    placeholder="MM"
                    value={formData.expiryMonth}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        expiryMonth: e.target.value,
                      }))
                    }
                    maxLength={2}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryYear">Year</Label>
                  <Input
                    id="expiryYear"
                    placeholder="YY"
                    value={formData.expiryYear}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        expiryYear: e.target.value,
                      }))
                    }
                    maxLength={2}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={formData.cvv}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        cvv: e.target.value,
                      }))
                    }
                    maxLength={4}
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="mobileProvider">Mobile Money Provider</Label>
                <select
                  id="mobileProvider"
                  value={formData.mobileProvider}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      mobileProvider: e.target.value,
                    }))
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="ecocash">EcoCash</option>
                  <option value="onemoney">OneMoney</option>
                  <option value="telecash">TeleCash</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Mobile Number</Label>
                <Input
                  id="phoneNumber"
                  placeholder="+263 77 123 4567"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      phoneNumber: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding Payment Method...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Start Free Trial
                </>
              )}
            </Button>

            {!required && onSkip && (
              <Button
                type="button"
                variant="outline"
                onClick={onSkip}
                disabled={loading}
              >
                Skip for Now
              </Button>
            )}
          </div>
        </form>

        {/* Security Notice */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-gray-600 mt-0.5" />
            <div className="text-sm text-gray-700">
              <p className="font-medium mb-1">
                Your payment information is secure
              </p>
              <p>
                We use industry-standard encryption and never store sensitive
                card details. You can cancel anytime during your trial.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default PaymentMethodForm;
