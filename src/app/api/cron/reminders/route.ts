import { NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
    const now = new Date();

    // Process each site separately for proper tenant isolation
    const sites = ["bkgalabovo", "recoveryzone"];
    let totalEmailsSent = 0;

    for (const siteId of sites) {
      console.log(`Processing trip reminders for site: ${siteId}`);

      // Get all trips that are not completed, filtered by siteId
      const tripsSnapshot = await adminDb
        .collection("business_trips")
        .where("status", "in", ["draft", "approved"])
        .where("siteId", "==", siteId)
        .get();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tripsToRemind: any[] = [];

      // Check if the 3-day NKS reporting deadline after endDate has passed and no reminder was sent in the last 6 days
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      for (const doc of tripsSnapshot.docs) {
        const data = doc.data();
        const lastSent = data.lastReminderSentAt
          ? new Date(data.lastReminderSentAt)
          : null;
        if (lastSent && lastSent > sixDaysAgo) {
          continue;
        }
        if (data.endDate && new Date(data.endDate) < threeDaysAgo) {
          tripsToRemind.push({ id: doc.id, ...data });
        }
      }

      if (tripsToRemind.length === 0) {
        console.log(`No trip reminders needed for site: ${siteId}`);
        continue;
      }

      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.NODE_ENV === "development"
          ? "http://localhost:3000"
          : "https://bkgalabovo2025.vercel.app");

      const coachIds = Array.from(
        new Set(tripsToRemind.map((t) => t.coachId).filter(Boolean) as string[])
      );
      const coachMap = new Map<string, FirebaseFirestore.DocumentData>();
      if (coachIds.length > 0) {
        const coachRefs = coachIds.map((id) =>
          adminDb.collection("members").doc(id)
        );
        const coachDocs = await adminDb.getAll(...coachRefs);
        coachDocs.forEach((d) => {
          if (d.exists && d.data()) coachMap.set(d.id, d.data()!);
        });
      }

      let emailsSent = 0;

      for (const trip of tripsToRemind) {
        if (!trip.coachId) continue;
        const coachData = coachMap.get(trip.coachId);
        if (!coachData) continue;

        const email = coachData.email;
        if (!email) continue;

        // Call our own /api/send-email endpoint using CRON_SECRET
        const response = await fetch(`${baseUrl}/api/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.CRON_SECRET}`,
          },
          body: JSON.stringify({
            to: email,
            subject: `Напомняне: Неотчетена командировка "${trip.title}"`,
            template: "marketing", // Re-using marketing template for custom message
            data: {
              memberName: trip.coachName || coachData.name,
              messageText: `Здравейте, ${trip.coachName || coachData.name}.\n\nНапомняме Ви, че командировката "${trip.title}" до ${trip.destination} е приключила на ${new Date(trip.endDate).toLocaleDateString("bg-BG")}, но все още не е отчетена.\n\nМоля, влезте в системата и качете необходимите документи и разходи, за да приключите командировката.`,
            },
          }),
        });

        if (response.ok) {
          emailsSent++;
          await adminDb
            .collection("business_trips")
            .doc(trip.id)
            .update({ lastReminderSentAt: now.toISOString() })
            .catch((err) =>
              console.warn("Failed to record lastReminderSentAt:", trip.id, err)
            );
        } else {
          console.error(
            "Failed to send reminder email for trip",
            trip.id,
            await response.text()
          );
        }
      }

      totalEmailsSent += emailsSent;
      console.log(`Site ${siteId}: ${emailsSent} trip reminder emails sent`);
    }

    return NextResponse.json({ message: `Reminders sent: ${totalEmailsSent}` });
  } catch (error) {
    console.error("Cron reminders error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
