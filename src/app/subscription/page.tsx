import { Metadata } from "next";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SubscriptionManager } from "@/components/subscription/SubscriptionManager";

export const metadata: Metadata = {
  title: "Subscription Management | FarmFlow",
  description:
    "Manage your FarmFlow subscription, billing, and payment methods",
};

export default async function SubscriptionPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Subscription Management
        </h1>
        <p className="text-gray-600">
          Manage your FarmFlow subscription, billing information, and payment
          methods
        </p>
      </div>

      <SubscriptionManager />
    </div>
  );
}
