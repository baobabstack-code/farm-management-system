import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SubscriptionService } from "@/lib/services/subscription-service";

/**
 * Server-side subscription check for protected pages
 * Call this in page components that require subscription access
 */
export async function requireSubscription() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  try {
    const hasAccess = await SubscriptionService.hasAccess(user.id);

    if (!hasAccess) {
      redirect("/payments?expired=true");
    }

    return user;
  } catch (error) {
    console.error("Subscription check error:", error);
    // Allow access on error to prevent blocking users
    return user;
  }
}

/**
 * Check subscription status without redirecting
 * Returns subscription info for display purposes
 */
export async function getSubscriptionStatus() {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  try {
    const subscription = await SubscriptionService.getUserSubscription(user.id);
    const hasAccess = await SubscriptionService.hasAccess(user.id);

    return {
      user,
      subscription,
      hasAccess,
    };
  } catch (error) {
    console.error("Get subscription status error:", error);
    return {
      user,
      subscription: null,
      hasAccess: false,
    };
  }
}
