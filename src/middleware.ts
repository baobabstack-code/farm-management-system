import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/crops(.*)",
  "/tasks(.*)",
  "/activities(.*)",
  "/reports(.*)",
  "/profile(.*)",
  "/api/analytics(.*)",
  "/api/crops(.*)",
  "/api/tasks(.*)",
  "/api/irrigation(.*)",
  "/api/fertilizer(.*)",
  "/api/pest-disease(.*)",
  "/api/harvest(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
