"use client";

import {
  ArrowRight,
  ChevronRight,
  Lock,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/context/auth-context";

export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [hovered, setHovered] = useState<"bk" | "recovery" | "admin" | null>(
    null
  );

  const getBlobColor1 = (hoverState: string | null) => {
    if (hoverState === "bk") return "rgba(37,99,235,0.15)";
    if (hoverState === "recovery") return "rgba(16,185,129,0.08)";
    return "rgba(255,255,255,0.03)";
  };

  const getBlobColor2 = (hoverState: string | null) => {
    if (hoverState === "recovery") return "rgba(16,185,129,0.18)";
    if (hoverState === "bk") return "rgba(37,99,235,0.08)";
    return "rgba(255,255,255,0.03)";
  };

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  if (authLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="flex animate-pulse flex-col items-center gap-6">
          <div className="flex size-16 items-center justify-center rounded-3xl border border-zinc-700 bg-zinc-800 text-white">
            <Trophy size={32} strokeWidth={1.5} />
          </div>
          <p className="text-[10px] font-medium tracking-[0.3em] text-zinc-500 uppercase">
            Зареждане...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-zinc-950 text-white">
      {/* Ambient background blobs */}
      <div
        className="pointer-events-none absolute top-[-20%] left-[-10%] size-[600px] rounded-full blur-[120px] transition-all duration-1000"
        // eslint-disable-next-line react/forbid-dom-props
        style={{
          background: getBlobColor1(hovered),
        }}
      />
      <div
        className="pointer-events-none absolute right-[-10%] bottom-[-20%] size-[600px] rounded-full blur-[120px] transition-all duration-1000"
        // eslint-disable-next-line react/forbid-dom-props
        style={{
          background: getBlobColor2(hovered),
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/5 px-8 py-6">
        <div className="flex items-center gap-3">
          <ShieldCheck size={20} className="text-zinc-500" strokeWidth={1.5} />
          <span className="text-[11px] font-medium tracking-[0.3em] text-zinc-500 uppercase">
            BK Galabovo & Recovery Zone by ZM Portal
          </span>
        </div>
        <div className="text-[10px] font-medium tracking-widest text-zinc-600 uppercase">
          2014 & 2025 до сега . Добре дошли
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16">
        {/* Tagline */}
        <h1 className="leading-1.05 mt-8 mb-4 max-w-3xl text-center text-5xl font-light tracking-tight text-white md:text-7xl">
          Изберете
          <br />
          <span className="text-zinc-500">своя портал</span>
        </h1>
        <p className="mb-20 max-w-md text-center text-sm text-zinc-600">
          Изберете за кой обект искате да научите повече или да влезете.
        </p>

        {/* Cards Grid */}
        <div className="grid w-full max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">
          {/* BK Galabovo */}
          <div
            className="group relative flex flex-col rounded-3xl border border-zinc-800 bg-zinc-900 p-8 transition-all duration-500 hover:-translate-y-1 hover:border-blue-600/50 hover:bg-zinc-900/80 hover:shadow-2xl hover:shadow-blue-900/20"
            onMouseEnter={() => setHovered("bk")}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-linear-to-br from-blue-600/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="relative mb-6 size-14">
              <div className="absolute inset-0 rounded-2xl border border-blue-600/20 bg-blue-600/10 transition-all duration-500 group-hover:bg-blue-600" />
              <div className="absolute inset-0 flex items-center justify-center p-2">
                <Image
                  src="/logo.png"
                  alt="BK Galabovo Logo"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-contain p-2 transition-all duration-500 group-hover:brightness-0 group-hover:invert"
                />
              </div>
            </div>
            <h2 className="mb-2 text-xl font-medium text-white">БК Гълъбово</h2>
            <p className="mb-8 flex-1 text-sm leading-relaxed text-zinc-500">
              Официален сайт на Бадминтон клуб Гълъбово — турнири, ранглиста,
              разписание и членство.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/club"
                className="group/btn flex items-center justify-between rounded-xl bg-zinc-800 px-4 py-3 text-sm font-medium text-white transition-all duration-300 hover:bg-blue-600"
              >
                <span>Виж повече</span>
                <ChevronRight
                  size={16}
                  className="transition-transform group-hover/btn:translate-x-1"
                />
              </Link>
            </div>
          </div>

          {/* Recovery Zone */}
          <div
            className="group relative flex flex-col rounded-3xl border border-zinc-800 bg-zinc-900 p-8 transition-all duration-500 hover:-translate-y-1 hover:border-emerald-600/50 hover:bg-zinc-900/80 hover:shadow-2xl hover:shadow-emerald-900/20"
            onMouseEnter={() => setHovered("recovery")}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-linear-to-br from-emerald-600/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="relative mb-6 size-14">
              <div className="absolute inset-0 rounded-2xl border border-emerald-600/20 bg-emerald-600/10 transition-all duration-500 group-hover:bg-emerald-500" />
              <div className="absolute inset-0 flex items-center justify-center p-2">
                <Image
                  src="/1.png"
                  alt="Recovery Zone Logo"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-contain p-2 transition-all duration-500 group-hover:brightness-0 group-hover:invert"
                />
              </div>
            </div>
            <h2 className="mb-2 text-xl font-medium text-white">
              Recovery Zone
            </h2>
            <p className="mb-8 flex-1 text-sm leading-relaxed text-zinc-500">
              Център за професионален лимфен дренаж с Hyperice Normatec 3.
              Ускорено възстановяване и релакс.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/recovery-zone"
                className="group/btn flex items-center justify-between rounded-xl bg-zinc-800 px-4 py-3 text-sm font-medium text-white transition-all duration-300 hover:bg-emerald-500"
              >
                <span>Виж повече</span>
                <ChevronRight
                  size={16}
                  className="transition-transform group-hover/btn:translate-x-1"
                />
              </Link>
            </div>
          </div>

          {/* Admin */}
          <div
            className="group relative flex flex-col rounded-3xl border border-dashed border-zinc-800/50 bg-zinc-900/50 p-8 transition-all duration-500 hover:-translate-y-1 hover:border-zinc-600"
            onMouseEnter={() => setHovered("admin")}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="mb-6 flex size-14 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-800/80 text-zinc-500 transition-all duration-500 group-hover:bg-zinc-700 group-hover:text-zinc-300">
              <Lock size={24} strokeWidth={1.5} />
            </div>
            <h2 className="mb-2 text-xl font-medium text-zinc-400">
              Администратор
            </h2>
            <p className="mb-8 flex-1 text-sm leading-relaxed text-zinc-600">
              Системен вход за администратори и екипа на обектите.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/login"
                className="group/btn flex items-center justify-between rounded-xl bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-300 transition-all duration-300 hover:bg-zinc-700 hover:text-white"
              >
                <span>Влез в системата</span>
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover/btn:translate-x-1"
                />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex items-center justify-between border-t border-white/5 px-8 py-6">
        <span className="text-[10px] font-medium tracking-[0.3em] text-zinc-700 uppercase">
          © {new Date().getFullYear()} BK Galabovo & Recovery Zone by ZM
        </span>
        <span className="text-[10px] tracking-widest text-zinc-700 uppercase">
          Гълъбово
        </span>
      </footer>
    </div>
  );
}
