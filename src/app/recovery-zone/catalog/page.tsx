import type { Metadata } from "next";
import { unstable_cache } from "next/cache";

import { getAdminDb } from "@/lib/firebase-admin";
import { serverCache } from "@/lib/server-cache";
import { getSiteByIdAdmin } from "@/services/admin/site-service.admin";
import { Site } from "@/types/site.types";

import { RecoveryCatalogClient } from "./RecoveryCatalogClient";

export const metadata: Metadata = {
  title: "Каталог | Recovery Zone by ZM",
  description:
    "Разгледайте нашите възстановителни процедури, услуги и продукти.",
  alternates: {
    canonical: "/recovery-zone/catalog",
  },
  openGraph: {
    title: "Каталог | Recovery Zone by ZM",
    description:
      "Разгледайте нашите възстановителни процедури, услуги и продукти с Hyperice Normatec 3.",
    url: "https://bkgalabovo2025.vercel.app/recovery-zone/catalog",
    siteName: "Recovery Zone",
    images: [
      {
        url: "https://bkgalabovo2025.vercel.app/recovery-zone/rz-logo-horizontal.png",
        width: 1200,
        height: 630,
        alt: "Recovery Zone by ZM Каталог",
      },
    ],
    locale: "bg_BG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Каталог | Recovery Zone by ZM",
    description:
      "Разгледайте нашите възстановителни процедури, услуги и продукти.",
    images: [
      "https://bkgalabovo2025.vercel.app/recovery-zone/rz-logo-horizontal.png",
    ],
  },
};

export const revalidate = 60;

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

const getCachedSessions = unstable_cache(
  async (): Promise<Record<string, unknown>[]> => {
    return serverCache.get(
      "recovery:sessions",
      async () => {
        try {
          const adminDb = getAdminDb();
          const snap = await adminDb.collection("sessions").get();
          return snap.docs
            .filter((doc) => {
              const data = doc.data();
              return (
                data.isActive !== false &&
                (!data.siteId || data.siteId === "recoveryzone")
              );
            })
            .map(
              (doc) =>
                serializeDoc({ id: doc.id, ...doc.data() }) as Record<
                  string,
                  unknown
                >
            );
        } catch (error) {
          console.error(
            "Failed to fetch sessions for recovery catalog page:",
            error
          );
          return [];
        }
      },
      300_000 // 5 minutes in-memory TTL
    );
  },
  ["recovery-sessions"],
  { revalidate: 300, tags: ["sessions"] }
);

const getCachedSite = unstable_cache(
  async (): Promise<Site | null> => {
    return getSiteByIdAdmin("recoveryzone");
  },
  ["recovery-site-full"],
  { revalidate: 300, tags: ["sites"] }
);

export default async function RecoveryCatalogPage() {
  const [recoveryServices, site] = await Promise.all([
    getCachedSessions(),
    getCachedSite(),
  ]);

  return (
    <RecoveryCatalogClient
      recoveryServices={recoveryServices}
      site={site}
      phone={site?.phone}
      contraindications={site?.contraindications}
    />
  );
}
