import type { Metadata } from "next";

import { getAdminDb } from "@/lib/firebase-admin";
import { serverCache } from "@/lib/server-cache";
import { getSiteByIdAdmin } from "@/services/admin/site-service.admin";

import ScheduleClient from "./ScheduleClient";

export const metadata: Metadata = {
  title: "Пълен Календар | БК Гълъбово",
  description: "Разширен месечен график на Бадминтон клуб Гълъбово.",
  alternates: {
    canonical: "/club/schedule",
  },
  openGraph: {
    title: "Пълен Календар | БК Гълъбово",
    description:
      "Разширен месечен график на тренировките, лагерите и турнирите на Бадминтон клуб Гълъбово.",
    url: "https://bkgalabovo2025.vercel.app/club/schedule",
    siteName: "БК Гълъбово",
    images: [
      {
        url: "https://bkgalabovo2025.vercel.app/bk-hero.webp",
        width: 1200,
        height: 630,
        alt: "Календар на БК Гълъбово",
      },
    ],
    locale: "bg_BG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Пълен Календар | БК Гълъбово",
    description: "Разширен месечен график на Бадминтон клуб Гълъбово.",
    images: ["https://bkgalabovo2025.vercel.app/bk-hero.webp"],
  },
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

    const isTournament =
      data.type === "competition" ||
      Boolean(data.tournamentUrl) ||
      Boolean(data.tournamentId);

    return {
      id: doc.id,
      title: data.title || "Тренировка",
      startTime: startDateStr,
      endTime: endDateStr,
      type: (data.type ||
        (isTournament ? "competition" : "training")) as string,
      isTournament,
      isCancelled: !!data.isCancelled,
      description: data.description || "",
      location: data.location || 'Спортна зала „Енергетик"',
      tournamentUrl: data.tournamentUrl || null,
      tournamentId: data.tournamentId || null,
      attachmentUrl: data.attachmentUrl || null,
      attachmentName: data.attachmentName || null,
      attachmentType: data.attachmentType || null,
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

  const clubSite = await serverCache.get(
    "site:bkgalabovo",
    () => getSiteByIdAdmin("bkgalabovo"),
    300_000
  );

  return <ScheduleClient schedule={schedule} clubSite={clubSite} />;
}
