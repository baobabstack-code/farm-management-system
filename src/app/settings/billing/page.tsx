"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  PageContainer,
  FarmCard,
  FarmCardHeader,
  FarmCardContent,
  FarmButton,
  FarmBadge,
  LoadingState,
} from "@/components/ui/farm-theme";
import {
  CreditCard,
  Calendar,
  Download,
  AlertCircle,
  CheckCircle,
  Star,
} from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: "month" | "year";
  features: string[];
  isPopular?: boolean;
}

interface BillingInfo {
  currentPlan: {
    name: string;
    price: number;
    interval: "month" | "year";
    status: "active" | "cancelled" | "past_due";
    nextBilling: string;
    cancelAtPeriodEnd: boolean;
  };
  paymentMethod: {
    type: "card";
    last4: string;
    brand: string;
    expiryMonth: number;
    expiryYear: number;
  } | null;
  invoices: Array<{
    id: string;
    date: string;
    amount: number;
    status: "paid" | "pending" | "failed";
    downloadUrl?: string;
  }>;
}

const AVAILABLE_PLANS: SubscriptionPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
    interval: "month",
    features: [
      "Up to 5 crops",
      "Basic weather data",
      "Simple task management",
      "Basic reporting",
      "Email support",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: 29,
    interval: "month",
    isPopular: true,
    features: [
      "Unlimited crops",
      "Advanced weather insights",
      "AI-powered recommendations",
      "Equipment management",
      "Financial tracking",
      "Advanced reporting",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 99,
    interval: "month",
    features: [
      "Everything in Professional",
      "Multi-farm management",
      "Custom integrations",
      "Advanced analytics",
      "QuickBooks integration",
      "Dedicated support",
      "Custom training",
    ],
  },
];

export default function BillingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [changingPlan, setChangingPlan] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push("/sign-in");
      return;
    }

    // Mock billing info - in a real app, this would come from your payment provider
    const mockBillingInfo: BillingInfo = {
      currentPlan: {
        name: "Professional",
        price: 29,
        interval: "month",
        status: "active",
        nextBilling: "2024-02-15",
        cancelAtPeriodEnd: false,
      },
      paymentMethod: {
        type: "card",
        last4: "4242",
        brand: "Visa",
        expiryMonth: 12,
        expiryYear: 2025,
      },
      invoices: [
        {
          id: "inv_001",
          date: "2024-01-15",
          amount: 29,
          status: "paid",
          downloadUrl: "#",
        },
        {
          id: "inv_002",
          date: "2023-12-15",
          amount: 29,
          status: "paid",
          downloadUrl: "#",
        },
        {
          id: "inv_003",
          date: "2023-11-15",
          amount: 29,
          status: "paid",
          downloadUrl: "#",
        },
      ],
    };

    setBillingInfo(mockBillingInfo);
    setLoading(false);
  }, [user, isLoaded, router]);

  const handlePlanChange = async (planId: string) => {
    setChangingPlan(planId);
    setError("");
    setSuccess("");

    try {
      // In a real app, this would integrate with Stripe, Paddle, or similar
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const newPlan = AVAILABLE_PLANS.find((p) => p.id === planId);
      if (newPlan && billingInfo) {
        setBillingInfo({
          ...billingInfo,
          currentPlan: {
            ...billingInfo.currentPlan,
            name: newPlan.name,
            price: newPlan.price,
          },
        });
        setSuccess(`Successfully upgraded to ${newPlan.name} plan!`);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError("Failed to change plan. Please try again.");
      console.error("Plan change error:", err);
    } finally {
      setChangingPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your billing period."
      )
    ) {
      return;
    }

    try {
      // In a real app, this would cancel the subscription
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (billingInfo) {
        setBillingInfo({
          ...billingInfo,
          currentPlan: {
            ...billingInfo.currentPlan,
            cancelAtPeriodEnd: true,
          },
        });
        setSuccess(
          "Subscription cancelled. You'll retain access until your next billing date."
        );
        setTimeout(() => setSuccess(""), 5000);
      }
    } catch (err) {
      setError("Failed to cancel subscription. Please try again.");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <FarmBadge variant="success">Active</FarmBadge>;
      case "cancelled":
        return <FarmBadge variant="warning">Cancelled</FarmBadge>;
      case "past_due":
        return <FarmBadge variant="error">Past Due</FarmBadge>;
      case "paid":
        return <FarmBadge variant="success">Paid</FarmBadge>;
      case "pending":
        return <FarmBadge variant="warning">Pending</FarmBadge>;
      case "failed":
        return <FarmBadge variant="error">Failed</FarmBadge>;
      default:
        return <FarmBadge variant="neutral">{status}</FarmBadge>;
    }
  };

  if (!isLoaded || loading) {
    return <LoadingState message="Loading billing information..." />;
  }

  if (!billingInfo) {
    return <LoadingState message="Loading subscription details..." />;
  }

  return (
    <PageContainer>
      <div className="farm-page-header">
        <div className="farm-page-title-section">
          <div className="farm-page-title-group">
            <div className="farm-page-icon bg-gradient-to-br from-info to-info/80">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div className="farm-page-title-text">
              <h1 className="farm-heading-display">Billing & Subscription</h1>
              <p className="farm-text-muted mt-1">
                Manage your subscription, payment methods, and billing history
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <FarmCard className="border-destructive/20 bg-destructive/5 mb-6">
          <FarmCardContent>
            <div className="flex items-center gap-3 p-4">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <span className="text-destructive font-medium">{error}</span>
            </div>
          </FarmCardContent>
        </FarmCard>
      )}

      {success && (
        <FarmCard className="border-success/20 bg-success/5 mb-6">
          <FarmCardContent>
            <div className="flex items-center gap-3 p-4">
              <CheckCircle className="w-5 h-5 text-success" />
              <span className="text-success font-medium">{success}</span>
            </div>
          </FarmCardContent>
        </FarmCard>
      )}

      <div className="farm-grid farm-grid-responsive">
        {/* Current Subscription */}
        <div>
          <FarmCard>
            <FarmCardHeader title="Current Subscription" />
            <FarmCardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="farm-heading-card">
                      {billingInfo.currentPlan.name}
                    </h3>
                    <p className="farm-text-muted">
                      {formatCurrency(billingInfo.currentPlan.price)}/
                      {billingInfo.currentPlan.interval}
                    </p>
                  </div>
                  {getStatusBadge(billingInfo.currentPlan.status)}
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="farm-text-body">
                      Next billing:{" "}
                      {formatDate(billingInfo.currentPlan.nextBilling)}
                    </span>
                  </div>

                  {billingInfo.currentPlan.cancelAtPeriodEnd && (
                    <div className="flex items-center gap-2 text-warning">
                      <AlertCircle className="w-4 h-4" />
                      <span className="farm-text-body">
                        Subscription will cancel on{" "}
                        {formatDate(billingInfo.currentPlan.nextBilling)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-border">
                  {!billingInfo.currentPlan.cancelAtPeriodEnd ? (
                    <FarmButton
                      variant="outline"
                      onClick={handleCancelSubscription}
                      className="w-full"
                    >
                      Cancel Subscription
                    </FarmButton>
                  ) : (
                    <FarmButton
                      variant="primary"
                      onClick={() => {
                        // Reactivate subscription
                        setBillingInfo({
                          ...billingInfo,
                          currentPlan: {
                            ...billingInfo.currentPlan,
                            cancelAtPeriodEnd: false,
                          },
                        });
                        setSuccess("Subscription reactivated!");
                        setTimeout(() => setSuccess(""), 3000);
                      }}
                      className="w-full"
                    >
                      Reactivate Subscription
                    </FarmButton>
                  )}
                </div>
              </div>
            </FarmCardContent>
          </FarmCard>
        </div>

        {/* Payment Method */}
        <div>
          <FarmCard>
            <FarmCardHeader title="Payment Method" />
            <FarmCardContent>
              {billingInfo.paymentMethod ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                    <CreditCard className="w-8 h-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {billingInfo.paymentMethod.brand} ••••{" "}
                        {billingInfo.paymentMethod.last4}
                      </p>
                      <p className="farm-text-caption">
                        Expires {billingInfo.paymentMethod.expiryMonth}/
                        {billingInfo.paymentMethod.expiryYear}
                      </p>
                    </div>
                  </div>

                  <FarmButton variant="outline" className="w-full">
                    Update Payment Method
                  </FarmButton>
                </div>
              ) : (
                <div className="text-center py-6">
                  <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="farm-text-muted mb-4">
                    No payment method on file
                  </p>
                  <FarmButton variant="primary">Add Payment Method</FarmButton>
                </div>
              )}
            </FarmCardContent>
          </FarmCard>
        </div>

        {/* Available Plans */}
        <div className="lg:col-span-2">
          <FarmCard>
            <FarmCardHeader title="Available Plans" />
            <FarmCardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {AVAILABLE_PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative p-4 border rounded-lg ${
                      plan.name === billingInfo.currentPlan.name
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                  >
                    {plan.isPopular && (
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <div className="flex items-center gap-1 bg-warning text-warning-foreground px-2 py-1 rounded-full text-xs font-medium">
                          <Star className="w-3 h-3" />
                          Popular
                        </div>
                      </div>
                    )}

                    <div className="text-center mb-4">
                      <h3 className="farm-heading-card mb-2">{plan.name}</h3>
                      <div className="mb-2">
                        <span className="text-2xl font-bold">
                          {formatCurrency(plan.price)}
                        </span>
                        <span className="farm-text-muted">
                          /{plan.interval}
                        </span>
                      </div>
                    </div>

                    <ul className="space-y-2 mb-4">
                      {plan.features.map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-2 farm-text-body"
                        >
                          <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {plan.name === billingInfo.currentPlan.name ? (
                      <FarmButton variant="outline" disabled className="w-full">
                        Current Plan
                      </FarmButton>
                    ) : (
                      <FarmButton
                        variant={plan.isPopular ? "primary" : "outline"}
                        onClick={() => handlePlanChange(plan.id)}
                        loading={changingPlan === plan.id}
                        className="w-full"
                      >
                        {changingPlan === plan.id
                          ? "Upgrading..."
                          : plan.price > billingInfo.currentPlan.price
                            ? "Upgrade"
                            : plan.price === 0
                              ? "Downgrade"
                              : "Change Plan"}
                      </FarmButton>
                    )}
                  </div>
                ))}
              </div>
            </FarmCardContent>
          </FarmCard>
        </div>

        {/* Billing History */}
        <div className="lg:col-span-2">
          <FarmCard>
            <FarmCardHeader title="Billing History" />
            <FarmCardContent>
              <div className="space-y-3">
                {billingInfo.invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {formatDate(invoice.date)}
                        </p>
                        <p className="farm-text-caption">
                          Invoice #{invoice.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(invoice.amount)}
                        </p>
                        {getStatusBadge(invoice.status)}
                      </div>

                      {invoice.downloadUrl && invoice.status === "paid" && (
                        <FarmButton
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            window.open(invoice.downloadUrl, "_blank")
                          }
                        >
                          <Download className="w-4 h-4" />
                        </FarmButton>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </FarmCardContent>
          </FarmCard>
        </div>
      </div>
    </PageContainer>
  );
}
