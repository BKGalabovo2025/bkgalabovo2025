/**
 * serialize-utils.ts
 * ==================
 * Recursively converts Firestore Timestamps, Dates, and non-plain objects
 * to JSON-serializable primitives and plain objects.
 * This is necessary because Next.js Server Components / Actions cannot pass non-serializable
 * objects (like Firestore Timestamps or class instances) to Client Components.
 */

export function serializeFirestoreData<T>(data: T): T {
  if (data === null || data === undefined) return data as T;

  // Handle Firestore Timestamp (Admin SDK or serialized object)
  if (typeof data === "object" && data !== null) {
    if (
      "toDate" in data &&
      typeof (data as { toDate: () => Date }).toDate === "function"
    ) {
      return (data as { toDate: () => Date })
        .toDate()
        .toISOString() as unknown as T;
    }
    if (
      "_seconds" in data &&
      typeof (data as { _seconds: unknown })._seconds === "number"
    ) {
      const sec = (data as { _seconds: number })._seconds;
      return new Date(sec * 1000).toISOString() as unknown as T;
    }
  }

  // Handle standard Date objects
  if (data instanceof Date) {
    return data.toISOString() as unknown as T;
  }

  // Handle Arrays
  if (Array.isArray(data)) {
    return data.map((item) => serializeFirestoreData(item)) as unknown as T;
  }

  // Handle Objects (plain objects and class instances)
  if (typeof data === "object" && data !== null) {
    const serialized: Record<string, unknown> = {};
    const obj = data as Record<string, unknown>;
    for (const key of Object.keys(obj)) {
      serialized[key] = serializeFirestoreData(obj[key]);
    }
    return serialized as T;
  }

  return data as T;
}

/**
 * Normalizes dateOfBirth or any date representation to a clean string "YYYY-MM-DD" or empty string.
 */
export function formatDobString(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") {
    return val.includes("T") ? val.split("T")[0] : val.trim();
  }
  if (typeof val === "object" && val !== null) {
    if (
      "toDate" in val &&
      typeof (val as { toDate: () => Date }).toDate === "function"
    ) {
      return (val as { toDate: () => Date })
        .toDate()
        .toISOString()
        .split("T")[0];
    }
    if (
      "_seconds" in val &&
      typeof (val as { _seconds: unknown })._seconds === "number"
    ) {
      const sec = (val as { _seconds: number })._seconds;
      return new Date(sec * 1000).toISOString().split("T")[0];
    }
  }
  if (val instanceof Date) {
    return val.toISOString().split("T")[0];
  }
  return String(val);
}
