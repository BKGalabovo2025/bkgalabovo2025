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

import fs from "fs";
import path from "path";
import { getAdminDb } from "@/lib/firebase-admin";
import RecoveryZoneClient from "./RecoveryZoneClient";

function serializeDoc(data: unknown): unknown {
  if (!data) return data;
  if (Array.isArray(data)) {
    return data.map(serializeDoc);
  }
  if (typeof data === "object") {
    const copy = { ...data } as Record<string, unknown>;
    for (const key of Object.keys(copy)) {
      const val = copy[key];
      if (
        val &&
        typeof val === "object" &&
        "toDate" in val &&
        typeof (val as { toDate?: () => Date }).toDate === "function"
      ) {
        copy[key] = (val as { toDate: () => Date }).toDate().toISOString();
      } else if (val && typeof val === "object" && "_seconds" in val) {
        copy[key] = new Date(
          (val as { _seconds: number })._seconds * 1000
        ).toISOString();
      } else {
        copy[key] = serializeDoc(val);
      }
    }
    return copy;
  }
  return data;
}

export default async function RecoveryZonePage() {
  const site = await getSiteById("recoveryzone");
  const adminDb = getAdminDb();

  let recoveryServices: Record<string, unknown>[] = [];
  try {
    const recoverySnapshot = await adminDb.collection("sessions").get();
    recoveryServices = recoverySnapshot.docs.map(
      (doc) =>
        serializeDoc({ id: doc.id, ...doc.data() }) as Record<string, unknown>
    );
  } catch (error) {
    console.error("Failed to fetch sessions for recovery zone page:", error);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    name: site?.name || "Recovery Zone by ZM",
    image: "https://bkgalabovo2025.vercel.app/1.png",
    "@id": "https://bkgalabovo2025.vercel.app/recovery-zone",
    url: "https://bkgalabovo2025.vercel.app/recovery-zone",
    telephone: site?.phone || "+359899388338",
    address: {
      "@type": "PostalAddress",
      streetAddress: site?.address || "Спортна зала „Енергетик“",
      addressLocality: "Гълъбово",
      postalCode: "6280",
      addressCountry: "BG",
    },
  };

  // Read images from public/recovery-zone
  let hallImages: string[] = [];
  try {
    const dirPath = path.join(process.cwd(), "public", "recovery-zone");
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      hallImages = files
        .filter((f) => f.match(/\.(jpg|jpeg|png|webp|gif)$/i))
        .map((f) => `/recovery-zone/${f}`);
    }
  } catch (error) {
    console.error("Failed to read recovery-zone images:", error);
  }

  if (hallImages.length === 0) {
    // Fallback if folder is empty or doesn't exist
    hallImages = ["/1.png", "/1.png"];
  }

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
      <RecoveryZoneClient
        site={site}
        hallImages={hallImages}
        recoveryServices={recoveryServices}
      />
    </>
  );
}
