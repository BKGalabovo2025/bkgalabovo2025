import { addDoc, collection } from "firebase/firestore";

import { getSiteConfig } from "@/config/sites";
import { db } from "@/lib/firebase";

export interface AuditLogEntry {
  userId: string;
  userEmail?: string;
  action:
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "ROLE_CHANGE"
    | "PAYMENT_OVERRIDE"
    | "EXPORT_DATA";
  targetCollection: string;
  targetId: string;
  details?: Record<string, unknown> | string;
  siteId?: string;
  timestamp?: string;
}

export const auditService = {
  /**
   * Записва критично администраторско действие в колекция `audit_logs` във Firestore.
   */
  async logAdminAction(entry: AuditLogEntry): Promise<void> {
    try {
      const siteId = entry.siteId || getSiteConfig().id;
      const logsRef = collection(db, "audit_logs");
      await addDoc(logsRef, {
        userId: entry.userId,
        userEmail: entry.userEmail || "unknown",
        action: entry.action,
        targetCollection: entry.targetCollection,
        targetId: entry.targetId,
        details: entry.details || {},
        siteId,
        timestamp: entry.timestamp || new Date().toISOString(),
      });
    } catch (error) {
      console.error("[AuditService] Failed to record audit log:", error);
    }
  },
};
