import { Metadata } from "next";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PaymentMethodForm } from "@/components/payments/PaymentMethodForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, CreditCard, Shield, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Add Payment Method | FarmFlow Onboarding",
  description: "Add a payment method to activate your FarmFlow trial",
};

export default async function OnboardingPaymentPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to FarmFlow! 🌱
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Add a payment method to activate your 7-day free trial
          </p>
          <p className="text-gray-500">
            No charges until your trial ends. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Benefits */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  What You Get
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">7-Day Free Trial</h4>
                    <p className="text-sm text-gray-600">
                      Full access to all features with no charges
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">Unlimited Fields & Crops</h4>
                    <p className="text-sm text-gray-600">
                      Track all your agricultural activities
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">AI-Powered Insights</h4>
                    <p className="text-sm text-gray-600">
                      Get personalized farming recommendations
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">Weather & Analytics</h4>
                    <p className="text-sm text-gray-600">
                      Real-time weather data and crop analytics
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Secure & Trusted
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">Secure payment processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">Cancel anytime during trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">Your data is protected</span>
                </div>
              </CardContent>
            </Card>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">
                💡 Why do we need a payment method?
              </h4>
              <p className="text-sm text-blue-800">
                Adding a payment method allows us to seamlessly continue your
                service after the trial period. You won't be charged until your
                trial ends, and you can cancel anytime.
              </p>
            </div>
          </div>

          {/* Payment Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Add Payment Method</CardTitle>
                <CardDescription>
                  Choose your preferred payment method to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PaymentMethodForm
                  onSuccess={() => {
                    window.location.href = "/dashboard?welcome=true";
                  }}
                  showTrialInfo={true}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">
            Need help? Contact our support team
          </p>
          <div className="flex justify-center gap-4 text-sm">
            <a
              href="mailto:support@farmflow.com"
              className="text-green-600 hover:underline"
            >
              Email Support
            </a>
            <span className="text-gray-300">|</span>
            <a href="/help" className="text-green-600 hover:underline">
              Help Center
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
