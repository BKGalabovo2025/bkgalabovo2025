import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getAdminAuth } from "@/lib/firebase-admin";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (session) {
      try {
        const decoded = await getAdminAuth().verifySessionCookie(
          session,
          false
        );
        if (decoded?.sub) {
          await getAdminAuth().revokeRefreshTokens(decoded.sub);
        }
      } catch {
        // Ignore expired or already invalid session cookie during logout
      }
    }
  } catch (err) {
    console.error("Error revoking session on logout:", err);
  }

  const response = NextResponse.json({ status: "success" }, { status: 200 });

  // Clear the session cookie
  response.cookies.set("session", "", {
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
  });

  return response;
}
