import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("session");

  const isPublicRoute =
    pathname === "/login" ||
    pathname === "/" ||
    pathname.startsWith("/club") ||
    pathname.startsWith("/recovery-zone");

  // If the route is not public and no session exists, redirect to login
  if (!isPublicRoute && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If the user is logged in and tries to access login page, redirect to dashboard
  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (manifest file)
     * - icons (manifest icons)
     * - images (public images)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons|images|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.webp|.*\\.xml).*)",
  ],
};
