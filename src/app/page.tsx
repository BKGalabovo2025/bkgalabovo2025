"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import {
  Trophy,
  ShieldCheck,
  Activity,
  ArrowRight,
  Medal,
  Calendar,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import {
  computeGlobalRankings,
  RankingEntry,
} from "@/services/ranking-service";
import { tournamentService } from "@/services/tournament-service";
import { Tournament } from "@/types/tournament.types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();

  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchPublicData() {
      try {
        const [rankData, tourData] = await Promise.all([
          computeGlobalRankings(),
          tournamentService.getTournaments(),
        ]);
        setRankings(rankData.slice(0, 5));
        setTournaments(
          tourData.filter((t) => t.status === "upcoming").slice(0, 3)
        );
      } catch (error) {
        console.error("Error fetching public data:", error);
      } finally {
        setDataLoading(false);
      }
    }
    fetchPublicData();
  }, []);

  if (authLoading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-6 animate-pulse">
          <div className="h-16 w-16 bg-blue-600 rounded-[24px] flex items-center justify-center text-white shadow-2xl shadow-blue-200">
            <Trophy size={32} />
          </div>
          <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">
            {language === "bg" ? "Проверка на сесия..." : "Checking session..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Blurs */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100/40 rounded-full blur-[140px] -mr-96 -mt-96" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-indigo-100/40 rounded-full blur-[140px] -ml-96 -mb-96" />

      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10 animate-in fade-in zoom-in-95 duration-1000">
        {/* Language Switcher Positioned Top Right */}
        <div className="absolute -top-6 right-0 z-50">
          <LanguageSwitcher />
        </div>

        {/* Hero Card */}
        <BentoCard className="md:col-span-12 p-16 bg-white flex flex-col items-center text-center space-y-8 overflow-hidden relative border-none shadow-2xl shadow-blue-900/5 rounded-[48px]">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-50 to-transparent rounded-full blur-3xl -mr-32 -mt-32 opacity-40" />

          <div className="h-24 w-24 bg-blue-600 rounded-[32px] flex items-center justify-center text-white shadow-2xl shadow-blue-200 relative z-10 mb-2 transform -rotate-6 transition-transform hover:rotate-0 duration-500 cursor-pointer">
            <Trophy size={48} />
          </div>

          <div className="relative z-10 space-y-4 max-w-2xl">
            <h1 className="text-6xl font-black tracking-tight text-slate-900 font-bento uppercase leading-[0.9]">
              {t("club.name")}
            </h1>
            <p className="text-slate-400 font-bold tracking-[0.3em] uppercase text-xs">
              {t("club.subtitle")}
            </p>
          </div>

          <div className="flex gap-4 pt-4 relative z-10">
            <Link href="/login">
              <Button
                size="lg"
                className="h-16 px-10 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95"
              >
                {t("admin.login")} <ArrowRight size={18} className="ml-3" />
              </Button>
            </Link>
          </div>
        </BentoCard>

        {/* Public Ranking */}
        <BentoCard className="md:col-span-5 p-10 bg-white border-none shadow-xl rounded-[40px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
                <Medal size={24} />
              </div>
              <h2 className="text-2xl font-black font-bento text-slate-900 uppercase tracking-tighter">
                {t("public.ranking")}
              </h2>
            </div>
            <Link
              href="#"
              className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
            >
              Пълен списък
            </Link>
          </div>

          <div className="space-y-4 flex-1">
            {dataLoading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <Skeleton
                  key={i}
                  className="h-14 w-full rounded-2xl bg-slate-50"
                />
              ))
            ) : rankings.length > 0 ? (
              rankings.map((player, idx) => (
                <div
                  key={player.memberId}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border transition-all hover:scale-[1.02]",
                    idx === 0
                      ? "bg-amber-50/50 border-amber-100 shadow-sm"
                      : "bg-slate-50/50 border-slate-100"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        "font-black text-lg w-6 text-center",
                        idx === 0 ? "text-amber-500" : "text-slate-300"
                      )}
                    >
                      {player.position}
                    </span>
                    <span className="font-black text-sm text-slate-700">
                      {player.memberName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-blue-600 text-xs">
                      {player.totalPoints}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      pts
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 opacity-30">
                <Activity size={40} className="text-slate-300 mb-2" />
                <p className="text-xs font-black uppercase tracking-widest">
                  {t("public.no_data")}
                </p>
              </div>
            )}
          </div>
        </BentoCard>

        {/* Info & CTA Column */}
        <div className="md:col-span-7 grid grid-cols-1 gap-6">
          {/* Upcoming Tournaments */}
          <BentoCard className="p-10 bg-white border-none shadow-xl rounded-[40px]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <Calendar size={24} />
                </div>
                <h2 className="text-2xl font-black font-bento text-slate-900 uppercase tracking-tighter">
                  {t("public.tournaments")}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {dataLoading ? (
                [1, 2].map((i) => (
                  <Skeleton
                    key={i}
                    className="h-24 w-full rounded-2xl bg-slate-50"
                  />
                ))
              ) : tournaments.length > 0 ? (
                tournaments.map((tour) => (
                  <div
                    key={tour.id}
                    className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 group cursor-pointer hover:bg-slate-900 hover:text-white transition-all duration-500"
                  >
                    <p className="font-black text-sm truncate mb-2">
                      {tour.title}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                        {new Date(tour.startDate).toLocaleDateString(
                          language === "bg" ? "bg-BG" : "en-US",
                          { day: "numeric", month: "short" }
                        )}
                      </p>
                      <ChevronRight
                        size={16}
                        className="text-blue-600 group-hover:text-white group-hover:translate-x-1 transition-all"
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="sm:col-span-2 flex flex-col items-center justify-center py-8 opacity-30">
                  <p className="text-xs font-black uppercase tracking-widest">
                    {t("public.no_data")}
                  </p>
                </div>
              )}
            </div>
          </BentoCard>

          {/* System Status */}
          <BentoCard className="p-8 bg-slate-900 text-white border-none shadow-2xl rounded-[40px] relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="absolute top-0 right-0 p-12 opacity-10 -mr-8 -mt-8">
              <ShieldCheck size={160} />
            </div>

            <div className="flex items-center gap-6 relative z-10">
              <div className="h-16 w-16 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/10">
                <Activity size={32} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-black font-bento uppercase tracking-tight mb-1">
                  {t("status.title")}
                </h3>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">
                    {t("status.online")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 relative z-10 w-full sm:w-auto">
              <div className="flex-1 sm:w-32 text-center p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                  Членове
                </p>
                <p className="text-lg font-black tracking-tighter">ACTIVE</p>
              </div>
              <div className="flex-1 sm:w-32 text-center p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                  Финанси
                </p>
                <p className="text-lg font-black tracking-tighter">STABLE</p>
              </div>
            </div>
          </BentoCard>
        </div>

        {/* Footer info */}
        <div className="md:col-span-12 flex flex-col md:flex-row items-center justify-between px-8 py-4 text-slate-400">
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">
            © 2024 BK GALABOVO • EXCELLENCE IN BADMINTON
          </span>
          <div className="flex gap-8 mt-4 md:mt-0">
            <Link
              href="#"
              className="text-[10px] font-black uppercase tracking-widest hover:text-slate-900 transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="#"
              className="text-[10px] font-black uppercase tracking-widest hover:text-slate-900 transition-colors"
            >
              Contact
            </Link>
            <Link
              href="#"
              className="text-[10px] font-black uppercase tracking-widest hover:text-slate-900 transition-colors"
            >
              Instagram
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
