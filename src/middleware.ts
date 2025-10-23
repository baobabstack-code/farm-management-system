import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isSubscriptionProtectedRoute } from "@/lib/middleware/subscription-middleware";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/crops(.*)",
  "/tasks(.*)",
  "/activities(.*)",
  "/reports(.*)",
  "/profile(.*)",
  "/payments(.*)",
  "/ai-companion(.*)",
  "/planning(.*)",
  "/weather(.*)",
  "/settings(.*)",
  "/api/analytics(.*)",
  "/api/crops(.*)",
  "/api/tasks(.*)",
  "/api/irrigation(.*)",
  "/api/fertilizer(.*)",
  "/api/pest-disease(.*)",
  "/api/harvest(.*)",
  "/api/user(.*)",
  "/api/payments(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  // First check authentication
  if (isProtectedRoute(req)) {
    auth().protect();
  }

  // Skip subscription checks for certain routes
  const skipSubscriptionCheck = [
    "/payments",
    "/api/payments",
    "/api/user/subscription",
    "/sign-in",
    "/sign-up",
  ].some((route) => pathname.startsWith(route));

  if (skipSubscriptionCheck) {
    return NextResponse.next();
  }

  // Check subscription for premium features
  if (isSubscriptionProtectedRoute(pathname)) {
    try {
      const { currentUser } = await import("@clerk/nextjs/server");
      const { SubscriptionService } = await import(
        "@/lib/services/subscription-service"
      );

      const user = await currentUser();

      if (user) {
        const hasAccess = await SubscriptionService.hasAccess(user.id);

        if (!hasAccess) {
          return NextResponse.redirect(
            new URL("/payments?expired=true", req.url)
          );
        }
      }
    } catch (error) {
      console.error("Subscription check error:", error);
      // Continue on error to prevent blocking users
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
