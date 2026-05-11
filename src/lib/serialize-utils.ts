/**
 * Recursively converts Firestore Timestamps to ISO strings in an object.
 * This is necessary because Next.js Server Components cannot pass non-serializable
 * objects (like Firestore Timestamps) to Client Components.
 */
export function serializeFirestoreData(data: unknown): unknown {
  if (data === null || data === undefined) return data;

  // Handle Firestore Timestamp (Admin SDK version)
  if (
    typeof data === "object" &&
    data !== null &&
    "toDate" in data &&
    typeof (data as { toDate: () => Date }).toDate === "function"
  ) {
    return (data as { toDate: () => Date }).toDate().toISOString();
  }

  // Handle standard Date objects
  if (data instanceof Date) {
    return data.toISOString();
  }

  // Handle Arrays
  if (Array.isArray(data)) {
    return data.map(serializeFirestoreData);
  }

  // Handle Objects
  if (
    typeof data === "object" &&
    data !== null &&
    data.constructor === Object
  ) {
    const serialized: Record<string, unknown> = {};
    const obj = data as Record<string, unknown>;
    for (const key in obj) {
      serialized[key] = serializeFirestoreData(obj[key]);
    }
    return serialized;
  }

  return data;
}
