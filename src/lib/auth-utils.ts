import { getAdminAuth } from "@/lib/firebase-admin";
import { cookies } from "next/headers";

// removed top-level call to prevent module evaluation crashes

export async function getAuthUser(idToken: string) {
  try {
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error("Error verifying ID token detail:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
    throw new Error("Невалидна оторизация.");
  }
}

export async function ensureAdmin(idToken: string) {
  const user = await getAuthUser(idToken);
  // Проверка за администраторски права чрез Custom Claims или конкретен имейл
  if (!user.admin && user.email !== "bkgalabovo2014@gmail.com") {
    throw new Error("Нямате администраторски права.");
  }
  return user;
}

export async function getAuthUserFromSessionCookie() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return null;

    const adminAuth = getAdminAuth();
    // Verify session cookie; checkRevoked = true ensures the cookie is still active
    const decodedToken = await adminAuth.verifySessionCookie(session, true);
    return decodedToken;
  } catch (error) {
    console.error("Error verifying session cookie:", error);
    return null;
  }
}

export async function ensureAdminFromSession() {
  const user = await getAuthUserFromSessionCookie();
  if (!user) {
    throw new Error("Невалидна сесия. Моля, влезте отново.");
  }
  if (!user.admin && user.email !== "bkgalabovo2014@gmail.com") {
    throw new Error("Нямате администраторски права.");
  }
  return user;
}
