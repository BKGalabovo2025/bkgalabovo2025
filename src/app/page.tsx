"use client";

import { motion, Variants } from "framer-motion";
import { ChevronRight, Lock, ShieldCheck, Trophy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { GoogleTranslateWidget } from "@/components/shared/GoogleTranslateWidget";
import { useAuth } from "@/context/auth-context";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [hovered, setHovered] = useState<"bk" | "recovery" | null>(null);

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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-zinc-950 text-white selection:bg-zinc-800">
      {/* Background Grid Pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] bg-[size:32px_32px]" />

      {/* Ambient background blobs */}
      <div
        className="pointer-events-none absolute top-[-20%] left-[-10%] size-[600px] rounded-full blur-[120px] transition-all duration-1000"
        // eslint-disable-next-line react/forbid-dom-props
        style={{ background: getBlobColor1(hovered) }}
      />
      <div
        className="pointer-events-none absolute right-[-10%] bottom-[-20%] size-[600px] rounded-full blur-[120px] transition-all duration-1000"
        // eslint-disable-next-line react/forbid-dom-props
        style={{ background: getBlobColor2(hovered) }}
      />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center justify-between gap-4 border-b border-white/5 px-8 py-6 md:flex-row md:gap-0"
      >
        <div className="flex items-center gap-3">
          <ShieldCheck size={20} className="text-zinc-500" strokeWidth={1.5} />
          <span className="text-[11px] font-medium tracking-[0.3em] text-zinc-400 uppercase">
            Официален Портал
          </span>
        </div>
        <div className="flex flex-col items-center gap-6 md:flex-row">
          <div className="text-center text-[10px] font-medium tracking-widest text-zinc-500 uppercase md:text-right">
            Бадминтон клуб Гълъбово{" "}
            <span className="text-zinc-700">(от 2014 г.)</span>
            <span className="mx-2 hidden text-zinc-700 md:inline">•</span>
            <br className="md:hidden" />
            Recovery Zone by ZM{" "}
            <span className="text-zinc-700">(от 2026 г.)</span>
          </div>

          <div className="hidden h-6 w-px bg-zinc-800 md:block" />

          <GoogleTranslateWidget />

          <Link
            href="/login"
            className="group flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-[10px] font-medium tracking-widest text-zinc-400 uppercase transition-all hover:border-zinc-600 hover:text-white"
          >
            <Lock
              size={12}
              strokeWidth={2}
              className="transition-transform group-hover:scale-110"
            />
            <span>Админ</span>
          </Link>
        </div>
      </motion.header>

      {/* Main */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex w-full flex-col items-center"
        >
          {/* Tagline */}
          <motion.h1
            variants={itemVariants}
            className="leading-1.05 mt-8 mb-4 max-w-3xl text-center text-5xl font-light tracking-tight text-white md:text-7xl"
          >
            Изберете
            <br />
            <span className="text-zinc-500">своя портал</span>
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="mb-20 max-w-md text-center text-sm text-zinc-600"
          >
            Добре дошли! Изберете за кой обект искате да научите повече или да
            запазите своя час.
          </motion.p>

          {/* Cards Grid */}
          <div className="grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
            {/* BK Galabovo */}
            <motion.div
              variants={itemVariants}
              className="group relative flex flex-col rounded-3xl border border-zinc-800 bg-zinc-900/80 p-10 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:border-blue-600/50 hover:bg-zinc-900 hover:shadow-2xl hover:shadow-blue-900/20"
              onMouseEnter={() => setHovered("bk")}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative mb-8 size-20 overflow-hidden rounded-full drop-shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                <Image
                  src="/icons/LOGO.jpg"
                  alt="Бадминтон Клуб Гълъбово Logo"
                  fill
                  sizes="80px"
                  className="object-contain transition-all duration-500 group-hover:scale-105"
                  priority={true}
                />
              </div>
              <h2 className="mb-3 text-2xl font-medium text-white">
                Бадминтон клуб Гълъбово
              </h2>
              <p className="mb-10 flex-1 text-sm leading-relaxed text-zinc-400">
                Официален сайт на клуба. Запознайте се с нашите турнири,
                ранглиста, спортен календар и възможности за членство.
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  href="/club"
                  className="group/btn flex items-center justify-between rounded-xl bg-zinc-800 px-5 py-4 text-sm font-medium text-white transition-all duration-300 hover:bg-blue-600"
                >
                  <span>Към бадминтон клуба</span>
                  <ChevronRight
                    size={18}
                    className="transition-transform group-hover/btn:translate-x-1"
                  />
                </Link>
              </div>
            </motion.div>

            {/* Recovery Zone */}
            <motion.div
              variants={itemVariants}
              className="group relative flex flex-col rounded-3xl border border-zinc-800 bg-zinc-900/80 p-10 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:border-emerald-600/50 hover:bg-zinc-900 hover:shadow-2xl hover:shadow-emerald-900/20"
              onMouseEnter={() => setHovered("recovery")}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-600/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative mb-8 h-20 w-32 drop-shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <Image
                  src="/1.png"
                  alt="Recovery Zone by ZM Logo"
                  fill
                  sizes="128px"
                  className="rounded-2xl object-contain transition-all duration-500 group-hover:scale-105"
                  priority={true}
                />
              </div>
              <h2 className="mb-3 text-2xl font-medium text-white">
                Recovery Zone by ZM
              </h2>
              <p className="mb-10 flex-1 text-sm leading-relaxed text-zinc-400">
                Център за професионален лимфен дренаж с Hyperice Normatec 3.
                Ускорено възстановяване, релакс и подобряване на постиженията.
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  href="/recovery-zone"
                  className="group/btn flex items-center justify-between rounded-xl bg-zinc-800 px-5 py-4 text-sm font-medium text-white transition-all duration-300 hover:bg-emerald-500"
                >
                  <span>Към възстановителния център</span>
                  <ChevronRight
                    size={18}
                    className="transition-transform group-hover/btn:translate-x-1"
                  />
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1 }}
        className="relative z-10 flex flex-col items-center justify-between gap-4 border-t border-white/5 px-8 py-6 md:flex-row md:gap-0"
      >
        <span className="text-center text-[10px] font-medium tracking-[0.3em] text-zinc-600 uppercase md:text-left">
          © {new Date().getFullYear()} Бадминтон клуб Гълъбово & Recovery Zone
          by ZM
        </span>
        <span className="text-[10px] tracking-widest text-zinc-700 uppercase">
          Град Гълъбово
        </span>
      </motion.footer>
    </div>
  );
}
