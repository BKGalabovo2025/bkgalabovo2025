import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminDb } from "@/lib/firebase-admin";
import PublicCatalogTabs from "@/components/club/PublicCatalogTabs";
import { unstable_cache } from "next/cache";

export const metadata: Metadata = {
  title: "Каталог | БК Гълъбово",
  description: "Разгледайте нашите тренировки, услуги и продукти.",
};

export const revalidate = 300; // ISR: Revalidate every 5 minutes

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
        `Failed to fetch ${collectionName} for catalog page:`,
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
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-black/80 backdrop-blur-xl border-b border-blue-400/30">
        <Link
          href="/club"
          className="flex items-center gap-2 text-zinc-400 hover:text-blue-400 hover:drop-shadow-[0_0_8px_rgba(30,58,138,0.8)] transition-all text-sm"
        >
          <ArrowLeft size={16} />
          Назад към клуба
        </Link>
        <span className="font-medium text-sm text-blue-400 uppercase tracking-widest drop-shadow-[0_0_8px_rgba(30,58,138,0.3)]">
          Каталог
        </span>
        <div className="w-20"></div>
        {/* Spacer */}
      </nav>

      {/* Hero / Header */}
      <div className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-light tracking-tight mb-6">
            Клубни{" "}
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 drop-shadow-[0_0_12px_rgba(59,130,246,0.4)]">
              Каталози
            </span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Тук ще намерите всички наши тренировки, клубни услуги и продукти.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-6 pb-32 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="bg-black/80 border border-blue-400/20 rounded-3xl p-6 md:p-10 glassmorphism">
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
