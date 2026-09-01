import { getAdminDb } from "./firebase-admin";

export type AuditAction =
  | "login"
  | "create_member"
  | "update_member"
  | "delete_member"
  | "role_change"
  | "toggle_member_status"
  | "create_sale"
  | "delete_sale"
  | "cancel_sale"
  | "create_price"
  | "update_price"
  | "delete_price"
  | "update_settings"
  | "export_financial_report"
  | "export_attendance_report"
  | "export_liabilities_report"
  | "mass_marketing_send"
  | "clear_marketing_history"
  | "sign_declaration";

export interface AuditLog {
  id?: string;
  action: AuditAction;
  details: string;
  targetCollection?: string;
  targetId?: string;
  siteId?: string;
  metadata?: Record<string, unknown>;
  userId: string;
  userEmail: string;
  timestamp: string; // ISO string
}

export interface AuditEventInput {
  action: AuditAction;
  details: string;
  targetCollection?: string;
  targetId?: string;
  siteId?: string;
  metadata?: Record<string, unknown>;
  userId?: string;
  userEmail?: string;
}

export async function logAuditEvent(entry: AuditEventInput): Promise<void> {
  try {
    const db = getAdminDb();
    const logData: Record<string, unknown> = {
      action: entry.action,
      details: entry.details,
      userId: entry.userId || "system",
      userEmail: entry.userEmail || "system@bkgalabovo.bg",
      timestamp: new Date().toISOString(),
    };

    if (entry.targetCollection)
      logData.targetCollection = entry.targetCollection;
    if (entry.targetId) logData.targetId = entry.targetId;
    if (entry.siteId) logData.siteId = entry.siteId;
    if (entry.metadata) logData.metadata = entry.metadata;

    await db.collection("audit_logs").add(logData);
  } catch (error) {
    console.error("Failed to write audit log:", error);
    // We intentionally don't throw to prevent breaking the main flow if logging fails
  }
}

export async function logSystemEvent(
  action: AuditAction,
  details: string,
  userId: string = "system",
  userEmail: string = "system@bkgalabovo.bg"
): Promise<void> {
  return logAuditEvent({ action, details, userId, userEmail });
}
