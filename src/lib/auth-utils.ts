import { getAuth } from "firebase-admin/auth";

// removed top-level call to prevent module evaluation crashes

export async function getAuthUser(idToken: string) {
  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error("Error verifying ID token:", error);
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
