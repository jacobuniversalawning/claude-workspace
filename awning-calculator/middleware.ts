import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simplified middleware - no auth checks, no redirects
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
