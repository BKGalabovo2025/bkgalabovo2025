import { getAuth } from "firebase-admin/auth";
import { initializeFirebaseAdmin } from "./firebase-admin";

initializeFirebaseAdmin();

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
  // Optional: check for specific admin claims if they exist
  // if (!user.admin) throw new Error("Нямате администраторски права.");
  return user;
}
