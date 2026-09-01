import pathPosix from "path/posix";
import { describe, expect, it } from "vitest";

function sanitizeAndValidateStoragePath(
  rawPath: string,
  allowedPrefixes: string[]
): { valid: boolean; normalizedPath: string } {
  if (!rawPath || typeof rawPath !== "string") {
    return { valid: false, normalizedPath: "" };
  }

  let decodedPath = rawPath;
  try {
    decodedPath = decodeURIComponent(rawPath);
    if (decodedPath.includes("%")) {
      decodedPath = decodeURIComponent(decodedPath);
    }
  } catch {
    return { valid: false, normalizedPath: "" };
  }

  const cleanPath = decodedPath.replace(/[\0\r\n]/g, "").replace(/\\/g, "/");
  const normalized = pathPosix.normalize(cleanPath).replace(/^\/+/, "");

  if (
    normalized.startsWith("..") ||
    normalized.includes("/../") ||
    normalized.endsWith("/..") ||
    normalized === ".."
  ) {
    return { valid: false, normalizedPath: "" };
  }

  const isAllowed = allowedPrefixes.some((prefix) => {
    const cleanPrefix = prefix.replace(/^\/+/, "");
    return normalized === cleanPrefix || normalized.startsWith(cleanPrefix);
  });

  return { valid: isAllowed, normalizedPath: normalized };
}

describe("Storage Security & Path Traversal Defense", () => {
  const allowedPrefixes = ["avatars/user_123/", "sites/bkgalabovo/"];

  it.each([
    [
      "avatar path",
      "avatars/user_123/profile.png",
      "avatars/user_123/profile.png",
    ],
    [
      "site document path",
      "sites/bkgalabovo/docs/rules.pdf",
      "sites/bkgalabovo/docs/rules.pdf",
    ],
  ])("should allow valid %s", (_name, inputPath, expectedNormalized) => {
    const res = sanitizeAndValidateStoragePath(inputPath, allowedPrefixes);
    expect(res.valid).toBe(true);
    expect(res.normalizedPath).toBe(expectedNormalized);
  });

  it.each([
    ["standard directory traversal", "avatars/user_123/../../etc/passwd"],
    [
      "URL-encoded directory traversal",
      "avatars/user_123/%2e%2e%2fother_user/avatar.png",
    ],
    [
      "double URL-encoded directory traversal",
      "avatars/user_123/%252e%252e%252fsecret.key",
    ],
    ["windows backslash traversal", "avatars/user_123/..\\..\\config.json"],
    ["cross-tenant attempt", "sites/recoveryzone/financials.xlsx"],
  ])("should reject %s", (_attackName, attackPath) => {
    const res = sanitizeAndValidateStoragePath(attackPath, allowedPrefixes);
    expect(res.valid).toBe(false);
  });
});
