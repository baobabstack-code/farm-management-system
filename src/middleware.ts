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
