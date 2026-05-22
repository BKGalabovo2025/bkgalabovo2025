import * as admin from "firebase-admin";
import { getAdminDb } from "@/lib/firebase-admin";
import { Sale } from "@/types";
import { serverCache } from "@/lib/server-cache";

function snapToData<T>(
  doc: admin.firestore.DocumentSnapshot | admin.firestore.QueryDocumentSnapshot
): T | null {
  if (!doc.exists) return null;
  const data = doc.data();
  if (!data) return null;

  const convertTimestamps = (val: any): any => {
    if (!val) return val;
    if (typeof val.toDate === "function") {
      return val.toDate().toISOString();
    }
    if (val instanceof admin.firestore.Timestamp) {
      return val.toDate().toISOString();
    }
    if (Array.isArray(val)) {
      return val.map(convertTimestamps);
    }
    if (typeof val === "object") {
      const copy: any = {};
      for (const key of Object.keys(val)) {
        copy[key] = convertTimestamps(val[key]);
      }
      return copy;
    }
    return val;
  };

  return {
    id: doc.id,
    ...convertTimestamps(data),
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
        .filter((sale): sale is Sale => sale !== null)
        .sort(
          (a, b) =>
            new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
        );
    },
    30000 // 30 seconds TTL
  );
}
