"use server";
import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";

export interface ErrorLogDetails {
  message: string;
  stack?: string;
  context?: string;
  path?: string;
  severity?: "warning" | "error" | "critical";
  meta?: Record<string, unknown>;
}

/**
 * Persists critical application errors to Firestore `system_errors`, emits
 * structured JSON logs for Vercel/APM ingestion, and optionally notifies an
 * external webhook (Slack/Discord/PagerDuty) if `ERROR_ALERT_WEBHOOK_URL` is configured.
 */
export async function logSystemError(details: ErrorLogDetails) {
  const severity = details.severity || "error";
  const timestamp = new Date().toISOString();

  logger.error(details.message, details.context || "system", undefined, {
    path: details.path,
    severity,
    ...details.meta,
  });

  try {
    const db = getAdminDb();

    const errorDocument = {
      message: details.message.slice(0, 2000),
      stack: details.stack?.slice(0, 4000),
      context: details.context,
      path: details.path,
      severity,
      environment: process.env.NODE_ENV || "development",
      timestamp,
      resolved: false,
    };

    // Запис във Firestore за предотвратяване на SMTP mail flood / quota DoS (SEC-11)
    await db.collection("system_errors").add(errorDocument);

    const webhookUrl = process.env.ERROR_ALERT_WEBHOOK_URL;
    if (webhookUrl && severity === "critical") {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `[${severity.toUpperCase()}] ${details.context || "app"}: ${details.message.slice(0, 300)} (${details.path || "unknown"})`,
          timestamp,
        }),
      }).catch(() => undefined);
    }
  } catch (err) {
    logger.error(
      "Failed to persist system_errors record",
      "error-logging",
      err
    );
  }
}
