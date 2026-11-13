import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import Link from "next/link";

import PublicCatalogTabs from "@/components/club/PublicCatalogTabs";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicNav } from "@/components/layout/public-nav";
import { getAdminDb } from "@/lib/firebase-admin";
import { serverCache } from "@/lib/server-cache";
import { getSiteByIdAdmin } from "@/services/admin/site-service.admin";

export const metadata: Metadata = {
  title: "Каталог | БК Гълъбово",
  description:
    "Разгледайте нашите тренировки, клубни услуги, възстановяване и спортна екипировка.",
  alternates: {
    canonical: "/club/catalog",
  },
  openGraph: {
    title: "Каталог | БК Гълъбово",
    description:
      "Разгледайте нашите тренировки, клубни услуги, възстановяване и спортна екипировка.",
    url: "https://bkgalabovo2025.vercel.app/club/catalog",
    siteName: "БК Гълъбово",
    images: [
      {
        url: "https://bkgalabovo2025.vercel.app/bk-hero.webp",
        width: 1200,
        height: 630,
        alt: "Каталог на БК Гълъбово",
      },
    ],
    locale: "bg_BG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Каталог | БК Гълъбово",
    description:
      "Разгледайте нашите тренировки, клубни услуги, възстановяване и спортна екипировка.",
    images: ["https://bkgalabovo2025.vercel.app/bk-hero.webp"],
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

const getCachedCollection = unstable_cache(
  async (collectionName: string): Promise<Record<string, unknown>[]> => {
    return serverCache.get(
      `catalog:${collectionName}`,
      async () => {
        try {
          const adminDb = getAdminDb();
          const snap = await adminDb.collection(collectionName).get();
          return snap.docs.map(
            (doc) =>
              serializeDoc({ id: doc.id, ...doc.data() }) as Record<
                string,
                unknown
              >
          );
        } catch (error) {
          console.error(
            "Failed to fetch %s for catalog page:",
            collectionName,
            error
          );
          return [];
        }
      },
      300_000 // 5 minutes in-memory TTL
    );
  },
  ["catalog-collection"],
  { revalidate: 300, tags: ["catalog"] }
);

export default async function CatalogPage() {
  const [servicesRaw, generalRaw, productsRaw, recoveryRaw, clubSite] =
    await Promise.all([
      getCachedCollection("clubServices"),
      getCachedCollection("clubGeneralServices"),
      getCachedCollection("products"),
      getCachedCollection("sessions"),
      serverCache.get(
        "site:bkgalabovo",
        () => getSiteByIdAdmin("bkgalabovo"),
        300_000
      ),
    ]);

  const services = servicesRaw.filter(
    (item) => !item.siteId || item.siteId === "bkgalabovo"
  );

  const generalServices = generalRaw.filter(
    (item) => !item.siteId || item.siteId === "bkgalabovo"
  );

  const products = productsRaw.filter(
    (item) => !item.siteId || item.siteId === "bkgalabovo"
  );

  const recoveryServices = recoveryRaw
    .filter((item) => item.isActive !== false)
    .map((item) => ({
      ...item,
      price:
        typeof item.price === "number" ? item.price : Number(item.price) || 0,
      durationMinutes: item.durationMinutes ?? item.duration ?? 0,
    }));

  return (
    <div className="public-portal-shell min-h-screen overflow-x-hidden bg-zinc-950 text-white">
      <PublicNav clubSite={clubSite} />

      <main id="main-content" className="relative z-10 pb-8 sm:pb-12">
        {/* Hero / Header */}
        <div className="relative overflow-hidden px-4 pt-20 pb-6 sm:px-6 sm:pt-28 sm:pb-10">
          <div className="pointer-events-none absolute top-0 left-1/2 h-72 w-full max-w-2xl -translate-x-1/2 rounded-full bg-blue-500/10 blur-lg" />
          <div className="relative z-10 m-auto max-w-6xl text-center">
            <nav
              aria-label="Навигационна пътека"
              className="mb-3 flex flex-wrap items-center justify-center gap-1.5 text-xs text-zinc-400"
            >
              <Link href="/" className="transition-colors hover:text-white">
                Портал
              </Link>
              <ChevronRight size={12} aria-hidden="true" />
              <Link
                href="/club"
                className="transition-colors hover:text-blue-400"
              >
                БК Гълъбово
              </Link>
              <ChevronRight size={12} aria-hidden="true" />
              <span className="font-medium text-blue-400">Каталог</span>
            </nav>

            <h1 className="mb-2 text-2xl font-light tracking-tight sm:text-4xl">
              Клубни{" "}
              <span className="bg-linear-to-r from-blue-400 to-indigo-500 bg-clip-text font-bold text-transparent drop-shadow-[0_0_12px_rgba(59,130,246,0.4)]">
                Каталози
              </span>
            </h1>
            <p className="m-auto max-w-2xl text-xs text-zinc-400 sm:text-sm">
              Каталог на тренировъчни програми, клубни услуги, възстановяване и
              магазин.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-3 sm:px-6">
          <div className="m-auto max-w-6xl">
            <div className="glassmorphism rounded-2xl border border-blue-400/20 bg-black/80 p-3 sm:rounded-3xl sm:p-5">
              <PublicCatalogTabs
                trainings={services}
                clubServices={generalServices}
                generalServices={generalServices}
                products={products}
                shop={products}
                recoveryServices={recoveryServices}
              />
            </div>
          </div>
        </div>
      </main>

      <PublicFooter clubSite={clubSite} />
    </div>
  );
}
