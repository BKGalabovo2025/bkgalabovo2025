import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

// This endpoint can be triggered by Vercel Cron or manually via UI
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

    let deactivatedCount = 0;
    let activatedCount = 0;

    // We'll process them in batches or sequentially
    // Since there might be thousands, we use batch
    const batch = adminDb.batch();
    let batchCount = 0;
    const MAX_BATCH_SIZE = 450;

    const formatDateTime = () => {
      const date = new Date();
      return date.toLocaleString("bg-BG", { timeZone: "Europe/Sofia" });
    };

    const getLastActivityDate = async (memberId: string, data: any) => {
      let lastActivityDate = new Date(0);

      if (data.registrationDate) {
        if (typeof data.registrationDate.toDate === "function") {
          lastActivityDate = data.registrationDate.toDate();
        } else {
          lastActivityDate = new Date(data.registrationDate);
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

    for (const doc of membersSnap.docs) {
      const memberId = doc.id;
      const data = doc.data();
      const currentStatus = data.status || "active";

      const lastActivityDate = await getLastActivityDate(memberId, data);

      const isInactive = lastActivityDate < thirtyDaysAgo;

      let newStatus = currentStatus;
      let note = "";

      if (isInactive && currentStatus === "active") {
        newStatus = "inactive";
        note = `\n[${formatDateTime()}] Системата автоматично промени статуса на "неактивен" поради липса на активност над 30 дни (последна активност: ${lastActivityDate.toLocaleDateString("bg-BG")}).`;
        deactivatedCount++;
      } else if (!isInactive && currentStatus === "inactive") {
        newStatus = "active";
        note = `\n[${formatDateTime()}] Системата автоматично промени статуса на "активен" поради регистрирана нова активност (последна активност: ${lastActivityDate.toLocaleDateString("bg-BG")}).`;
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

      // If batch size limit reached, commit and start a new batch
      if (batchCount >= MAX_BATCH_SIZE) {
        await batch.commit();
        batchCount = 0;
      }
    }

    // Commit any remaining updates
    if (batchCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({
      message: "Автоматичната проверка завърши успешно.",
      processedCount: membersSnap.size,
      deactivatedCount,
      activatedCount,
    });
  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
