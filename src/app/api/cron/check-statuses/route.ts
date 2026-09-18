import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

// This endpoint can be triggered by Vercel Cron or manually via UI
export const getLastActivityDate = async (
  adminDb: FirebaseFirestore.Firestore,
  memberId: string,
  data: { registrationDate?: { toDate?: () => Date } | string | Date | null }
) => {
  let lastActivityDate = new Date(0);

  if (data.registrationDate) {
    if (
      typeof (data.registrationDate as { toDate?: () => Date })?.toDate ===
      "function"
    ) {
      lastActivityDate = (
        data.registrationDate as { toDate: () => Date }
      ).toDate();
    } else {
      lastActivityDate = new Date(
        data.registrationDate as string | number | Date
      );
    }
  }

  const [salesSnap, eventsSnap] = await Promise.all([
    adminDb
      .collection("sales")
      .where("memberId", "==", memberId)
      .orderBy("saleDate", "desc")
      .limit(1)
      .get()
      .catch((err) => {
        console.error(`Error querying sales for member ${memberId}:`, err);
        return {
          empty: true,
          docs: [],
        } as unknown as FirebaseFirestore.QuerySnapshot;
      }),
    adminDb
      .collection("events")
      .where("attendeeMemberIds", "array-contains", memberId)
      .orderBy("startDate", "desc")
      .limit(1)
      .get()
      .catch((err) => {
        console.error(`Error querying events for member ${memberId}:`, err);
        return {
          empty: true,
          docs: [],
        } as unknown as FirebaseFirestore.QuerySnapshot;
      }),
  ]);

  if (!salesSnap.empty) {
    const saleDate = new Date(salesSnap.docs[0].data().saleDate);
    if (saleDate > lastActivityDate) lastActivityDate = saleDate;
  }

  if (!eventsSnap.empty) {
    const eventDate = new Date(eventsSnap.docs[0].data().startDate);
    if (eventDate > lastActivityDate) lastActivityDate = eventDate;
  }

  return lastActivityDate;
};

export const processMemberStatus = (
  currentStatus: string,
  lastActivityDate: Date,
  thirtyDaysAgo: Date,
  formatDateTime: () => string
) => {
  const isInactive = lastActivityDate < thirtyDaysAgo;
  let newStatus = currentStatus;
  let note = "";

  if (isInactive && currentStatus === "active") {
    newStatus = "inactive";
    note = `\n[${formatDateTime()}] Системата автоматично промени статуса на "неактивен" поради липса на активност над 30 дни (последна активност: ${lastActivityDate.toLocaleDateString("bg-BG")}).`;
  } else if (!isInactive && currentStatus === "inactive") {
    newStatus = "active";
    note = `\n[${formatDateTime()}] Системата автоматично промени статуса на "активен" поради регистрирана нова активност (последна активност: ${lastActivityDate.toLocaleDateString("bg-BG")}).`;
  }

  return { newStatus, note };
};

export const formatDateTime = () => {
  const date = new Date();
  return date.toLocaleString("bg-BG", { timeZone: "Europe/Sofia" });
};

const evaluateMemberChunk = async (
  chunk: FirebaseFirestore.QueryDocumentSnapshot[],
  adminDb: FirebaseFirestore.Firestore,
  thirtyDaysAgo: Date,
  formatDateTimeFn: () => string
) => {
  return Promise.all(
    chunk.map(async (doc) => {
      const memberId = doc.id;
      const data = doc.data();
      const currentStatus = data.status || "active";

      const lastActivityDate = await getLastActivityDate(
        adminDb,
        memberId,
        data
      );
      const { newStatus, note } = processMemberStatus(
        currentStatus,
        lastActivityDate,
        thirtyDaysAgo,
        formatDateTimeFn
      );
      return { doc, data, currentStatus, newStatus, note };
    })
  );
};

const applyResultToBatch = (
  res: {
    doc: FirebaseFirestore.QueryDocumentSnapshot;
    data: FirebaseFirestore.DocumentData;
    currentStatus: string;
    newStatus: string;
    note: string;
  },
  batch: FirebaseFirestore.WriteBatch
) => {
  const isDeactivated =
    res.newStatus === "inactive" && res.currentStatus === "active";
  const isActivated =
    res.newStatus === "active" && res.currentStatus === "inactive";
  const hasChanged = res.newStatus !== res.currentStatus;

  if (hasChanged) {
    const existingNotes = res.data.notes || "";
    batch.update(res.doc.ref, {
      status: res.newStatus,
      notes: (existingNotes + res.note).trim(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  return { isDeactivated, isActivated, hasChanged };
};

interface BatchCounts {
  deactivatedCount: number;
  activatedCount: number;
  batchCount: number;
}

const applyChunkToBatch = (
  chunkResults: {
    doc: FirebaseFirestore.QueryDocumentSnapshot;
    data: FirebaseFirestore.DocumentData;
    currentStatus: string;
    newStatus: string;
    note: string;
  }[],
  batch: FirebaseFirestore.WriteBatch,
  counts: BatchCounts
) => {
  for (const res of chunkResults) {
    const outcome = applyResultToBatch(res, batch);
    if (outcome.isDeactivated) counts.deactivatedCount++;
    if (outcome.isActivated) counts.activatedCount++;
    if (outcome.hasChanged) counts.batchCount++;
  }
};

export const processMembersBatch = async (
  adminDb: FirebaseFirestore.Firestore,
  membersDocs: FirebaseFirestore.QueryDocumentSnapshot[],
  thirtyDaysAgo: Date,
  formatDateTimeFn: () => string
) => {
  const counts: BatchCounts = {
    deactivatedCount: 0,
    activatedCount: 0,
    batchCount: 0,
  };
  const MAX_BATCH_SIZE = 450;
  const batch = adminDb.batch();

  // Process members in concurrent chunks of 10 to eliminate N+1 bottlenecks
  const CHUNK_SIZE = 10;
  for (let i = 0; i < membersDocs.length; i += CHUNK_SIZE) {
    const chunk = membersDocs.slice(i, i + CHUNK_SIZE);
    const chunkResults = await evaluateMemberChunk(
      chunk,
      adminDb,
      thirtyDaysAgo,
      formatDateTimeFn
    );

    applyChunkToBatch(chunkResults, batch, counts);

    if (counts.batchCount >= MAX_BATCH_SIZE) {
      await batch.commit();
      counts.batchCount = 0;
    }
  }

  if (counts.batchCount > 0) {
    await batch.commit();
  }

  return {
    deactivatedCount: counts.deactivatedCount,
    activatedCount: counts.activatedCount,
  };
};

export async function GET(request: Request) {
  console.log("--- API /api/cron/check-statuses HIT! ---");

  const authHeader = request.headers.get("authorization");
  const isCronSecretValid =
    process.env.CRON_SECRET &&
    authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isCronSecretValid) {
    try {
      const token = authHeader?.split("Bearer ")[1];
      if (token) {
        const { ensureAdmin } = await import("@/lib/auth-utils");
        await ensureAdmin(token);
      } else {
        const { ensureAdminFromSession } = await import("@/lib/auth-utils");
        await ensureAdminFromSession();
      }
    } catch (authError) {
      console.error("Unauthorized cron check-statuses request:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const adminDb = getAdminDb();

    // Thirty days ago from today
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Process each site separately for proper tenant isolation
    const sites = ["bkgalabovo", "recoveryzone"];
    let totalProcessedCount = 0;
    let totalDeactivatedCount = 0;
    let totalActivatedCount = 0;

    for (const siteId of sites) {
      console.log(`Processing member status check for site: ${siteId}`);

      const membersSnap = await adminDb
        .collection("members")
        .where("siteId", "==", siteId)
        .get();

      const { deactivatedCount, activatedCount } = await processMembersBatch(
        adminDb,
        membersSnap.docs as FirebaseFirestore.QueryDocumentSnapshot[],
        thirtyDaysAgo,
        formatDateTime
      );

      totalProcessedCount += membersSnap.size;
      totalDeactivatedCount += deactivatedCount;
      totalActivatedCount += activatedCount;

      console.log(
        `Site ${siteId}: ${membersSnap.size} processed, ${deactivatedCount} deactivated, ${activatedCount} activated`
      );
    }

    return NextResponse.json({
      message: "Автоматичната проверка завърши успешно.",
      processedCount: totalProcessedCount,
      deactivatedCount: totalDeactivatedCount,
      activatedCount: totalActivatedCount,
    });
  } catch (error: unknown) {
    console.error("Cron Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
