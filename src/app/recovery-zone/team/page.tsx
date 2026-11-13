import { ChevronRight, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { RecoveryFooter } from "@/components/recovery/RecoveryFooter";
import { RecoveryNav } from "@/components/recovery/RecoveryNav";
import { TeamSection } from "@/components/recovery/TeamSection";
import { getSiteByIdAdmin } from "@/services/admin/site-service.admin";
import { Site } from "@/types/site.types";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Нашият Екип | Recovery Zone by ZM",
    description:
      "Запознайте се с екипа и специалистите на Recovery Zone by ZM в град Гълъбово.",
    alternates: {
      canonical: "/recovery-zone/team",
    },
    openGraph: {
      title: "Нашият Екип | Recovery Zone by ZM",
      description:
        "Запознайте се с екипа и специалистите на Recovery Zone by ZM в град Гълъбово.",
      url: "https://bkgalabovo2025.vercel.app/recovery-zone/team",
      siteName: "Recovery Zone",
      images: [
        {
          url: "https://bkgalabovo2025.vercel.app/recovery-zone/rz-logo-horizontal.png",
          width: 1200,
          height: 630,
          alt: "Екип на Recovery Zone by ZM",
        },
      ],
      locale: "bg_BG",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Нашият Екип | Recovery Zone by ZM",
      description:
        "Запознайте се с екипа и специалистите на Recovery Zone by ZM.",
      images: [
        "https://bkgalabovo2025.vercel.app/recovery-zone/rz-logo-horizontal.png",
      ],
    },
  };
}

export default async function RecoveryTeamPage() {
  let site: Site | null = null;
  try {
    site = await getSiteByIdAdmin("recoveryzone");
  } catch (err) {
    console.error("RecoveryTeamPage: failed to fetch site data:", err);
  }

  const therapists = site?.therapists || [];
  const teamIntro = site?.teamIntro || "";

  return (
    <div className="public-portal-shell min-h-screen overflow-x-hidden bg-zinc-950 font-sans text-white selection:bg-emerald-500 selection:text-white">
      <RecoveryNav site={site} />

      <main id="main-content">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-4 pt-24 pb-6 sm:px-6 sm:pt-28 sm:pb-8">
          <div className="pointer-events-none absolute top-0 left-1/2 h-72 w-full max-w-2xl -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[100px]" />

          <div className="relative z-10 m-auto max-w-6xl text-center">
            <nav
              aria-label="Навигационна пътека"
              className="mb-4 flex flex-wrap items-center justify-center gap-1.5 text-xs text-zinc-400"
            >
              <Link href="/" className="transition-colors hover:text-white">
                Портал
              </Link>
              <ChevronRight size={12} aria-hidden="true" />
              <Link
                href="/recovery-zone"
                className="transition-colors hover:text-emerald-400"
              >
                Recovery Zone
              </Link>
              <ChevronRight size={12} aria-hidden="true" />
              <span className="font-medium text-emerald-400">Екип</span>
            </nav>

            <span className="mb-1.5 block text-[10px] font-bold tracking-[0.4em] text-emerald-400 uppercase sm:text-[11px]">
              Специалистите зад грижата
            </span>
            <h1 className="mb-2 text-2xl font-light tracking-tight sm:text-4xl">
              Нашият{" "}
              <span className="font-semibold text-emerald-400">Екип</span>
            </h1>
          </div>
        </section>

        {therapists.length > 0 ? (
          <TeamSection therapists={therapists} teamIntro={teamIntro} />
        ) : (
          <section className="px-4 py-16 sm:px-6">
            <div className="mx-auto max-w-xl rounded-3xl border border-zinc-800/80 bg-zinc-900/50 p-10 text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <Users size={26} />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-white">
                Информацията за екипа се обновява
              </h2>
              <p className="mb-6 text-sm text-zinc-400">
                Скоро ще представим подробно специалистите на{" "}
                {site?.name || "Recovery Zone by ZM"}.
              </p>
              <Link
                href="/recovery-zone/catalog"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold tracking-wider text-zinc-950 uppercase transition-colors hover:bg-emerald-400"
              >
                Разгледай услугите
              </Link>
            </div>
          </section>
        )}
      </main>

      <RecoveryFooter site={site} />
    </div>
  );
}
