import { NextRequest, NextResponse } from "next/server";

import { getSiteConfig } from "@/config/sites";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const listOnly = searchParams.get("list") === "true";
  const requestedBackupId = searchParams.get("backupId");
  const siteId = searchParams.get("siteId") || getSiteConfig().id;

  const authHeader = request.headers.get("authorization");
  try {
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split("Bearer ")[1]
      : undefined;

    const { ensureAdminWithSite } = await import("@/lib/auth-utils");
    await ensureAdminWithSite(token, siteId);
  } catch (err) {
    console.error("Unauthorized backup download attempt:", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const adminDb = getAdminDb();

    // 1. If user just wants the history list of backups
    if (listOnly) {
      const snap = await adminDb
        .collection("system_backups")
        .where("siteId", "==", siteId)
        .orderBy("createdAt", "desc")
        .limit(20)
        .get();

      const backups = snap.docs.map((d) => d.data());
      return NextResponse.json({ success: true, backups });
    }

    // 2. Determine target backup ID
    let targetDocId = requestedBackupId;
    if (!targetDocId || targetDocId === "latest") {
      const latestSnap = await adminDb
        .collection("system_backups")
        .where("siteId", "==", siteId)
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();

      if (latestSnap.empty) {
        return NextResponse.json(
          { error: "Няма намерени резервни копия за този клуб." },
          { status: 404 }
        );
      }
      targetDocId = latestSnap.docs[0].id;
    }

    // 3. Fetch backup root metadata
    const backupDoc = await adminDb
      .collection("system_backups")
      .doc(targetDocId)
      .get();

    if (!backupDoc.exists) {
      return NextResponse.json(
        { error: "Архивът не беше намерен." },
        { status: 404 }
      );
    }

    const backupMeta = backupDoc.data();
    if (backupMeta?.siteId && backupMeta.siteId !== siteId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. Fetch all subcollections data
    const subCollectionsSnap = await adminDb
      .collection("system_backups")
      .doc(targetDocId)
      .collection("collections")
      .get();

    const collectionsData: Record<string, unknown[]> = {};
    const sortedDocs = [...subCollectionsSnap.docs].sort((a, b) => {
      const idxA = Number(a.data().chunkIndex ?? 0);
      const idxB = Number(b.data().chunkIndex ?? 0);
      return idxA - idxB;
    });
    for (const doc of sortedDocs) {
      const docData = doc.data();
      const targetCol =
        typeof docData.collection === "string"
          ? docData.collection
          : doc.id.replace(/__chunk_\d+$/, "");
      const items = Array.isArray(docData.data) ? docData.data : [];
      if (!collectionsData[targetCol]) {
        collectionsData[targetCol] = [];
      }
      collectionsData[targetCol].push(...items);
    }

    const fullPayload = {
      exportVersion: "1.0",
      system: "BK Galabovo Cloud",
      backupId: targetDocId,
      siteId,
      timestamp: backupMeta?.timestamp,
      sofiaTime: backupMeta?.sofiaTime,
      stats: backupMeta?.stats,
      data: collectionsData,
    };

    const jsonString = JSON.stringify(fullPayload, null, 2);
    const fileName = `bkgalabovo_backup_${targetDocId}.json`;

    return new NextResponse(jsonString, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    console.error("Backup download error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
