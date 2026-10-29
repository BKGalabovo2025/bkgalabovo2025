import "server-only";

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { createHmac } from "node:crypto";

import { cookies } from "next/headers";

const PARENT_SESSION_COOKIE_NAME = "parent_session";
const SECRET_KEY =
  process.env.AUTH_SECRET ||
  process.env.JWT_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "bkgalabovo-parent-portal-secure-key-2026";

/**
 * Hashes a plaintext password using crypto scrypt with a unique random salt.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verifies a plaintext password against a stored "salt:derivedKey" hash.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKeyBuffer = scryptSync(password, salt, 64);
    return timingSafeEqual(keyBuffer, derivedKeyBuffer);
  } catch {
    return false;
  }
}

export interface ParentSessionPayload {
  parentId: string;
  email: string;
  phone: string;
  exp: number; // Unix timestamp in seconds
}

/**
 * Signs a parent session payload using HMAC-SHA256.
 */
export function signParentToken(
  payload: Omit<ParentSessionPayload, "exp">,
  expiresInSeconds: number = 60 * 60 * 24 * 30 // 30 days default
): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload: ParentSessionPayload = { ...payload, exp };
  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString(
    "base64url"
  );
  const signature = createHmac("sha256", SECRET_KEY)
    .update(encodedPayload)
    .digest("base64url");
  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies and decodes an HMAC-signed parent token.
 */
export function verifyParentToken(token: string): ParentSessionPayload | null {
  try {
    const [encodedPayload, signature] = token.split(".");
    if (!encodedPayload || !signature) return null;

    const expectedSignature = createHmac("sha256", SECRET_KEY)
      .update(encodedPayload)
      .digest("base64url");

    if (
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    ) {
      return null;
    }

    const payload: ParentSessionPayload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf-8")
    );

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Sets the parent_session HTTP-only cookie.
 */
export async function setParentSessionCookie(
  token: string,
  rememberMe: boolean = true
): Promise<void> {
  const maxAge = rememberMe ? 60 * 60 * 24 * 30 : undefined; // 30 days or session
  const cookieStore = await cookies();
  cookieStore.set(PARENT_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

/**
 * Retrieves and validates the current parent session from cookies.
 */
export async function getParentSession(): Promise<ParentSessionPayload | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(PARENT_SESSION_COOKIE_NAME);
  if (!sessionCookie?.value) {
    return null;
  }
  return verifyParentToken(sessionCookie.value);
}

/**
 * Clears the parent_session cookie.
 */
export async function clearParentSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PARENT_SESSION_COOKIE_NAME);
}

/**
 * Generates a short-lived password reset token (valid for 1 hour).
 */
export function generatePasswordResetToken(parentId: string): string {
  const exp = Math.floor(Date.now() / 1000) + 3600; // 1 hour
  const payload = JSON.stringify({ parentId, type: "password_reset", exp });
  const encoded = Buffer.from(payload).toString("base64url");
  const signature = createHmac("sha256", SECRET_KEY)
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

/**
 * Validates a password reset token and returns the parentId.
 */
export function verifyPasswordResetToken(token: string): string | null {
  try {
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) return null;

    const expectedSignature = createHmac("sha256", SECRET_KEY)
      .update(encoded)
      .digest("base64url");

    if (
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    ) {
      return null;
    }

    const data = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf-8")
    );
    if (data.type !== "password_reset") return null;

    const now = Math.floor(Date.now() / 1000);
    if (data.exp && data.exp < now) return null;

    return data.parentId || null;
  } catch {
    return null;
  }
}
