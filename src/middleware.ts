import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/crops(.*)",
  "/tasks(.*)",
  "/activities(.*)",
  "/reports(.*)",
  "/profile(.*)",
  "/ai-companion(.*)",
  "/planning(.*)",
  "/weather(.*)",
  "/settings(.*)",
  "/onboarding(.*)",
  "/api/analytics(.*)",
  "/api/crops(.*)",
  "/api/tasks(.*)",
  "/api/irrigation(.*)",
  "/api/fertilizer(.*)",
  "/api/pest-disease(.*)",
  "/api/harvest(.*)",
  "/api/user(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const pathname = req.nextUrl.pathname;

  // Public routes that don't require authentication
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/webhook");

  // If user is authenticated and not on onboarding page
  if (userId && pathname !== "/onboarding" && !isPublicRoute) {
    // Check if user has completed onboarding
    try {
      const onboardingCheckUrl = new URL("/api/onboarding/status", req.url);
      const onboardingResponse = await fetch(onboardingCheckUrl, {
        headers: {
          "x-user-id": userId,
        },
      });

      if (onboardingResponse.ok) {
        const { completed } = await onboardingResponse.json();

        // If onboarding not completed, redirect to onboarding
        if (!completed) {
          const onboardingUrl = new URL("/onboarding", req.url);
          return NextResponse.redirect(onboardingUrl);
        }
      }
    } catch (error) {
      console.error("Onboarding check error:", error);
      // On error, allow through to avoid blocking user
    }
  }

  // Check authentication for protected routes
  if (isProtectedRoute(req)) {
    auth().protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
