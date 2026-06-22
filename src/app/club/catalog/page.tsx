import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminDb } from "@/lib/firebase-admin";
import PublicCatalogTabs from "@/components/club/PublicCatalogTabs";

export const metadata: Metadata = {
  title: "Каталог | БК Гълъбово",
  description: "Разгледайте нашите тренировки, услуги и продукти.",
};

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

export default async function CatalogPage() {
  const adminDb = getAdminDb();

  const servicesSnapshot = await adminDb.collection("clubServices").get();
  const services = servicesSnapshot.docs
    .map((doc) => serializeDoc({ id: doc.id, ...doc.data() }) as Record<string, unknown>)
    .filter((item) => !item.siteId || item.siteId === "bkgalabovo");

  const generalSnapshot = await adminDb.collection("clubGeneralServices").get();
  const generalServices = generalSnapshot.docs
    .map((doc) => serializeDoc({ id: doc.id, ...doc.data() }) as Record<string, unknown>)
    .filter((item) => !item.siteId || item.siteId === "bkgalabovo");

  const productsSnapshot = await adminDb.collection("products").get();
  const products = productsSnapshot.docs
    .map((doc) => serializeDoc({ id: doc.id, ...doc.data() }) as Record<string, unknown>)
    .filter((item) => !item.siteId || item.siteId === "bkgalabovo");

  const recoverySnapshot = await adminDb.collection("sessions").get();
  const recoveryServices = recoverySnapshot.docs.map((doc) =>
    serializeDoc({ id: doc.id, ...doc.data() }) as Record<string, unknown>
  );

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

      {/* Main Content */}
      <main className="pt-24 px-6 pb-32">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-light tracking-tight mb-4">
              Клубни{" "}
              <span className="text-blue-400 drop-shadow-[0_0_12px_rgba(30,58,138,0.4)]">
                Каталози
              </span>
            </h1>
            <p className="text-zinc-400">
              Тук ще намерите всички наши тренировки, клубни услуги и продукти.
            </p>
          </div>

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
