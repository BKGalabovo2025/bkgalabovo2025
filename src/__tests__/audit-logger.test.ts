import { describe, expect, it } from "vitest";

import { AuditLog, formatStructuredLog } from "../lib/audit-logger";

describe("Production Observability: Structured Audit Logger", () => {
  it("should format structured JSON log with Cloud Logging metadata and labels", () => {
    const payload: AuditLog = {
      action: "create_sale",
      details: "Created sale #1234 for 150 BGN",
      userId: "user_abc",
      userEmail: "coach@bkgalabovo.com",
      siteId: "bkgalabovo",
      timestamp: "2026-09-01T10:00:00.000Z",
      correlationId: "req-xyz-789",
      severity: "INFO",
      targetCollection: "sales",
      targetId: "sale_1234",
      metadata: { totalAmount: 150, currency: "BGN" },
    };

    const formatted = formatStructuredLog(payload);
    const parsed = JSON.parse(formatted);

    expect(parsed["logging.googleapis.com/labels"].service).toBe(
      "bkgalabovo-core"
    );
    expect(parsed["logging.googleapis.com/labels"].siteId).toBe("bkgalabovo");
    expect(parsed["logging.googleapis.com/labels"].action).toBe("create_sale");
    expect(parsed.severity).toBe("INFO");
    expect(parsed.correlationId).toBe("req-xyz-789");
    expect(parsed.auditPayload.userId).toBe("user_abc");
    expect(parsed.auditPayload.metadata.totalAmount).toBe(150);
  });

  it("should fallback to 'global' siteId and default INFO severity when optional fields omitted", () => {
    const payload: AuditLog = {
      action: "login",
      details: "User logged in",
      userId: "user_1",
      userEmail: "admin@bkgalabovo.com",
      timestamp: "2026-09-01T10:00:00.000Z",
    };

    const formatted = formatStructuredLog(payload);
    const parsed = JSON.parse(formatted);

    expect(parsed["logging.googleapis.com/labels"].siteId).toBe("global");
    expect(parsed.severity).toBe("INFO");
  });
});
