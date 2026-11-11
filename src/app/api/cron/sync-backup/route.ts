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
  "sites",
  "clubServices",
  "clubGeneralServices",
  "prices",
  "priceHistory",
  "members",
  "families",
  "users",
  "parent_users",
  "parent_requests",
  "parent_absences",
  "parent_corrections",
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
  "training_attendance",
  "reservations",
  "blockedSlots",
  "sessions",
  "tournaments",
  "tournament_entries",
  "tournament_matches",
  "business_trips",
  "trip_expenses",
  "trip_signing_tokens",
  "document_requests",
  "document_templates",
  "feedback_submissions",
  "feedback_campaigns",
  "quizzes",
  "theory_results",
  "beep_test_results",
  "member_assessments",
  "member_declarations",
  "inquiries",
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

function getDocTime(data: FirebaseFirestore.DocumentData | undefined): number {
  if (!data) return 0;
  const val =
    data.updatedAt ||
    data.updated_at ||
    data.createdAt ||
    data.created_at ||
    data.timestamp ||
    data.date;
  if (!val) return 0;
  if (
    typeof val === "object" &&
    typeof (val as { toMillis?: () => number }).toMillis === "function"
  ) {
    return (val as { toMillis: () => number }).toMillis();
  }
  if (
    typeof val === "object" &&
    typeof (val as { _seconds?: number })._seconds === "number"
  ) {
    return (val as { _seconds: number })._seconds * 1000;
  }
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const parsed = Date.parse(val);
    return isNaN(parsed) ? 0 : parsed;
  }
  if (val instanceof Date) return val.getTime();
  return 0;
}

async function syncCollection(
  primaryDb: FirebaseFirestore.Firestore,
  backupDb: FirebaseFirestore.Firestore,
  collectionName: string,
  isFullSync: boolean = false
): Promise<{
  syncedToBackup: number;
  syncedToPrimary: number;
  synced: number;
  skipped: boolean;
  error?: string;
}> {
  try {
    // Quota Optimization: Count-check (costs 1 read per DB instead of reading hundreds/thousands of docs)
    // Since firestore-resilient-proxy dual-writes in real time, if counts match, skip full collection read!
    if (!isFullSync) {
      try {
        const [pCountSnap, bCountSnap] = await Promise.all([
          primaryDb.collection(collectionName).count().get(),
          backupDb.collection(collectionName).count().get(),
        ]);
        const pCount = pCountSnap.data().count;
        const bCount = bCountSnap.data().count;

        if (pCount === bCount) {
          return {
            syncedToBackup: 0,
            syncedToPrimary: 0,
            synced: 0,
            skipped: true,
          };
        }
      } catch {
        // Fall through to standard read if count fails
      }
    }

    const [primarySnap, backupSnap] = await Promise.all([
      primaryDb.collection(collectionName).get(),
      backupDb.collection(collectionName).get(),
    ]);

    const primaryDocs = new Map<string, FirebaseFirestore.DocumentData>();
    primarySnap.docs.forEach((doc) => primaryDocs.set(doc.id, doc.data()));

    const backupDocs = new Map<string, FirebaseFirestore.DocumentData>();
    backupSnap.docs.forEach((doc) => backupDocs.set(doc.id, doc.data()));

    const toWriteToBackup: Array<{
      id: string;
      data: FirebaseFirestore.DocumentData;
    }> = [];
    const toWriteToPrimary: Array<{
      id: string;
      data: FirebaseFirestore.DocumentData;
    }> = [];

    // 1. Check primary documents against backup
    for (const [id, pData] of primaryDocs.entries()) {
      if (!backupDocs.has(id)) {
        toWriteToBackup.push({ id, data: pData });
      } else {
        const bData = backupDocs.get(id);
        const pTime = getDocTime(pData);
        const bTime = getDocTime(bData);
        if (pTime > 0 && bTime > 0) {
          if (pTime > bTime) {
            toWriteToBackup.push({ id, data: pData });
          } else if (bTime > pTime) {
            toWriteToPrimary.push({ id, data: bData! });
          }
        }
      }
    }

    // 2. Check backup documents missing in primary
    for (const [id, bData] of backupDocs.entries()) {
      if (!primaryDocs.has(id)) {
        toWriteToPrimary.push({ id, data: bData });
      }
    }

    // 3. Batch commit to backup
    if (toWriteToBackup.length > 0) {
      let batch = backupDb.batch();
      let count = 0;
      for (const item of toWriteToBackup) {
        batch.set(backupDb.collection(collectionName).doc(item.id), item.data, {
          merge: true,
        });
        count++;
        if (count >= 400) {
          await batch.commit();
          batch = backupDb.batch();
          count = 0;
        }
      }
      if (count > 0) {
        await batch.commit();
      }
    }

    // 4. Batch commit to primary
    if (toWriteToPrimary.length > 0) {
      let batch = primaryDb.batch();
      let count = 0;
      for (const item of toWriteToPrimary) {
        batch.set(
          primaryDb.collection(collectionName).doc(item.id),
          item.data,
          { merge: true }
        );
        count++;
        if (count >= 400) {
          await batch.commit();
          batch = primaryDb.batch();
          count = 0;
        }
      }
      if (count > 0) {
        await batch.commit();
      }
    }

    const total = toWriteToBackup.length + toWriteToPrimary.length;
    return {
      syncedToBackup: toWriteToBackup.length,
      syncedToPrimary: toWriteToPrimary.length,
      synced: total,
      skipped: false,
    };
  } catch (err) {
    if (isQuotaError(err)) {
      return {
        syncedToBackup: 0,
        syncedToPrimary: 0,
        synced: 0,
        skipped: true,
        error: "RESOURCE_EXHAUSTED",
      };
    }
    const msg = err instanceof Error ? err.message : String(err);
    return {
      syncedToBackup: 0,
      syncedToPrimary: 0,
      synced: 0,
      skipped: false,
      error: msg,
    };
  }
}

async function checkAuth(request: Request): Promise<boolean> {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  try {
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split("Bearer ")[1]
      : null;

    if (token) {
      const { ensureAdmin } = await import("@/lib/auth-utils");
      await ensureAdmin(token);
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

export async function GET(request: Request) {
  const isAuthorized = await checkAuth(request);
  if (!isAuthorized) {
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

  const { searchParams } = new URL(request.url);
  const isFullSync =
    searchParams.get("full") === "true" || new Date().getDay() === 0; // Full sync on Sundays or via ?full=true

  console.log(
    `[sync-backup] 🚀 Стартиране на синхронизация (${isFullSync ? "ПЪЛНА / FULL" : "ЕКО ИНКРЕМЕНТАЛНА / SMART"}) към резервната база...`
  );

  const results: Record<
    string,
    {
      syncedToBackup: number;
      syncedToPrimary: number;
      synced: number;
      skipped: boolean;
      error?: string;
    }
  > = {};
  let totalSynced = 0;
  let quotaHit = false;

  // Автоматично динамично откриване на всички колекции в двете бази данни
  const discoveredCollections = new Set<string>(COLLECTIONS_TO_SYNC);
  try {
    const [pCols, bCols] = await Promise.all([
      primaryDb.listCollections().catch(() => []),
      backupDb.listCollections().catch(() => []),
    ]);
    pCols.forEach((c) => discoveredCollections.add(c.id));
    bCols.forEach((c) => discoveredCollections.add(c.id));
  } catch (err) {
    console.warn(
      "[sync-backup] ⚠️ listCollections fallback to baseline list:",
      err
    );
  }

  const EXCLUDED_FROM_SYNC = new Set(["system_sync_logs", "system_backups"]);
  const collectionsToProcess = Array.from(discoveredCollections).filter(
    (col) => !EXCLUDED_FROM_SYNC.has(col)
  );

  for (const col of collectionsToProcess) {
    const result = await syncCollection(primaryDb, backupDb, col, isFullSync);
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
