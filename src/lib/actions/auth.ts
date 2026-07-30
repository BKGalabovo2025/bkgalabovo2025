"use server";
import "server-only";

import { cookies } from "next/headers";

import { getAdminAuth } from "@/lib/firebase-admin";

export async function loginAction(email: string, password: string) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      return { success: false, error: "Firebase API Key липсва на сървъра." };
    }

    // Call Firebase Auth REST API to sign in the user
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          returnSecureToken: true,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Firebase Auth REST API error:", data);
      const errorMsg = data?.error?.message;
      let userFriendlyMessage = "Неуспешен вход. Моля, опитайте отново.";

      if (
        errorMsg === "EMAIL_NOT_FOUND" ||
        errorMsg === "INVALID_PASSWORD" ||
        errorMsg === "INVALID_LOGIN_CREDENTIALS" ||
        errorMsg === "INVALID_CREDENTIAL"
      ) {
        userFriendlyMessage = "Грешен имейл или парола.";
      } else if (errorMsg === "USER_DISABLED") {
        userFriendlyMessage = "Този профил е деактивиран от администратор.";
      } else if (errorMsg === "TOO_MANY_ATTEMPTS_TRY_LATER") {
        userFriendlyMessage =
          "Твърде много неуспешни опити. Моля, опитайте по-късно.";
      }

      return { success: false, error: userFriendlyMessage };
    }

    const { idToken } = data;
    const adminAuth = getAdminAuth();

    // Verify token first
    await adminAuth.verifyIdToken(idToken);

    // Create session cookie with 5 days expiration
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    const cookieStore = await cookies();

    // Set cookie
    cookieStore.set("session", sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return { success: true };
  } catch (error) {
    console.error("loginAction error:", error);
    return {
      success: false,
      error: "Възникна системна грешка при вход. Моля, опитайте по-късно.",
    };
  }
}
