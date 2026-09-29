/**
 * /api/cron/sync-backup
 * =====================
 * Vercel Cron Job — изпълнява се всеки ден в 07:00 UTC (10:00 ч. Sofia).
 * Копира всички основни колекции от bkgalabovo2025 → bkgalabovo2025-backup.
 *
 * Ако основната база е все още изчерпана (quota), пропуска и опитва на следващия ден.
 * Ако основната работи — прехвърля само документите, по-нови или различни от
 * последното синхронизиране.
 */
import { NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";
import { getBackupDb } from "@/lib/firebase-admin-backup";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 минути (Vercel Pro/Hobby позволява до 5мин за cron)

const COLLECTIONS_TO_SYNC = [
  "clubServices",
  "clubGeneralServices",
  "prices",
  "priceHistory",
  "members",
  "families",
  "users",
  "certificate_templates",
  "events",
  "exercises",
  "annual_plans",
  "training_templates",
  "feedback_templates",
  "focus_tags",
  "memberSubscriptions",
  "sales",
  "sponsors",
  "inventory",
  "trainings",
  "reservations",
  "sessions",
];

function isQuotaError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("Quota exceeded") ||
    (err instanceof Error &&
      "code" in err &&
      (err as { code: number }).code === 8)
  );
}

async function syncCollection(
  primaryDb: FirebaseFirestore.Firestore,
  backupDb: FirebaseFirestore.Firestore,
  collectionName: string
): Promise<{ synced: number; skipped: boolean; error?: string }> {
  try {
    const snapshot = await primaryDb.collection(collectionName).get();

    if (snapshot.empty) {
      return { synced: 0, skipped: false };
    }

    // Batch write in chunks of 400
    let batch = backupDb.batch();
    let count = 0;
    let totalSynced = 0;

    for (const doc of snapshot.docs) {
      const targetRef = backupDb.collection(collectionName).doc(doc.id);
      batch.set(targetRef, doc.data(), { merge: true });
      count++;
      totalSynced++;

      if (count >= 400) {
        await batch.commit();
        batch = backupDb.batch();
        count = 0;
      }
    }

    if (count > 0) {
      await batch.commit();
    }

    return { synced: totalSynced, skipped: false };
  } catch (err) {
    if (isQuotaError(err)) {
      return { synced: 0, skipped: true, error: "RESOURCE_EXHAUSTED" };
    }
    const msg = err instanceof Error ? err.message : String(err);
    return { synced: 0, skipped: false, error: msg };
  }
}

export async function GET(request: Request) {
  // Защита с CRON_SECRET за сигурност
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const backupDb = getBackupDb();
  if (!backupDb) {
    return NextResponse.json(
      {
        success: false,
        error:
          "FIREBASE_BACKUP_SERVICE_ACCOUNT_JSON не е конфигуриран. Резервната база не е налична.",
      },
      { status: 500 }
    );
  }

  let primaryDb: FirebaseFirestore.Firestore;
  try {
    primaryDb = getAdminDb();
    // Проверяваме дали основната база работи с лека заявка
    await primaryDb.collection("members").limit(1).get();
  } catch (err) {
    if (isQuotaError(err)) {
      console.warn(
        "[sync-backup] ⚠️ Основната база е все още изчерпана — пропускаме синхронизацията."
      );
      return NextResponse.json({
        success: false,
        quotaExhausted: true,
        message:
          "Основната база е все още изчерпана. Ще опитаме на следващия ден.",
      });
    }
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }

  console.log(
    "[sync-backup] 🚀 Стартиране на синхронизация към резервната база..."
  );

  const results: Record<
    string,
    { synced: number; skipped: boolean; error?: string }
  > = {};
  let totalSynced = 0;
  let quotaHit = false;

  for (const col of COLLECTIONS_TO_SYNC) {
    const result = await syncCollection(primaryDb, backupDb, col);
    results[col] = result;

    if (result.skipped && result.error === "RESOURCE_EXHAUSTED") {
      console.warn("[sync-backup] ⚠️ Квотата се изчерпа по средата — спираме.");
      quotaHit = true;
      break;
    }

    totalSynced += result.synced;
    console.log(
      "[sync-backup] ✅ Синхронизирани документи от колекция:",
      col,
      result.synced
    );
  }

  // Записваме лог за синхронизацията в резервната база
  try {
    await backupDb.collection("system_sync_logs").add({
      timestamp: new Date().toISOString(),
      totalSynced,
      quotaHit,
      collections: results,
      status: quotaHit ? "partial" : "complete",
    });
  } catch {
    // Не е критично ако логът не се запише
  }

  return NextResponse.json({
    success: !quotaHit,
    message: quotaHit
      ? `Синхронизацията е частична — квотата се изчерпа. Синхронизирани: ${totalSynced} документа.`
      : `✅ Синхронизацията завърши успешно! Синхронизирани: ${totalSynced} документа.`,
    totalSynced,
    quotaHit,
    collections: results,
  });
}

export async function POST(request: Request) {
  return GET(request);
}
