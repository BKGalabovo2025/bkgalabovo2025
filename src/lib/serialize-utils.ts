/**
 * Recursively converts Firestore Timestamps to ISO strings in an object.
 * This is necessary because Next.js Server Components cannot pass non-serializable
 * objects (like Firestore Timestamps) to Client Components.
 */
export function serializeFirestoreData(data: any): any {
  if (data === null || data === undefined) return data;

  // Handle Firestore Timestamp (Admin SDK version)
  // Check for toDate method or the specific _seconds/_nanoseconds structure
  if (typeof data.toDate === "function") {
    return data.toDate().toISOString();
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
  if (typeof data === "object" && data.constructor === Object) {
    const serialized: any = {};
    for (const key in data) {
      serialized[key] = serializeFirestoreData(data[key]);
    }
    return serialized;
  }

  return data;
}
