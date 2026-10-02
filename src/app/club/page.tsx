import fs from "fs";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import path from "path";

import { getAdminDb } from "@/lib/firebase-admin";
import { getSiteByIdAdmin } from "@/services/admin/site-service.admin";

import ClubClient from "./ClubClient";

export const revalidate = 60;

const withTimeout = <T,>(
  promise: Promise<T>,
  ms: number,
  fallback: T
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
};

export const metadata: Metadata = {
  title: "БК Гълъбово | Бадминтон клуб Гълъбово",
  description:
    "Официален сайт на Бадминтон клуб Гълъбово — турнири, ранглиста, тренировки и членство. Град Гълъбово.",
  openGraph: {
    title: "БК Гълъбово | Бадминтон клуб Гълъбово",
    description:
      "Официален сайт на Бадминтон клуб Гълъбово — турнири, ранглиста, тренировки и членство.",
    url: "https://bkgalabovo2025.vercel.app/club",
    siteName: "БК Гълъбово",
    images: [
      {
        url: "https://bkgalabovo2025.vercel.app/bk-hero.png",
        width: 1200,
        height: 630,
        alt: "БК Гълъбово",
      },
    ],
    locale: "bg_BG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "БК Гълъбово",
    description: "Официален сайт на Бадминтон клуб Гълъбово.",
    images: ["https://bkgalabovo2025.vercel.app/bk-hero.png"],
  },
};

export default async function ClubMainPage(props: {
  searchParams?: Promise<{ verify?: string }>;
}) {
  const searchParams = await props.searchParams;
  if (searchParams?.verify) {
    redirect(`/cert/${encodeURIComponent(searchParams.verify)}`);
  }
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsClub",
    name: "Бадминтон Клуб Гълъбово",
    image: "https://bkgalabovo2025.vercel.app/icons/LOGO.jpg",
    "@id": "https://bkgalabovo2025.vercel.app/club",
    url: "https://bkgalabovo2025.vercel.app/club",
    telephone: "+359899388338",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Спортна зала „Енергетик“",
      addressLocality: "Гълъбово",
      postalCode: "6280",
      addressCountry: "BG",
    },
  };
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOf7Days = new Date(now);
  endOf7Days.setDate(now.getDate() + 7);
  endOf7Days.setHours(23, 59, 59, 999);

  // Fetch site info and schedule in parallel with timeout protection
  const [clubSite, scheduleSnapshot] = await Promise.all([
    withTimeout(
      getSiteByIdAdmin("bkgalabovo").catch(() => null),
      3500,
      null
    ),
    withTimeout(
      (async () => {
        try {
          const adminDb = getAdminDb();
          return await adminDb
            .collection("events")
            .where("siteId", "==", "bkgalabovo")
            .get();
        } catch (error) {
          console.error("Failed to fetch events for club page:", error);
          return { docs: [] };
        }
      })(),
      3500,
      { docs: [] }
    ),
  ]);

  const scheduleRaw = scheduleSnapshot.docs.map((doc) => {
    const data = doc.data();

    // Handle both Timestamp and string representations of date
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

  // Next 7 days upcoming schedule for club homepage
  const schedule = scheduleRaw
    .filter((event) => {
      const eventStart = new Date(event.startTime);
      const eventEnd = event.endTime ? new Date(event.endTime) : eventStart;
      return eventEnd >= startOfDay && eventStart <= endOf7Days;
    })
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

  // Fetch hall images dynamically
  let hallImages: string[] = [];
  try {
    const hallDir = path.join(process.cwd(), "public", "hall");
    const files = fs.readdirSync(hallDir);
    hallImages = files
      .filter((file) => /\.(png|jpe?g|webp|gif|svg)$/i.test(file))
      .map((file) => `/hall/${file}`);
  } catch (error) {
    console.error("Error reading hall images directory:", error);
    // Fallback if directory fails to read
    hallImages = ["/hall/zala1.webp"];
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ClubClient
        schedule={schedule}
        hallImages={hallImages}
        clubSite={clubSite}
      />
    </>
  );
}
