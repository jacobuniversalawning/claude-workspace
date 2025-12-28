import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Role hierarchy for permission checks
const ADMIN_ROLES = ['super_admin', 'admin'];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const pathname = req.nextUrl.pathname;
  const userRole = req.auth?.user?.role;
  const isActive = req.auth?.user?.isActive;

  // Get redirect count from cookie to detect loops
  const redirectCount = parseInt(req.cookies.get("auth_redirect_count")?.value || "0");

  // Login page handling
  if (pathname === "/login") {
    // Clear redirect counter when successfully on login page
    const response = NextResponse.next();
    response.cookies.set("auth_redirect_count", "0", { maxAge: 60 });

    // If already logged in, redirect to home
    if (isLoggedIn) {
      const redirectResponse = NextResponse.redirect(new URL("/", req.url));
      redirectResponse.cookies.set("auth_redirect_count", "0", { maxAge: 60 });
      return redirectResponse;
    }

    return response;
  }

  // Protected pages - require login
  if (!isLoggedIn) {
    // Detect infinite redirect loop (more than 5 redirects in 60 seconds)
    if (redirectCount >= 5) {
      console.error("[Middleware] Redirect loop detected, breaking loop");
      // Break the loop by going to login with error and clearing cookie
      const url = new URL("/login", req.url);
      url.searchParams.set("error", "SessionError");
      const response = NextResponse.redirect(url);
      response.cookies.set("auth_redirect_count", "0", { maxAge: 60 });
      return response;
    }

    // Increment redirect counter
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.set("auth_redirect_count", String(redirectCount + 1), { maxAge: 60 });
    return response;
  }

  // User is logged in - check if they are active
  if (!isActive && pathname !== "/pending") {
    // Inactive users can only access the pending page
    const response = NextResponse.redirect(new URL("/pending", req.url));
    response.cookies.set("auth_redirect_count", "0", { maxAge: 60 });
    return response;
  }

  // If user is on pending page but is active, redirect to home
  if (isActive && pathname === "/pending") {
    const response = NextResponse.redirect(new URL("/", req.url));
    response.cookies.set("auth_redirect_count", "0", { maxAge: 60 });
    return response;
  }

  // Admin page protection - require admin or super_admin role
  if (pathname.startsWith("/admin")) {
    if (!ADMIN_ROLES.includes(userRole || '')) {
      console.log(`[Middleware] Access denied to /admin for role: ${userRole}`);
      // Redirect non-admins to home page
      const response = NextResponse.redirect(new URL("/", req.url));
      response.cookies.set("auth_redirect_count", "0", { maxAge: 60 });
      return response;
    }
  }

  // User is logged in and authorized - clear redirect counter and proceed
  const response = NextResponse.next();
  response.cookies.set("auth_redirect_count", "0", { maxAge: 60 });
  return response;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
