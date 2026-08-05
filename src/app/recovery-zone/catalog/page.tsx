import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import Link from "next/link";

import PublicCatalogTabs from "@/components/club/PublicCatalogTabs";
import { GoogleTranslateWidget } from "@/components/shared/GoogleTranslateWidget";
import { getAdminDb } from "@/lib/firebase-admin";

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

const getCachedSessions = unstable_cache(
  async (): Promise<Record<string, unknown>[]> => {
    const adminDb = getAdminDb();
    try {
      const snap = await adminDb.collection("sessions").get();
      return snap.docs.map(
        (doc) =>
          serializeDoc({ id: doc.id, ...doc.data() }) as Record<string, unknown>
      );
    } catch (error) {
      console.error(
        "Failed to fetch sessions for recovery catalog page:",
        error
      );
      return [];
    }
  },
  ["recovery-sessions"],
  { revalidate: 300, tags: ["sessions"] }
);

export default async function RecoveryCatalogPage() {
  const recoveryServices = await getCachedSessions();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <nav className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-emerald-400/30 bg-black/80 px-6 py-4 backdrop-blur-xl">
        <Link
          href="/recovery-zone"
          className="flex items-center gap-2 text-sm text-zinc-400 transition-all hover:text-emerald-400 hover:drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]"
        >
          <ArrowLeft size={16} />
          Назад към Recovery Zone
        </Link>
        <span className="text-sm font-medium tracking-widest text-emerald-400 uppercase drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
          Каталог
        </span>
        <div className="flex items-center gap-4">
          <GoogleTranslateWidget />
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-6 pt-24 pb-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12">
            <h1 className="mb-4 text-4xl font-light tracking-tight">
              Recovery Zone{" "}
              <span className="text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.4)]">
                Каталог
              </span>
            </h1>
            <p className="text-zinc-400">
              Разгледайте пълния списък с нашите възстановителни процедури.
            </p>
          </div>

          <div className="glassmorphism rounded-3xl border border-emerald-400/20 bg-black/80 p-6 md:p-10">
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
