import type { Metadata } from "next";
import Link from "next/link";
import { getSiteById } from "@/services/site-service";
export const revalidate = 300; // ISR: Revalidate every 5 minutes

export const metadata: Metadata = {
  title: "Recovery Zone by ZM | Професионално Възстановяване",
  description:
    "Възстановете се по-бързо с най-съвременната технология Hyperice Normatec 3. Професионално решение за спортисти и активни хора.",
  openGraph: {
    title: "Recovery Zone by ZM | Професионално Възстановяване",
    description:
      "Възстановете се по-бързо с най-съвременната технология Hyperice Normatec 3.",
    url: "https://bkgalabovo2025.vercel.app/recovery-zone",
    siteName: "Recovery Zone",
    images: [
      {
        url: "https://bkgalabovo2025.vercel.app/1.png",
        width: 800,
        height: 800,
        alt: "Recovery Zone Logo",
      },
    ],
    locale: "bg_BG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Recovery Zone by ZM",
    description: "Професионално решение за спортисти и активни хора.",
    images: ["https://bkgalabovo2025.vercel.app/1.png"],
  },
};

import { getAdminDb } from "@/lib/firebase-admin";
import RecoveryZoneClient from "./RecoveryZoneClient";

export default async function RecoveryZonePage() {
  const adminDb = getAdminDb();

  const site = await getSiteById("recoveryzone");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    name: "Recovery Zone by ZM",
    image: "https://bkgalabovo2025.vercel.app/1.png",
    "@id": "https://bkgalabovo2025.vercel.app/recovery-zone",
    url: "https://bkgalabovo2025.vercel.app/recovery-zone",
    telephone: site?.phone || "+359899388338",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Спортна зала „Енергетик“",
      addressLocality: "Гълъбово",
      postalCode: "6280",
      addressCountry: "BG",
    },
  };

  // Fetch 7 day schedule (events with siteId recoveryzone)
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOf7Days = new Date(now);
  endOf7Days.setDate(now.getDate() + 7);
  endOf7Days.setHours(23, 59, 59, 999);

  let scheduleSnapshot;
  try {
    scheduleSnapshot = await adminDb
      .collection("events")
      .where("siteId", "==", "recoveryzone")
      .get();
  } catch (error) {
    console.error("Failed to fetch events for recovery zone page:", error);
    scheduleSnapshot = { docs: [] };
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
      title: data.title || "Сесия възстановяване",
      startTime: startDateStr,
      endTime: endDateStr,
      isCancelled: !!data.isCancelled,
      description: data.description || "",
      location: data.location || 'Спортна зала „Енергетик"',
    };
  });

  const schedule = scheduleRaw
    .filter((event) => {
      const eventStart = new Date(event.startTime);
      return eventStart >= startOfDay && eventStart < endOf7Days;
    })
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

  if (!site) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Обектът не е намерен</h1>
          <Link href="/" className="text-emerald-500 hover:underline">
            Обратно към началната страница
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RecoveryZoneClient schedule={schedule} site={site} />
    </>
  );
}
