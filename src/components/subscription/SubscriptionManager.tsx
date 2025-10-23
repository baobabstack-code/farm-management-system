"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import {
  CreditCard,
  Calendar,
  DollarSign,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
} from "lucide-react";

interface SubscriptionInfo {
  id: string;
  planType: string;
  status: string;
  trialEndDate: string;
  subscriptionEndDate?: string;
  isActive: boolean;
  daysRemaining: number;
  isTrialActive: boolean;
  isSubscriptionActive: boolean;
}

interface PaymentMethod {
  id: string;
  type: string;
  provider: string;
  last4?: string;
  cardBrand?: string;
  phoneNumber?: string;
  isDefault: boolean;
  isActive: boolean;
}

export function SubscriptionManager() {
  const { user } = useUser();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(
    null
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSubscriptionData();
    }
  }, [user]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);

      // Fetch subscription info
      const subResponse = await fetch("/api/user/subscription");
      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscription(subData.subscription);
      }

      // Fetch payment method
      const pmResponse = await fetch("/api/user/payment-method");
      if (pmResponse.ok) {
        const pmData = await pmResponse.json();
        setPaymentMethod(pmData.paymentMethod);
      }
    } catch (error) {
      console.error("Error fetching subscription data:", error);
      toast({
        title: "Error",
        description: "Failed to load subscription information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    try {
      setActionLoading(true);
      const response = await fetch("/api/user/subscription", {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Subscription Canceled",
          description:
            "Your subscription will remain active until the end of the current period.",
        });
        fetchSubscriptionData();
      } else {
        throw new Error("Failed to cancel subscription");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel subscription",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemovePaymentMethod = async () => {
    if (!paymentMethod) return;

    try {
      setActionLoading(true);
      const response = await fetch(
        `/api/user/payment-method?id=${paymentMethod.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast({
          title: "Payment Method Removed",
          description: "Your payment method has been removed successfully.",
        });
        fetchSubscriptionData();
      } else {
        throw new Error("Failed to remove payment method");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove payment method",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      TRIAL: { color: "bg-blue-100 text-blue-800", icon: Clock },
      ACTIVE: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      EXPIRED: { color: "bg-red-100 text-red-800", icon: AlertCircle },
      CANCELED: { color: "bg-gray-100 text-gray-800", icon: X },
      PENDING_PAYMENT_METHOD: {
        color: "bg-yellow-100 text-yellow-800",
        icon: AlertCircle,
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.EXPIRED;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getPlanDisplayName = (planType: string) => {
    const plans = {
      BASIC: "Basic Plan",
      PROFESSIONAL: "Professional Plan",
      ENTERPRISE: "Enterprise Plan",
    };
    return plans[planType as keyof typeof plans] || planType;
  };

  const getPlanPrice = (planType: string) => {
    const prices = {
      BASIC: "$25",
      PROFESSIONAL: "$50",
      ENTERPRISE: "$100",
    };
    return prices[planType as keyof typeof prices] || "$0";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-24 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subscription Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Subscription Overview
          </CardTitle>
          <CardDescription>
            Manage your FarmFlow subscription and billing information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">
                    {getPlanDisplayName(subscription.planType)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {getPlanPrice(subscription.planType)}/month
                  </p>
                </div>
                {getStatusBadge(subscription.status)}
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Days Remaining</p>
                    <p className="text-sm text-gray-600">
                      {subscription.daysRemaining} days
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-sm text-gray-600">
                      {subscription.isTrialActive
                        ? "Trial Active"
                        : subscription.isSubscriptionActive
                          ? "Subscription Active"
                          : "Inactive"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Next Billing</p>
                    <p className="text-sm text-gray-600">
                      {subscription.subscriptionEndDate
                        ? new Date(
                            subscription.subscriptionEndDate
                          ).toLocaleDateString()
                        : new Date(
                            subscription.trialEndDate
                          ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {subscription.status === "PENDING_PAYMENT_METHOD" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <div>
                      <h4 className="font-medium text-yellow-800">
                        Payment Method Required
                      </h4>
                      <p className="text-sm text-yellow-700">
                        Add a payment method to activate your trial and access
                        all features.
                      </p>
                    </div>
                  </div>
                  <Button
                    className="mt-3"
                    onClick={() => (window.location.href = "/payments")}
                  >
                    Add Payment Method
                  </Button>
                </div>
              )}

              {subscription.isActive && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => (window.location.href = "/payments")}
                  >
                    Upgrade Plan
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancelSubscription}
                    disabled={actionLoading}
                  >
                    Cancel Subscription
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No active subscription found</p>
              <Button onClick={() => (window.location.href = "/payments")}>
                Choose a Plan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Method
          </CardTitle>
          <CardDescription>Manage your payment information</CardDescription>
        </CardHeader>
        <CardContent>
          {paymentMethod ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-8 h-8 text-gray-400" />
                  <div>
                    <p className="font-medium">
                      {paymentMethod.type === "card"
                        ? `${paymentMethod.cardBrand} •••• ${paymentMethod.last4}`
                        : paymentMethod.type === "mobile_money"
                          ? `${paymentMethod.provider} - ${paymentMethod.phoneNumber}`
                          : `${paymentMethod.provider} - ${paymentMethod.type}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      {paymentMethod.isDefault
                        ? "Default payment method"
                        : "Alternative method"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemovePaymentMethod}
                  disabled={actionLoading}
                >
                  Remove
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={() => (window.location.href = "/payments")}
              >
                Add Another Method
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No payment method on file</p>
              <Button onClick={() => (window.location.href = "/payments")}>
                Add Payment Method
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            View your payment history and download receipts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/payments/history")}
          >
            View Payment History
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
