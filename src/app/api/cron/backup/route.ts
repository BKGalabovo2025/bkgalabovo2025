import { NextResponse } from "next/server";

import { getSiteConfig } from "@/config/sites";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const BACKUP_COLLECTIONS = [
  "members",
  "events",
  "tournaments",
  "tournament_matches",
  "sales",
  "prices",
  "club_services",
  "feedback",
  "assessments",
  "beep_tests",
  "audit_logs",
] as const;

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

    const { ensureAdminFromSession } = await import("@/lib/auth-utils");
    await ensureAdminFromSession();
    return true;
  } catch {
    return false;
  }
}

export async function executeBackup(siteId = getSiteConfig().id) {
  const adminDb = getAdminDb();
  const now = new Date();
  const backupId = `backup_${siteId}_${now.toISOString().replace(/[:.]/g, "-")}`;
  const sofiaTime = now.toLocaleString("bg-BG", { timeZone: "Europe/Sofia" });

  const stats: Record<string, number> = {};
  const collectionsData: Record<string, unknown[]> = {};

  // 1. Export main collections
  for (const colName of BACKUP_COLLECTIONS) {
    try {
      const snapshot = await adminDb
        .collection(colName)
        .where("siteId", "==", siteId)
        .get();

      const docs = snapshot.docs.map((doc) => ({
        _id: doc.id,
        ...doc.data(),
      }));

      stats[colName] = docs.length;
      collectionsData[colName] = docs;
    } catch {
      // Fallback without siteId filter if collection is not partitioned
      try {
        const fallbackSnap = await adminDb.collection(colName).get();
        const docs = fallbackSnap.docs.map((doc) => ({
          _id: doc.id,
          ...doc.data(),
        }));
        stats[colName] = docs.length;
        collectionsData[colName] = docs;
      } catch (err) {
        console.error(`Error backing up collection ${colName}:`, err);
        stats[colName] = 0;
        collectionsData[colName] = [];
      }
    }
  }

  // 2. Export uploaded_files metadata
  try {
    const filesSnap = await adminDb
      .collection("sites")
      .doc(siteId)
      .collection("uploaded_files")
      .get();

    const fileDocs = filesSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        _id: doc.id,
        id: d.id,
        name: d.name,
        contentType: d.contentType,
        size: d.size,
        path: d.path,
        createdAt: d.createdAt,
      };
    });
    stats.uploaded_files = fileDocs.length;
    collectionsData.uploaded_files = fileDocs;
  } catch (err) {
    console.error("Error backing up uploaded_files:", err);
    stats.uploaded_files = 0;
    collectionsData.uploaded_files = [];
  }

  // 3. Save backup metadata
  const backupRef = adminDb.collection("system_backups").doc(backupId);
  await backupRef.set({
    backupId,
    siteId,
    timestamp: now.toISOString(),
    sofiaTime,
    stats,
    createdAt: now.toISOString(),
  });

  // 4. Save collections segmented to avoid Firestore 1MB document limit
  for (const [colName, docs] of Object.entries(collectionsData)) {
    if (docs.length === 0) continue;
    await backupRef.collection("collections").doc(colName).set({
      count: docs.length,
      data: docs,
      updatedAt: now.toISOString(),
    });
  }

  return {
    success: true,
    backupId,
    timestamp: now.toISOString(),
    sofiaTime,
    stats,
    totalRecords: Object.values(stats).reduce((acc, c) => acc + c, 0),
  };
}

export async function GET(request: Request) {
  const isAuthorized = await checkAuth(request);
  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await executeBackup();
    return NextResponse.json({
      message: "Автоматичният бекъп завърши успешно.",
      ...result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Backup Cron Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
