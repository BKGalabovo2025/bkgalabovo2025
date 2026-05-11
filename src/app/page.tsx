"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Activity,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Zap
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [hovered, setHovered] = useState<"bk" | "recovery" | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  if (authLoading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50">
        <div className="flex flex-col items-center gap-6 animate-pulse">
          <div className="h-16 w-16 bg-zinc-950 rounded-4xl flex items-center justify-center text-white shadow-none border border-zinc-200">
            <Trophy size={32} strokeWidth={1.5} />
          </div>
          <p className="text-zinc-400 font-medium uppercase tracking-[0.3em] text-[10px]">
            Проверка на сесия...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Blurs */}
      <div 
        className={cn(
          "absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[140px] -mr-96 -mt-96 transition-opacity duration-700",
          hovered === "bk" ? "opacity-100" : "opacity-0"
        )} 
      />
      <div 
        className={cn(
          "absolute bottom-0 left-0 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[140px] -ml-96 -mb-96 transition-opacity duration-700",
          hovered === "recovery" ? "opacity-100" : "opacity-0"
        )} 
      />

      <div className="max-w-6xl w-full relative z-10 animate-in fade-in zoom-in-95 duration-1000">
        
        {/* Header / Logo Area */}
        <div className="flex justify-center mb-16">
          <div className="flex items-center gap-4 bg-white px-8 py-4 rounded-3xl shadow-sm border border-zinc-100">
            <ShieldCheck className="text-zinc-950" size={28} strokeWidth={1.5} />
            <div className="h-6 w-px bg-zinc-200" />
            <span className="font-bento uppercase tracking-widest text-sm text-zinc-950">Sports & Recovery Portal</span>
          </div>
        </div>

        {/* Main Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          
          {/* BK Galabovo Card */}
          <BentoCard 
            className="p-12 bg-white flex flex-col items-center text-center space-y-8 overflow-hidden relative border-zinc-100 shadow-xl shadow-zinc-200/20 rounded-[3rem] transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10 cursor-default group"
            onMouseEnter={() => setHovered("bk")}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-40 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="h-28 w-28 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-none relative z-10 mb-2 transform -rotate-6 transition-transform group-hover:rotate-0 group-hover:scale-110 duration-500">
              <Trophy size={48} strokeWidth={1.5} />
            </div>

            <div className="relative z-10 space-y-4 max-w-sm">
              <h2 className="text-4xl font-light tracking-tight text-zinc-950 font-bento uppercase leading-[1.1]">
                БК Гълъбово
              </h2>
              <p className="text-zinc-500 font-medium tracking-wide text-sm">
                Официален портал на бадминтон клуб Гълъбово.
              </p>
            </div>

            <div className="flex gap-4 pt-6 relative z-10 w-full">
              <Link href="/login" className="w-full">
                <Button
                  size="lg"
                  className="w-full h-14 rounded-2xl bg-zinc-950 text-white font-medium uppercase tracking-[0.2em] text-[11px] hover:bg-blue-600 transition-all active:scale-95 border-none"
                >
                  Вход за клуб <ChevronRight size={18} className="ml-2" />
                </Button>
              </Link>
            </div>
          </BentoCard>

          {/* Recovery Zone Card */}
          <BentoCard 
            className="p-12 bg-white flex flex-col items-center text-center space-y-8 overflow-hidden relative border-zinc-100 shadow-xl shadow-zinc-200/20 rounded-[3rem] transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/10 cursor-default group"
            onMouseEnter={() => setHovered("recovery")}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-40 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="h-28 w-28 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-white shadow-none relative z-10 mb-2 transform rotate-6 transition-transform group-hover:rotate-0 group-hover:scale-110 duration-500">
              <Activity size={48} strokeWidth={1.5} />
            </div>

            <div className="relative z-10 space-y-4 max-w-sm">
              <h2 className="text-4xl font-light tracking-tight text-zinc-950 font-bento uppercase leading-[1.1]">
                Recovery Zone
              </h2>
              <p className="text-zinc-500 font-medium tracking-wide text-sm">
                Център за професионално възстановяване и релакс.
              </p>
            </div>

            <div className="flex gap-4 pt-6 relative z-10 w-full">
              <Link href="/login" className="w-full">
                <Button
                  size="lg"
                  className="w-full h-14 rounded-2xl bg-zinc-950 text-white font-medium uppercase tracking-[0.2em] text-[11px] hover:bg-emerald-500 transition-all active:scale-95 border-none"
                >
                  Вход за зоната <ChevronRight size={18} className="ml-2" />
                </Button>
              </Link>
            </div>
          </BentoCard>

        </div>

        {/* Footer info */}
        <div className="mt-16 flex flex-col items-center justify-center text-zinc-400 gap-4">
          <div className="flex items-center gap-2 opacity-50">
            <Zap size={16} />
            <span className="text-[10px] font-medium uppercase tracking-[0.3em]">
              Unified Management System
            </span>
          </div>
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] opacity-40">
            © {new Date().getFullYear()} BK GALABOVO & RECOVERY ZONE
          </span>
        </div>
      </div>
    </div>
  );
}
