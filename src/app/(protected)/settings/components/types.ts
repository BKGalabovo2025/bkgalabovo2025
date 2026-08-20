import { AuditLog } from "@/lib/audit-logger";

export interface AuditLogTabProps {
  auditLogs: AuditLog[];
  fetchLogs: () => void;
  loadingLogs: boolean;
}
