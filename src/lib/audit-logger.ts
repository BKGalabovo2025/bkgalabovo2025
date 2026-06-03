import { getAdminDb } from "./firebase-admin";

export type AuditAction =
  | "login"
  | "export_financial_report"
  | "export_attendance_report"
  | "export_liabilities_report"
  | "update_settings"
  | "create_member"
  | "delete_member";

export interface AuditLog {
  id?: string;
  action: AuditAction;
  details: string;
  userId: string;
  userEmail: string;
  timestamp: string; // ISO string
}

export async function logSystemEvent(
  action: AuditAction,
  details: string,
  userId: string = "system",
  userEmail: string = "system@bkgalabovo.bg"
): Promise<void> {
  try {
    const db = getAdminDb();
    const logData = {
      action,
      details,
      userId,
      userEmail,
      timestamp: new Date().toISOString(),
    };

    await db.collection("audit_logs").add(logData);
  } catch (error) {
    console.error("Failed to write audit log:", error);
    // We intentionally don't throw to prevent breaking the main flow if logging fails
  }
}
