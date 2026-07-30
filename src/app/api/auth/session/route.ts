import { NextRequest, NextResponse } from "next/server";

import { getAdminAuth } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: "No ID token provided" },
        { status: 400 }
      );
    }

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
