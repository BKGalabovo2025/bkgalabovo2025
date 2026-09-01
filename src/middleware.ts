import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Public root and prefixes that do not require authenticated session
const publicExactPaths = ["/"];
const publicPrefixes = ["/login", "/quiz", "/club", "/recovery-zone"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow root path exact match
  if (publicExactPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // 2. Allow public prefixes
  if (publicPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // 3. Allow Next.js internal static assets and file extensions
  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // 4. Verify session cookie for protected routes
  const session = request.cookies.get("session");
  if (!session?.value) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Match all request paths except api, _next/static, _next/image, favicon.ico, manifest.json
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json).*)"],
};
