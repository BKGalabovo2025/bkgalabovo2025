import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

// This endpoint can be triggered by Vercel Cron or manually via UI
const getLastActivityDate = async (
  adminDb: FirebaseFirestore.Firestore,
  memberId: string,
  data: { registrationDate?: { toDate?: () => Date } | string | Date | null }
) => {
  let lastActivityDate = new Date(0);

  if (data.registrationDate) {
    if (typeof (data.registrationDate as { toDate?: () => Date })?.toDate === "function") {
      lastActivityDate = (data.registrationDate as { toDate: () => Date }).toDate();
    } else {
      lastActivityDate = new Date(data.registrationDate as string | number | Date);
    }
  }

  const salesSnap = await adminDb
    .collection("sales")
    .where("memberId", "==", memberId)
    .orderBy("saleDate", "desc")
    .limit(1)
    .get();

  if (!salesSnap.empty) {
    const saleDate = new Date(salesSnap.docs[0].data().saleDate);
    if (saleDate > lastActivityDate) lastActivityDate = saleDate;
  }

  const eventsSnap = await adminDb
    .collection("events")
    .where("attendeeMemberIds", "array-contains", memberId)
    .orderBy("startDate", "desc")
    .limit(1)
    .get();

  if (!eventsSnap.empty) {
    const eventDate = new Date(eventsSnap.docs[0].data().startDate);
    if (eventDate > lastActivityDate) lastActivityDate = eventDate;
  }

  return lastActivityDate;
};

const processMemberStatus = (
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

const formatDateTime = () => {
  const date = new Date();
  return date.toLocaleString("bg-BG", { timeZone: "Europe/Sofia" });
};

const processMembersBatch = async (
  adminDb: FirebaseFirestore.Firestore,
  membersDocs: FirebaseFirestore.QueryDocumentSnapshot[],
  thirtyDaysAgo: Date,
  formatDateTime: () => string
) => {
  let deactivatedCount = 0;
  let activatedCount = 0;
  let batchCount = 0;
  const MAX_BATCH_SIZE = 450;
  const batch = adminDb.batch();

  for (const doc of membersDocs) {
    const memberId = doc.id;
    const data = doc.data();
    const currentStatus = data.status || "active";

    const lastActivityDate = await getLastActivityDate(adminDb, memberId, data);
    const { newStatus, note } = processMemberStatus(currentStatus, lastActivityDate, thirtyDaysAgo, formatDateTime);

    if (newStatus === "inactive" && currentStatus === "active") {
      deactivatedCount++;
    } else if (newStatus === "active" && currentStatus === "inactive") {
      activatedCount++;
    }

    if (newStatus !== currentStatus) {
      const existingNotes = data.notes || "";
      batch.update(doc.ref, {
        status: newStatus,
        notes: (existingNotes + note).trim(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      batchCount++;
    }

    if (batchCount >= MAX_BATCH_SIZE) {
      await batch.commit();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  return { deactivatedCount, activatedCount };
};

export async function GET(request: Request) {
  console.log("--- API /api/cron/check-statuses HIT! ---");

  // Verify Cron secret if configured, but allow local/manual invocation if no secret is set
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const adminDb = getAdminDb();

    // Thirty days ago from today
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const membersSnap = await adminDb.collection("members").get();

    const { deactivatedCount, activatedCount } = await processMembersBatch(
      adminDb,
      membersSnap.docs as FirebaseFirestore.QueryDocumentSnapshot[],
      thirtyDaysAgo,
      formatDateTime
    );

    return NextResponse.json({
      message: "Автоматичната проверка завърши успешно.",
      processedCount: membersSnap.size,
      deactivatedCount,
      activatedCount,
    });
  } catch (error: unknown) {
    console.error("Cron Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
