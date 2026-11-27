import * as admin from "firebase-admin";

import { getAdminDb } from "@/lib/firebase-admin";
import { serverCache } from "@/lib/server-cache";
import { Sale } from "@/types";

function convertTimestamps(val: unknown): unknown {
  if (!val) return val;
  if (
    typeof val === "object" &&
    "toDate" in val &&
    typeof (val as { toDate?: unknown }).toDate === "function"
  ) {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  if (val instanceof admin.firestore.Timestamp) {
    return val.toDate().toISOString();
  }
  if (Array.isArray(val)) {
    return val.map(convertTimestamps);
  }
  if (typeof val === "object") {
    const copy: Record<string, unknown> = {};
    for (const key of Object.keys(val as Record<string, unknown>)) {
      copy[key] = convertTimestamps((val as Record<string, unknown>)[key]);
    }
    return copy;
  }
  return val;
}

function snapToData<T>(
  doc: admin.firestore.DocumentSnapshot | admin.firestore.QueryDocumentSnapshot
): T | null {
  if (!doc.exists) return null;
  const data = doc.data();
  if (!data) return null;

  return {
    id: doc.id,
    ...(convertTimestamps(data) as Record<string, unknown>),
  } as T;
}

/**
 * Core query to fetch all sales filtered by active branch, leveraging server-side in-memory caching.
 */
export async function getCachedSalesForBranch(
  activeBranch: string
): Promise<Sale[]> {
  const adminDb = getAdminDb();
  let salesQuery: admin.firestore.Query = adminDb.collection("sales");

  if (activeBranch && activeBranch !== "bkgalabovo") {
    salesQuery = salesQuery.where("siteId", "==", activeBranch);
  }

  const cacheKey = `sales:${activeBranch || "all"}`;

  return serverCache.get<Sale[]>(
    cacheKey,
    async () => {
      const snapshot = await salesQuery.get();
      return snapshot.docs
        .map((doc) => snapToData<Sale>(doc))
        .filter((sale): sale is Sale => {
          if (!sale) return false;
          if (activeBranch === "bkgalabovo" && sale.siteId === "recoveryzone") {
            return false;
          }
          return true;
        })
        .sort(
          (a, b) =>
            new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
        );
    },
    30000 // 30 seconds TTL
  );
}
