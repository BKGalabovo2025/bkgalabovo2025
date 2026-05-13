import { getAdminAuth } from "@/lib/firebase-admin";

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
