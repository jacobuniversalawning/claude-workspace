import { handlers } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// Wrap handlers with error handling to prevent infinite redirects
async function wrappedGET(request: NextRequest) {
  try {
    return await handlers.GET(request);
  } catch (error) {
    console.error("[Auth API] GET error:", error);
    // Redirect to login with error instead of crashing
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "OAuthCallbackError");
    return NextResponse.redirect(url);
  }
}

async function wrappedPOST(request: NextRequest) {
  try {
    return await handlers.POST(request);
  } catch (error) {
    console.error("[Auth API] POST error:", error);
    // Redirect to login with error instead of crashing
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "OAuthCallbackError");
    return NextResponse.redirect(url);
  }
}

export { wrappedGET as GET, wrappedPOST as POST };
