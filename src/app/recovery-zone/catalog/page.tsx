import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminDb } from "@/lib/firebase-admin";
import PublicCatalogTabs from "@/components/club/PublicCatalogTabs";

export const metadata: Metadata = {
  title: "Каталог | Recovery Zone by ZM",
  description:
    "Разгледайте нашите възстановителни процедури, услуги и продукти.",
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

export default async function RecoveryCatalogPage() {
  const adminDb = getAdminDb();
  // We fetch the same catalogs, but for Recovery Zone we can either show everything or filter for "recoveryzone"
  // For maximum compatibility with PublicCatalogTabs, we provide all data just like the Club page.
  // We don't filter out things unless they are explicitly assigned to another site (if siteId exists).
  // Wait, if it's explicitly assigned to "bkgalabovo", it probably shouldn't be in the recovery zone catalog?
  // Let's filter out items that have siteId explicitly set to something else, or keep it generic if siteId is missing.
  // 2) The Recovery Zone catalog page fetches only Recovery Services.

  let recoveryServices: Record<string, unknown>[] = [];
  try {
    const recoverySnapshot = await adminDb.collection("sessions").get();
    recoveryServices = recoverySnapshot.docs.map(
      (doc) =>
        serializeDoc({ id: doc.id, ...doc.data() }) as Record<string, unknown>
    );
  } catch (error) {
    console.error("Failed to fetch sessions for recovery catalog page:", error);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-black/80 backdrop-blur-xl border-b border-emerald-400/30">
        <Link
          href="/recovery-zone"
          className="flex items-center gap-2 text-zinc-400 hover:text-emerald-400 hover:drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] transition-all text-sm"
        >
          <ArrowLeft size={16} />
          Назад към Recovery Zone
        </Link>
        <span className="font-medium text-sm text-emerald-400 uppercase tracking-widest drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
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
              Recovery Zone{" "}
              <span className="text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.4)]">
                Каталог
              </span>
            </h1>
            <p className="text-zinc-400">
              Разгледайте пълния списък с нашите възстановителни процедури.
            </p>
          </div>

          <div className="bg-black/80 border border-emerald-400/20 rounded-3xl p-6 md:p-10 glassmorphism">
            <PublicCatalogTabs
              trainings={[]}
              generalServices={[]}
              products={[]}
              recoveryServices={recoveryServices}
              allowedTabs={["recovery"]}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
