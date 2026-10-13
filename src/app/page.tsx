import { ChevronRight, ShieldCheck } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";

import { BK_LOGO_DATA_URI, RZ_SQUARE_LOGO_DATA_URI } from "@/lib/logos-base64";

const GoogleTranslateWidget = dynamic(() =>
  import("@/components/shared/GoogleTranslateWidget").then(
    (mod) => mod.GoogleTranslateWidget
  )
);

const HomeAdminLink = dynamic(() =>
  import("@/components/home/HomeAdminLink").then((mod) => mod.HomeAdminLink)
);

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col justify-between overflow-x-hidden bg-zinc-950 bg-[radial-gradient(ellipse_80%_80%_at_0%_0%,rgba(37,99,235,0.12),transparent_50%),radial-gradient(ellipse_80%_80%_at_100%_100%,rgba(16,185,129,0.10),transparent_50%)] text-white selection:bg-zinc-800 lg:h-screen lg:overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-25 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-size-[32px_32px]" />

      {/* Header */}
      <header className="relative z-10 flex shrink-0 flex-col items-center justify-between gap-2 border-b border-white/5 px-6 py-2 md:flex-row md:gap-0 lg:px-8 lg:py-2.5">
        <div className="flex items-center gap-3">
          <ShieldCheck size={18} className="text-zinc-500" strokeWidth={1.5} />
          <span className="text-[11px] font-medium tracking-[0.3em] text-zinc-400 uppercase">
            Официален Портал
          </span>
        </div>
        <div className="flex flex-col items-center gap-3 sm:gap-6 md:flex-row">
          <div className="text-center text-[10px] font-medium tracking-widest text-zinc-400 uppercase md:text-right">
            Бадминтон клуб Гълъбово{" "}
            <span className="text-zinc-500">(от 2014 г.)</span>
            <span className="mx-2 hidden text-zinc-500 md:inline">•</span>
            <br className="md:hidden" />
            Recovery Zone by ZM{" "}
            <span className="text-zinc-500">(от 2026 г.)</span>
          </div>

          <div className="hidden h-5 w-px bg-zinc-800 md:block" />

          <GoogleTranslateWidget />

          <HomeAdminLink />
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-1.5 sm:px-6 md:py-2">
        <div className="flex w-full flex-col items-center">
          {/* Tagline */}
          <h1 className="my-2 max-w-3xl text-center text-4xl font-light tracking-tight text-white leading-tight sm:text-5xl md:my-2.5 md:text-6xl">
            Изберете
            <br />
            <span className="text-zinc-400">своя портал</span>
          </h1>
          <p className="mb-3.5 max-w-md text-center text-xs text-zinc-300 md:mb-4 sm:text-sm">
            Добре дошли! Изберете за кой обект искате да научите повече или да
            запазите своя час.
          </p>

          {/* Cards Grid */}
          <div className="grid w-full max-w-3xl grid-cols-1 gap-3.5 md:max-w-4xl md:grid-cols-2 md:gap-5">
            {/* BK Galabovo */}
            <div className="group relative flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900 p-4.5 transition-all duration-300 hover:-translate-y-1 hover:border-blue-600/50 hover:shadow-2xl hover:shadow-blue-900/20 sm:rounded-3xl sm:p-5 md:p-6">
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br from-blue-600/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:rounded-3xl" />
              <div className="relative mb-2.5 size-12 overflow-hidden rounded-full shadow-[0_0_15px_rgba(37,99,235,0.3)] sm:mb-3 sm:size-16">
                <Image
                  unoptimized
                  src={BK_LOGO_DATA_URI}
                  alt="Бадминтон Клуб Гълъбово Logo"
                  width={48}
                  height={48}
                  priority
                  className="size-full object-contain transition-all duration-300 group-hover:scale-105"
                />
              </div>
              <h2 className="mb-1 text-base font-medium text-white sm:text-lg md:text-xl">
                Бадминтон клуб Гълъбово
              </h2>
              <p className="mb-3.5 flex-1 text-xs leading-relaxed text-zinc-400 sm:text-sm md:mb-4">
                Официален сайт на клуба с актуални турнири, ранглиста, спортен
                календар и членство.
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  prefetch={false}
                  href="/club"
                  className="group/btn flex items-center justify-between rounded-xl bg-zinc-800 px-4 py-2.5 text-xs font-medium text-white transition-all duration-200 hover:bg-blue-600 sm:px-5 sm:py-2.5 sm:text-sm"
                >
                  <span>Към бадминтон клуба</span>
                  <ChevronRight
                    size={16}
                    className="transition-transform group-hover/btn:translate-x-1 sm:size-[18px]"
                  />
                </Link>
              </div>
            </div>

            {/* Recovery Zone */}
            <div className="group relative flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900 p-4.5 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-600/50 hover:shadow-2xl hover:shadow-emerald-900/20 sm:rounded-3xl sm:p-5 md:p-6">
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br from-emerald-600/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:rounded-3xl" />
              <div className="relative mb-2.5 size-12 overflow-hidden rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-1 shadow-[0_0_15px_rgba(16,185,129,0.2)] sm:mb-3 sm:size-16 sm:rounded-2xl">
                <Image
                  unoptimized
                  src={RZ_SQUARE_LOGO_DATA_URI}
                  alt="Recovery Zone by ZM Logo"
                  width={48}
                  height={48}
                  priority
                  className="size-full object-contain transition-all duration-300 group-hover:scale-105"
                />
              </div>
              <h2 className="mb-1 text-base font-medium text-white sm:text-lg md:text-xl">
                Recovery Zone by ZM
              </h2>
              <p className="mb-3.5 flex-1 text-xs leading-relaxed text-zinc-400 sm:text-sm md:mb-4">
                Център за професионален лимфен дренаж и ускорено възстановяване
                с Hyperice Normatec 3.
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  prefetch={false}
                  href="/recovery-zone"
                  className="group/btn flex items-center justify-between rounded-xl bg-zinc-800 px-4 py-2.5 text-xs font-medium text-white transition-all duration-200 hover:bg-emerald-500 sm:px-5 sm:py-2.5 sm:text-sm"
                >
                  <span>Към възстановителния център</span>
                  <ChevronRight
                    size={16}
                    className="transition-transform group-hover/btn:translate-x-1 sm:size-[18px]"
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex shrink-0 flex-col items-center justify-between gap-1.5 border-t border-white/5 px-6 py-2 text-center sm:px-8 md:flex-row md:gap-0 lg:py-2.5">
        <span className="text-center text-[10px] font-medium tracking-[0.3em] text-zinc-400 uppercase md:text-left">
          © {new Date().getFullYear()} Бадминтон клуб Гълъбово & Recovery Zone
          by ZM
        </span>
        <span className="text-[10px] tracking-widest text-zinc-400 uppercase">
          Град Гълъбово
        </span>
      </footer>
    </div>
  );
}
