"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import PublicCatalogTabs from "@/components/club/PublicCatalogTabs";
import { RecoveryFooter } from "@/components/recovery/RecoveryFooter";
import { RecoveryNav } from "@/components/recovery/RecoveryNav";
import { Site } from "@/types/site.types";

interface RecoveryCatalogClientProps {
  recoveryServices: Record<string, unknown>[];
  site?: Site | null;
  phone?: string;
  contraindications?: string[];
}

export function RecoveryCatalogClient({
  recoveryServices,
  site,
  phone,
  contraindications,
}: RecoveryCatalogClientProps) {
  return (
    <div className="public-portal-shell min-h-screen bg-zinc-950 font-sans text-white selection:bg-emerald-500 selection:text-white">
      <RecoveryNav />

      {/* Main Content */}
      <main id="main-content" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          {/* Compact Breadcrumbs */}
          <nav
            aria-label="Навигационна пътека"
            className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-zinc-400"
          >
            <Link href="/" className="transition-colors hover:text-white">
              Портал
            </Link>
            <ChevronRight size={14} className="text-zinc-600" />
            <Link
              href="/recovery-zone"
              className="transition-colors hover:text-emerald-400"
            >
              Recovery Zone
            </Link>
            <ChevronRight size={14} className="text-zinc-600" />
            <span className="font-medium text-emerald-400">Каталог</span>
          </nav>

          <div className="mb-10">
            <h1 className="mb-3 text-4xl font-light tracking-tight">
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
              phone={site?.phone || phone}
              contraindications={site?.contraindications ?? contraindications}
              schedule={site?.schedule}
              eventLocation={site?.address || site?.hallName}
            />
          </div>
        </div>
      </main>

      <RecoveryFooter site={site} />
    </div>
  );
}
