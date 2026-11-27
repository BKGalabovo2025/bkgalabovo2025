import { NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cleans up broken/incomplete chunked Firestore uploads older than 24 hours.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const isAuthorized =
    Boolean(process.env.CRON_SECRET) &&
    authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const adminDb = getAdminDb();
    const cutoffIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const sites = ["bkgalabovo", "recoveryzone", "default"];
    let cleanedDocs = 0;

    for (const siteId of sites) {
      const snap = await adminDb
        .collection("sites")
        .doc(siteId)
        .collection("uploaded_files")
        .where("createdAt", "<", cutoffIso)
        .limit(100)
        .get();

      for (const doc of snap.docs) {
        const data = doc.data();
        if (
          typeof data.chunksCount === "number" &&
          data.chunksCount > 0 &&
          !data.data
        ) {
          const chunksSnap = await doc.ref.collection("chunks").get();
          if (chunksSnap.size < data.chunksCount) {
            const batch = adminDb.batch();
            chunksSnap.docs.forEach((c) => batch.delete(c.ref));
            batch.delete(doc.ref);
            await batch.commit();
            cleanedDocs++;
          }
        }
      }
    }

    logger.info("Orphaned upload cleanup completed", "cleanup-uploads", {
      cleanedDocs,
    });
    return NextResponse.json({ success: true, cleanedDocs });
  } catch (err) {
    logger.error("Cleanup uploads cron failed", "cleanup-uploads", err);
    return NextResponse.json(
      { success: false, error: "Cleanup failed" },
      { status: 500 }
    );
  }
}
