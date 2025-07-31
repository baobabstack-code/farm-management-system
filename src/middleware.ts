import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if user is trying to access protected routes
        const { pathname } = req.nextUrl;

        // Allow access to auth pages without token
        if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
          return true;
        }

        // Require token for protected routes
        if (
          pathname.startsWith("/dashboard") ||
          pathname.startsWith("/crops") ||
          pathname.startsWith("/tasks") ||
          pathname.startsWith("/activities") ||
          pathname.startsWith("/reports") ||
          pathname.startsWith("/profile")
        ) {
          return !!token;
        }

        // Allow access to public routes
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/crops/:path*",
    "/tasks/:path*",
    "/activities/:path*",
    "/reports/:path*",
    "/profile/:path*",
    "/login",
    "/register",
  ],
};
