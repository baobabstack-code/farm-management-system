import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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

// Lightweight subscription check - just route matching
const subscriptionProtectedRoutes = [
  "/ai-companion",
  "/reports",
  "/settings/integrations",
  "/planning",
  "/weather",
];

function isSubscriptionProtectedRoute(pathname: string): boolean {
  return subscriptionProtectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
}

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  // First check authentication
  if (isProtectedRoute(req)) {
    auth().protect();
  }

  // For subscription-protected routes, redirect to a server-side check
  // This avoids importing heavy dependencies in the middleware
  if (isSubscriptionProtectedRoute(pathname)) {
    const user = auth();

    if (user.userId) {
      // Add a header to indicate this route needs subscription check
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-subscription-check", "true");

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
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
