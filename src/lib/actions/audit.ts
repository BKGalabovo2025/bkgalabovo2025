"use server";
import "server-only";

import { AuditAction, AuditLog, logSystemEvent } from "@/lib/audit-logger";
import { ensureAdminFromSession } from "@/lib/auth-utils";
import { getAdminDb } from "@/lib/firebase-admin";

export async function getAuditLogsAction(
  limitCount: number = 50
): Promise<AuditLog[]> {
  try {
    await ensureAdminFromSession();
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

export async function logAuditAction(
  action: AuditAction,
  details: string,
  userEmail: string
): Promise<void> {
  const adminUser = await ensureAdminFromSession();
  await logSystemEvent(
    action,
    details,
    userEmail === "system" ? "system" : "user",
    adminUser.email || userEmail
  );
}
