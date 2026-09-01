import crypto from "crypto";

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

export type LogSeverity =
  "INFO" | "WARNING" | "ERROR" | "CRITICAL" | "SECURITY_AUDIT";

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
  correlationId?: string;
  severity?: LogSeverity;
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
  correlationId?: string;
  severity?: LogSeverity;
}

/**
 * Format a structured JSON log payload for Cloud Logging ingestion
 */
export function formatStructuredLog(payload: AuditLog): string {
  return JSON.stringify({
    "logging.googleapis.com/labels": {
      service: "bkgalabovo-core",
      siteId: payload.siteId || "global",
      action: payload.action,
    },
    severity: payload.severity || "INFO",
    message: `[${payload.action.toUpperCase()}] ${payload.details} (User: ${payload.userEmail})`,
    timestamp: payload.timestamp,
    correlationId: payload.correlationId,
    auditPayload: {
      userId: payload.userId,
      userEmail: payload.userEmail,
      targetCollection: payload.targetCollection,
      targetId: payload.targetId,
      metadata: payload.metadata,
    },
  });
}

export async function logAuditEvent(entry: AuditEventInput): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    const correlationId = entry.correlationId || crypto.randomUUID();
    const severity: LogSeverity = entry.severity || "INFO";

    const logData: AuditLog = {
      action: entry.action,
      details: entry.details,
      userId: entry.userId || "system",
      userEmail: entry.userEmail || "system@bkgalabovo.bg",
      timestamp,
      correlationId,
      severity,
    };

    if (entry.targetCollection)
      logData.targetCollection = entry.targetCollection;
    if (entry.targetId) logData.targetId = entry.targetId;
    if (entry.siteId) logData.siteId = entry.siteId;
    if (entry.metadata) logData.metadata = entry.metadata;

    // 1. Emit structured JSON for Cloud Logging / Observability
    console.log(formatStructuredLog(logData));

    // 2. Persist to Firestore audit_logs collection
    const db = getAdminDb();
    await db.collection("audit_logs").add(logData);
  } catch (error) {
    console.error("Failed to write audit log:", error);
    // Intentionally do not throw to prevent breaking primary business logic
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
