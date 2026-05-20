import { NextResponse } from "next/server";

export async function POST() {
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
