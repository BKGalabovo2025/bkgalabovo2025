"use server";
import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";

export interface ErrorLogDetails {
  message: string;
  stack?: string;
  context?: string;
  path?: string;
}

export async function logSystemError(details: ErrorLogDetails) {
  try {
    const db = getAdminDb();

    const errorDocument = {
      ...details,
      timestamp: new Date().toISOString(),
      resolved: false,
    };

    // Запис единствено във Firestore за предотвратяване на SMTP mail flood / quota DoS (SEC-11)
    await db.collection("system_errors").add(errorDocument);
  } catch (err) {
    // Ако самият логър се счупи (напр. базата падне), го принтираме в конзолата
    console.error("КРИТИЧНО: Неуспешен опит за запис на системна грешка:", err);
  }
}
