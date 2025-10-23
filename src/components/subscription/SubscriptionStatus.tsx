"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, Crown, AlertTriangle } from "lucide-react";
import { useSubscription } from "@/lib/hooks/use-subscription";
import { useRouter } from "next/navigation";

export default function SubscriptionStatus() {
  const {
    subscription,
    loading,
    hasAccess,
    getTrialDaysRemaining,
    isTrialExpired,
  } = useSubscription();
  const router = useRouter();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              No Subscription Found
            </h3>
            <p className="text-red-700 mb-4">
              Start your free trial to access FarmFlow features.
            </p>
            <Button onClick={() => router.push("/payments")}>
              Start Free Trial
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const daysRemaining = getTrialDaysRemaining();
  const trialProgress = subscription.isTrialActive
    ? ((7 - daysRemaining) / 7) * 100
    : 100;

  const getStatusBadge = () => {
    if (subscription.isTrialActive) {
      return <Badge className="bg-blue-500">Free Trial</Badge>;
    }
    if (subscription.isSubscriptionActive) {
      return <Badge className="bg-green-500">Active</Badge>;
    }
    if (isTrialExpired()) {
      return <Badge variant="destructive">Trial Expired</Badge>;
    }
    return <Badge variant="secondary">{subscription.status}</Badge>;
  };

  const getPlanIcon = () => {
    switch (subscription.planType) {
      case "BASIC":
        return <Calendar className="h-5 w-5" />;
      case "PROFESSIONAL":
        return <Crown className="h-5 w-5" />;
      case "ENTERPRISE":
        return <Crown className="h-5 w-5 text-purple-500" />;
      default:
        return <Calendar className="h-5 w-5" />;
    }
  };

  return (
    <Card
      className={`${subscription.isTrialActive ? "border-blue-200" : subscription.isSubscriptionActive ? "border-green-200" : "border-red-200"}`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getPlanIcon()}
            {subscription.planType} Plan
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Trial Status */}
        {subscription.isTrialActive && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Trial Progress
              </span>
              <span className="font-medium">
                {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining
              </span>
            </div>
            <Progress value={trialProgress} className="h-2" />
            <p className="text-xs text-gray-600">
              Your free trial ends on{" "}
              {new Date(subscription.trialEndDate).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Subscription Status */}
        {subscription.isSubscriptionActive && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Subscription Active</span>
              <span className="font-medium text-green-600">
                {daysRemaining} days remaining
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Next billing:{" "}
              {subscription.subscriptionEndDate
                ? new Date(
                    subscription.subscriptionEndDate
                  ).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        )}

        {/* Expired Status */}
        {isTrialExpired() && !subscription.isSubscriptionActive && (
          <div className="text-center space-y-3">
            <div className="text-red-600">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p className="font-medium">Trial Expired</p>
              <p className="text-sm">Upgrade to continue using FarmFlow</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {subscription.isTrialActive && (
            <Button onClick={() => router.push("/payments")} className="flex-1">
              Upgrade Now
            </Button>
          )}

          {isTrialExpired() && (
            <Button onClick={() => router.push("/payments")} className="flex-1">
              Subscribe Now
            </Button>
          )}

          {subscription.isSubscriptionActive && (
            <Button
              variant="outline"
              onClick={() => router.push("/payments/history")}
              className="flex-1"
            >
              View Billing
            </Button>
          )}
        </div>

        {/* Plan Features */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Plan Features:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            {subscription.planType === "BASIC" && (
              <>
                <span>• 5 Fields</span>
                <span>• 10 Crops</span>
                <span>• Basic Analytics</span>
                <span>• 50 AI Requests</span>
              </>
            )}
            {subscription.planType === "PROFESSIONAL" && (
              <>
                <span>• 25 Fields</span>
                <span>• 50 Crops</span>
                <span>• Advanced Analytics</span>
                <span>• 200 AI Requests</span>
                <span>• Weather Alerts</span>
                <span>• Financial Tracking</span>
              </>
            )}
            {subscription.planType === "ENTERPRISE" && (
              <>
                <span>• Unlimited Fields</span>
                <span>• Unlimited Crops</span>
                <span>• All Features</span>
                <span>• Unlimited AI</span>
                <span>• Priority Support</span>
                <span>• Custom Integration</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
