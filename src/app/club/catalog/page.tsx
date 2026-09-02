import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import Link from "next/link";

import PublicCatalogTabs from "@/components/club/PublicCatalogTabs";
import { GoogleTranslateWidget } from "@/components/shared/GoogleTranslateWidget";
import { getAdminDb } from "@/lib/firebase-admin";

export const metadata: Metadata = {
  title: "Каталог | БК Гълъбово",
  description: "Разгледайте нашите тренировки, услуги и продукти.",
};

export const dynamic = "force-dynamic";

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
    const adminDb = getAdminDb();
    try {
      const snap = await adminDb.collection(collectionName).get();
      return snap.docs.map(
        (doc) =>
          serializeDoc({ id: doc.id, ...doc.data() }) as Record<string, unknown>
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
  ["catalog-collection"],
  { revalidate: 300, tags: ["catalog"] }
);

export default async function CatalogPage() {
  const servicesRaw = await getCachedCollection("clubServices");
  const services = servicesRaw.filter(
    (item) => !item.siteId || item.siteId === "bkgalabovo"
  );

  const generalRaw = await getCachedCollection("clubGeneralServices");
  const generalServices = generalRaw.filter(
    (item) => !item.siteId || item.siteId === "bkgalabovo"
  );

  const productsRaw = await getCachedCollection("products");
  const products = productsRaw.filter(
    (item) => !item.siteId || item.siteId === "bkgalabovo"
  );

  const recoveryServices = await getCachedCollection("sessions");

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <nav className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-blue-400/30 bg-black/80 px-6 py-4 backdrop-blur-xl">
        <Link
          href="/club"
          className="flex items-center gap-2 text-sm text-zinc-400 transition-all hover:text-blue-400 hover:drop-shadow-[0_0_8px_rgba(30,58,138,0.8)]"
        >
          <ArrowLeft size={16} />
          Назад към клуба
        </Link>
        <span className="text-sm font-medium tracking-widest text-blue-400 uppercase drop-shadow-[0_0_8px_rgba(30,58,138,0.3)]">
          Каталог
        </span>
        <div className="flex items-center gap-4">
          <GoogleTranslateWidget />
        </div>
      </nav>

      {/* Hero / Header */}
      <div className="relative overflow-hidden px-6 pt-32 pb-20">
        <div className="pointer-events-none absolute top-0 left-1/2 h-96 w-full max-w-3xl -translate-x-1/2 rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="relative z-10 mx-auto max-w-6xl text-center">
          <h1 className="mb-6 text-4xl font-light tracking-tight md:text-6xl">
            Клубни{" "}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text font-bold text-transparent drop-shadow-[0_0_12px_rgba(59,130,246,0.4)]">
              Каталози
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-zinc-400">
            Тук ще намерите всички наши тренировки, клубни услуги и продукти.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 px-6 pb-32">
        <div className="mx-auto max-w-6xl">
          <div className="glassmorphism rounded-3xl border border-blue-400/20 bg-black/80 p-6 md:p-10">
            <PublicCatalogTabs
              trainings={services}
              generalServices={generalServices}
              products={products}
              recoveryServices={recoveryServices}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
