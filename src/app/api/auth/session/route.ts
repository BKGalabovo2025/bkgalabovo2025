import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAdminAuth } from "@/lib/firebase-admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const SessionSchema = z.object({
  idToken: z.string().min(10).max(4096),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rate = await checkRateLimit(`auth-session:${ip}`, 20, 60_000);
    if (!rate.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    const parsed = SessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "No valid ID token provided" },
        { status: 400 }
      );
    }
    const { idToken } = parsed.data;

    // Set session expiration to 5 days
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const adminAuth = getAdminAuth();

    // Verify the token first
    await adminAuth.verifyIdToken(idToken);

    // Create the session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    const response = NextResponse.json({ status: "success" }, { status: 200 });

    // Set the cookie securely
    response.cookies.set("session", sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Session creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
