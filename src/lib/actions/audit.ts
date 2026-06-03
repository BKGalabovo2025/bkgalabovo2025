"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { AuditLog } from "@/lib/audit-logger";

export async function getAuditLogsAction(
  limitCount: number = 50
): Promise<AuditLog[]> {
  try {
    const db = getAdminDb();
    const snap = await db
      .collection("audit_logs")
      .orderBy("timestamp", "desc")
      .limit(limitCount)
      .get();

    return snap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<AuditLog, "id">),
    }));
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return [];
  }
}
