import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === "/login";
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
  const isApiRoute = req.nextUrl.pathname.startsWith("/api");

  // Allow API routes to pass through (they handle their own auth)
  if (isApiRoute) {
    return NextResponse.next();
  }

  // Allow access to login page
  if (isLoginPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Check if user is active
  if (req.auth && !req.auth.user?.isActive) {
    return NextResponse.redirect(new URL("/login?error=AccessDenied", req.url));
  }

  // Admin routes require admin role (currently allowing all authenticated users)
  if (isAdminRoute && req.auth?.user?.role !== "admin") {
    // For now, allow all authenticated users to access admin
    // Uncomment below to restrict to admin only:
    // return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
