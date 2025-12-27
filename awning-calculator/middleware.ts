import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === "/login";
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");

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
    // Protect these routes
    "/",
    "/login",
    "/costsheet/:path*",
    "/admin/:path*",
    "/analytics/:path*",
  ],
};
