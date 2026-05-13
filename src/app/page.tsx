"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  Trophy,
  ArrowRight,
  ShieldCheck,
  Lock,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [hovered, setHovered] = useState<"bk" | "recovery" | "admin" | null>(
    null
  );

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  if (authLoading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="flex flex-col items-center gap-6 animate-pulse">
          <div className="h-16 w-16 bg-zinc-800 rounded-3xl flex items-center justify-center text-white border border-zinc-700">
            <Trophy size={32} strokeWidth={1.5} />
          </div>
          <p className="text-zinc-500 font-medium uppercase tracking-[0.3em] text-[10px]">
            Зареждане...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col relative overflow-hidden">
      {/* Ambient background blobs */}
      <div
        className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] transition-all duration-1000 pointer-events-none"
        style={{
          background:
            hovered === "bk"
              ? "rgba(37,99,235,0.15)"
              : hovered === "recovery"
                ? "rgba(16,185,129,0.08)"
                : "rgba(255,255,255,0.03)",
        }}
      />
      <div
        className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] transition-all duration-1000 pointer-events-none"
        style={{
          background:
            hovered === "recovery"
              ? "rgba(16,185,129,0.18)"
              : hovered === "bk"
                ? "rgba(37,99,235,0.08)"
                : "rgba(255,255,255,0.03)",
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <ShieldCheck size={20} className="text-zinc-500" strokeWidth={1.5} />
          <span className="text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-500">
            Sports & Recovery Portal
          </span>
        </div>
        <div className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest">
          2025
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 relative z-10">
        {/* Tagline */}
        <p className="text-[11px] font-medium uppercase tracking-[0.4em] text-zinc-600 mb-6">
          Добре дошли
        </p>
        <h1 className="text-5xl md:text-7xl font-light tracking-tight text-white text-center max-w-3xl leading-[1.05] mb-4">
          Изберете
          <br />
          <span className="text-zinc-500">своя портал</span>
        </h1>
        <p className="text-zinc-600 text-center text-sm max-w-md mb-20">
          Два проекта, едно управление. Изберете за кой обект искате да научите
          повече или да влезете.
        </p>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-5xl">
          {/* BK Galabovo */}
          <div
            className="group relative bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col transition-all duration-500 hover:border-blue-600/50 hover:bg-zinc-900/80 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/20"
            onMouseEnter={() => setHovered("bk")}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="h-14 w-14 relative mb-6">
              <div className="absolute inset-0 bg-blue-600/10 border border-blue-600/20 rounded-2xl transition-all group-hover:bg-blue-600 duration-500" />
              <div className="absolute inset-0 flex items-center justify-center p-2">
                <Image
                  src="/logo.png"
                  alt="BK Galabovo Logo"
                  fill
                  className="object-contain transition-all group-hover:brightness-0 group-hover:invert duration-500 p-2"
                />
              </div>
            </div>
            <h2 className="text-xl font-medium text-white mb-2">БК Гълъбово</h2>
            <p className="text-zinc-500 text-sm leading-relaxed mb-8 flex-1">
              Официален сайт на Бадминтон клуб Гълъбово — турнири, ранглиста,
              разписание и членство.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/club"
                className="flex items-center justify-between px-4 py-3 bg-zinc-800 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-all duration-300 group/btn"
              >
                <span>Виж повече</span>
                <ChevronRight
                  size={16}
                  className="group-hover/btn:translate-x-1 transition-transform"
                />
              </Link>
            </div>
          </div>

          {/* Recovery Zone */}
          <div
            className="group relative bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col transition-all duration-500 hover:border-emerald-600/50 hover:bg-zinc-900/80 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-900/20"
            onMouseEnter={() => setHovered("recovery")}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-emerald-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="h-14 w-14 relative mb-6">
              <div className="absolute inset-0 bg-emerald-600/10 border border-emerald-600/20 rounded-2xl transition-all group-hover:bg-emerald-500 duration-500" />
              <div className="absolute inset-0 flex items-center justify-center p-2">
                <Image
                  src="/1.png"
                  alt="Recovery Zone Logo"
                  fill
                  className="object-contain transition-all group-hover:brightness-0 group-hover:invert duration-500 p-2"
                />
              </div>
            </div>
            <h2 className="text-xl font-medium text-white mb-2">
              Recovery Zone
            </h2>
            <p className="text-zinc-500 text-sm leading-relaxed mb-8 flex-1">
              Център за професионален лимфен дренаж с Hyperice Normatec 3.
              Ускорено възстановяване и релакс.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/recovery-zone"
                className="flex items-center justify-between px-4 py-3 bg-zinc-800 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-all duration-300 group/btn"
              >
                <span>Виж повече</span>
                <ChevronRight
                  size={16}
                  className="group-hover/btn:translate-x-1 transition-transform"
                />
              </Link>
            </div>
          </div>

          {/* Admin */}
          <div
            className="group relative bg-zinc-900/50 border border-zinc-800/50 border-dashed rounded-3xl p-8 flex flex-col transition-all duration-500 hover:border-zinc-600 hover:-translate-y-1"
            onMouseEnter={() => setHovered("admin")}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="h-14 w-14 bg-zinc-800/80 border border-zinc-700 rounded-2xl flex items-center justify-center text-zinc-500 mb-6 transition-all group-hover:bg-zinc-700 group-hover:text-zinc-300 duration-500">
              <Lock size={24} strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-medium text-zinc-400 mb-2">
              Администратор
            </h2>
            <p className="text-zinc-600 text-sm leading-relaxed mb-8 flex-1">
              Вход за управление на двата проекта — членове, финанси, резервации
              и настройки.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/login"
                className="flex items-center justify-between px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-sm font-medium transition-all duration-300 group/btn"
              >
                <span>Влез в системата</span>
                <ArrowRight
                  size={16}
                  className="group-hover/btn:translate-x-1 transition-transform"
                />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-6 border-t border-white/5 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-zinc-700">
          © {new Date().getFullYear()} BK Galabovo & Recovery Zone by ZM
        </span>
        <span className="text-[10px] text-zinc-700 uppercase tracking-widest">
          Sofia & Galabovo
        </span>
      </footer>
    </div>
  );
}
