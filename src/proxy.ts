import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Define paths that are public and do not require authentication
const publicPaths = ["/login", "/api", "/quiz", "/club/camps"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public paths and static assets
  if (
    publicPaths.some((path) => pathname.startsWith(path)) ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get("session");

  // If no session is found, redirect to the login page
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware to all routes except api, _next/static, _next/image, favicon.ico, manifest.json
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json).*)"],
};
