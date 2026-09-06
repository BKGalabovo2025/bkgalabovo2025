import type { Metadata } from "next";

import { getAdminDb } from "@/lib/firebase-admin";

import ScheduleClient from "./ScheduleClient";

export const metadata: Metadata = {
  title: "Пълен Календар | БК Гълъбово",
  description: "Разширен месечен график на Бадминтон клуб Гълъбово.",
};

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  // Fetch all upcoming events for bkgalabovo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let scheduleSnapshot: { docs: any[] } = { docs: [] };
  try {
    const adminDb = getAdminDb();
    scheduleSnapshot = await adminDb
      .collection("events")
      .where("siteId", "==", "bkgalabovo")
      .get();
  } catch (error) {
    console.error("Failed to fetch events for schedule page:", error);
  }

  const scheduleRaw = scheduleSnapshot.docs.map((doc) => {
    const data = doc.data();

    let startDateStr = new Date().toISOString();
    if (data.startDate) {
      startDateStr =
        typeof data.startDate === "string"
          ? data.startDate
          : data.startDate.toDate?.().toISOString() || data.startDate;
    }

    let endDateStr = new Date().toISOString();
    if (data.endDate) {
      endDateStr =
        typeof data.endDate === "string"
          ? data.endDate
          : data.endDate.toDate?.().toISOString() || data.endDate;
    }

    return {
      id: doc.id,
      title: data.title || "Тренировка",
      startTime: startDateStr,
      endTime: endDateStr,
      isCancelled: !!data.isCancelled,
      description: data.description || "",
      location: data.location || 'Спортна зала „Енергетик"',
    };
  });

  // Filter only upcoming events and sort ascending
  const schedule = scheduleRaw
    .filter((event) => {
      const eventStart = new Date(event.startTime);
      return eventStart >= startOfDay;
    })
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

  return <ScheduleClient schedule={schedule} />;
}
