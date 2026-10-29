/**
 * Utility functions for normalizing, comparing, and formatting Bulgarian phone numbers.
 */

/**
 * Normalizes any Bulgarian phone number string into a canonical 10-digit format (e.g. "0888123456").
 * Strips all non-digit characters, converts +359 or 00359 prefixes to leading 0,
 * and handles missing leading 0 for 9-digit mobile inputs.
 */
export function normalizePhoneNumber(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") {
    return "";
  }

  // Remove whitespace, dashes, parentheses, dots, slashes
  let cleaned = raw.trim().replace(/[\s\-\(\)\.\/\\]+/g, "");

  // Convert international prefixes
  if (cleaned.startsWith("+359")) {
    cleaned = "0" + cleaned.slice(4);
  } else if (cleaned.startsWith("00359")) {
    cleaned = "0" + cleaned.slice(5);
  }

  // Remove any remaining non-digit characters
  cleaned = cleaned.replace(/\D/g, "");

  // If 9 digits starting with 8 or 9 (e.g. 888123456), prepend 0
  if (
    cleaned.length === 9 &&
    (cleaned.startsWith("8") || cleaned.startsWith("9"))
  ) {
    cleaned = "0" + cleaned;
  }

  return cleaned;
}

/**
 * Compares two phone numbers for equality after normalization.
 */
export function arePhoneNumbersEqual(
  phoneA: string | null | undefined,
  phoneB: string | null | undefined
): boolean {
  const normA = normalizePhoneNumber(phoneA);
  const normB = normalizePhoneNumber(phoneB);
  if (!normA || !normB) return false;
  return normA === normB;
}

/**
 * Formats a canonical 10-digit phone number for display (e.g. "0888 123 456").
 */
export function formatPhoneDisplay(raw: string | null | undefined): string {
  const norm = normalizePhoneNumber(raw);
  if (norm.length === 10) {
    return `${norm.slice(0, 4)} ${norm.slice(4, 7)} ${norm.slice(7)}`;
  }
  return raw?.trim() || "";
}
