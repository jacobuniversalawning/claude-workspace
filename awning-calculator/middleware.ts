import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const pathname = req.nextUrl.pathname;

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

  // User is logged in - clear redirect counter and proceed
  const response = NextResponse.next();
  response.cookies.set("auth_redirect_count", "0", { maxAge: 60 });
  return response;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
