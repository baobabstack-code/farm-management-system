import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { QuickBooksService } from "@/lib/services/quickbooks-service";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate OAuth URL
    const authUrl = QuickBooksService.getAuthUrl(userId);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("QuickBooks connect error:", error);
    return NextResponse.json(
      { error: "Failed to initiate QuickBooks connection" },
      { status: 500 }
    );
  }
}
