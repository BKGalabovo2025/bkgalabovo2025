import { NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";

// eslint-disable-next-line sonarjs/cognitive-complexity
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const adminDb = getAdminDb();
    const now = new Date();
    // Get all trips that are not completed
    const tripsSnapshot = await adminDb
      .collection("business_trips")
      .where("status", "in", ["draft", "approved"])
      .get();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tripsToRemind: any[] = [];

    // Check if the end date has passed
    for (const doc of tripsSnapshot.docs) {
      const data = doc.data();
      if (data.endDate && new Date(data.endDate) < now) {
        tripsToRemind.push({ id: doc.id, ...data });
      }
    }

    if (tripsToRemind.length === 0) {
      return NextResponse.json({ message: "No reminders needed." });
    }

    const host = request.headers.get("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    let emailsSent = 0;

    for (const trip of tripsToRemind) {
      // Get the coach
      const coachDoc = await adminDb
        .collection("members")
        .doc(trip.coachId)
        .get();
      if (!coachDoc.exists) continue;

      const coachData = coachDoc.data();
      const email = coachData?.email;

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
      } else {
        console.error("Failed to send email to", email, await response.text());
      }
    }

    return NextResponse.json({ message: `Reminders sent: ${emailsSent}` });
  } catch (error) {
    console.error("Cron reminders error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
