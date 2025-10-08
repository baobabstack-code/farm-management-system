import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { QuickBooksService } from "@/lib/services/quickbooks-service";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const realmId = searchParams.get("realmId");
    const error = searchParams.get("error");

    if (error) {
      console.error("QuickBooks OAuth error:", error);
      return NextResponse.redirect(
        new URL("/settings/integrations?error=oauth_error", request.url)
      );
    }

    if (!code || !realmId) {
      return NextResponse.redirect(
        new URL("/settings/integrations?error=missing_params", request.url)
      );
    }

    // Exchange authorization code for tokens
    await QuickBooksService.handleAuthCallback(code, state!, realmId);

    // Redirect to settings page with success
    return NextResponse.redirect(
      new URL("/settings/integrations?success=connected", request.url)
    );
  } catch (error) {
    console.error("QuickBooks callback error:", error);
    return NextResponse.redirect(
      new URL("/settings/integrations?error=connection_failed", request.url)
    );
  }
}
