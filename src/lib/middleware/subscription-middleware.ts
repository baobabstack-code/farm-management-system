import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { SubscriptionService } from "@/lib/services/subscription-service";

/**
 * Middleware to check subscription access for protected routes
 */
export async function checkSubscriptionAccess(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    // Check if user has access (trial or active subscription)
    const hasAccess = await SubscriptionService.hasAccess(user.id);

    if (!hasAccess) {
      // Redirect to payments page if no access
      return NextResponse.redirect(
        new URL("/payments?expired=true", request.url)
      );
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Subscription middleware error:", error);
    // Allow access on error to prevent blocking users
    return NextResponse.next();
  }
}

/**
 * Routes that require active subscription
 */
export const SUBSCRIPTION_PROTECTED_ROUTES = [
  "/ai-companion",
  "/reports",
  "/settings/integrations",
  "/planning",
  "/weather",
];

/**
 * Check if route requires subscription
 */
export function isSubscriptionProtectedRoute(pathname: string): boolean {
  return SUBSCRIPTION_PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
}
