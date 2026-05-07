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
import { computeGlobalRankings } from "@/services/ranking-service";
import { RankingEntry } from "@/types/ranking.types";
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
      <div className="flex items-center justify-center min-h-screen bg-zinc-50">
        <div className="flex flex-col items-center gap-6 animate-pulse">
          <div className="h-16 w-16 bg-zinc-950 rounded-[2rem] flex items-center justify-center text-white shadow-none border border-zinc-200">
            <Trophy size={32} strokeWidth={1.5} />
          </div>
          <p className="text-zinc-400 font-medium uppercase tracking-[0.3em] text-[10px]">
            {language === "bg" ? "Проверка на сесия..." : "Checking session..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Blurs */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-zinc-200/20 rounded-full blur-[140px] -mr-96 -mt-96" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-zinc-200/20 rounded-full blur-[140px] -ml-96 -mb-96" />

      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10 animate-in fade-in zoom-in-95 duration-1000">
        {/* Language Switcher Positioned Top Right */}
        <div className="absolute -top-6 right-0 z-50">
          <LanguageSwitcher />
        </div>

        {/* Hero Card */}
        <BentoCard className="md:col-span-12 p-16 bg-white flex flex-col items-center text-center space-y-8 overflow-hidden relative border-zinc-100 shadow-none rounded-[2.5rem]">
          <div className="absolute top-0 right-0 w-80 h-80 bg-zinc-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-40" />

          <div className="h-24 w-24 bg-zinc-950 rounded-[2.5rem] flex items-center justify-center text-white shadow-none relative z-10 mb-2 transform -rotate-6 transition-transform hover:rotate-0 duration-500 cursor-pointer border border-zinc-800">
            <Trophy size={48} strokeWidth={1.5} />
          </div>

          <div className="relative z-10 space-y-4 max-w-2xl">
            <h1 className="text-6xl font-light tracking-tight text-zinc-950 font-bento uppercase leading-[0.9]">
              {t("club.name")}
            </h1>
            <p className="text-zinc-400 font-medium tracking-[0.4em] uppercase text-[11px]">
              {t("club.subtitle")}
            </p>
          </div>

          <div className="flex gap-4 pt-4 relative z-10">
            <Link href="/login">
              <Button
                size="lg"
                className="h-14 px-12 rounded-2xl bg-zinc-950 text-white font-medium uppercase tracking-[0.2em] text-[11px] hover:bg-zinc-900 transition-all active:scale-95 border-none"
              >
                {t("admin.login")}{" "}
                <ArrowRight size={18} className="ml-3" strokeWidth={1.5} />
              </Button>
            </Link>
          </div>
        </BentoCard>

        {/* Public Ranking */}
        <BentoCard className="md:col-span-5 p-10 bg-white border-zinc-100 shadow-none rounded-[2.5rem] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-zinc-50 text-zinc-950 rounded-2xl flex items-center justify-center border border-zinc-100">
                <Medal size={24} strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-light font-bento text-zinc-950 uppercase tracking-tighter">
                {t("public.ranking")}
              </h2>
            </div>
            <Link
              href="#"
              className="text-[10px] font-medium text-zinc-400 uppercase tracking-[0.2em] hover:text-zinc-950 transition-colors"
            >
              Пълен списък
            </Link>
          </div>

          <div className="space-y-4 flex-1">
            {dataLoading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <Skeleton
                  key={i}
                  className="h-14 w-full rounded-2xl bg-zinc-50"
                />
              ))
            ) : rankings.length > 0 ? (
              rankings.map((player, idx) => (
                <div
                  key={player.memberId}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border transition-all hover:bg-zinc-50",
                    idx === 0
                      ? "bg-zinc-50 border-zinc-200"
                      : "bg-white border-zinc-100"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        "font-medium text-lg w-6 text-center",
                        idx === 0 ? "text-zinc-950" : "text-zinc-300"
                      )}
                    >
                      {player.position}
                    </span>
                    <span className="font-medium text-sm text-zinc-800">
                      {player.memberName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-950 text-sm">
                      {player.totalPoints}
                    </span>
                    <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">
                      pts
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 opacity-30">
                <Activity
                  size={40}
                  className="text-zinc-300 mb-2"
                  strokeWidth={1}
                />
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                  {t("public.no_data")}
                </p>
              </div>
            )}
          </div>
        </BentoCard>

        {/* Info & CTA Column */}
        <div className="md:col-span-7 grid grid-cols-1 gap-6">
          {/* Upcoming Tournaments */}
          <BentoCard className="p-10 bg-white border-zinc-100 shadow-none rounded-[2.5rem]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-zinc-50 text-zinc-950 rounded-2xl flex items-center justify-center border border-zinc-100">
                  <Calendar size={24} strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-light font-bento text-zinc-950 uppercase tracking-tighter">
                  {t("public.tournaments")}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {dataLoading ? (
                [1, 2].map((i) => (
                  <Skeleton
                    key={i}
                    className="h-24 w-full rounded-2xl bg-zinc-50"
                  />
                ))
              ) : tournaments.length > 0 ? (
                tournaments.map((tour) => (
                  <div
                    key={tour.id}
                    className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100 group cursor-pointer hover:bg-zinc-950 hover:text-white transition-all duration-500"
                  >
                    <p className="font-medium text-sm truncate mb-2">
                      {tour.title}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-medium uppercase tracking-[0.2em] opacity-60">
                        {new Date(tour.startDate).toLocaleDateString(
                          language === "bg" ? "bg-BG" : "en-US",
                          { day: "numeric", month: "short" }
                        )}
                      </p>
                      <ChevronRight
                        size={16}
                        className="text-zinc-400 group-hover:text-white group-hover:translate-x-1 transition-all"
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="sm:col-span-2 flex flex-col items-center justify-center py-8 opacity-30">
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                    {t("public.no_data")}
                  </p>
                </div>
              )}
            </div>
          </BentoCard>

          {/* System Status */}
          <BentoCard className="p-8 bg-white border-zinc-100 shadow-none rounded-[2.5rem] relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] -mr-8 -mt-8 text-zinc-950 pointer-events-none">
              <ShieldCheck size={160} strokeWidth={1} />
            </div>

            <div className="flex items-center gap-6 relative z-10">
              <div className="h-16 w-16 bg-zinc-50 rounded-[1.5rem] flex items-center justify-center border border-zinc-100">
                <Activity
                  size={32}
                  className="text-zinc-400"
                  strokeWidth={1.5}
                />
              </div>
              <div>
                <h3 className="text-xl font-light font-bento uppercase tracking-tight mb-1 text-zinc-950">
                  {t("status.title")}
                </h3>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-zinc-400 rounded-full animate-pulse" />
                  <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-[0.2em]">
                    {t("status.online")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 relative z-10 w-full sm:w-auto">
              <div className="flex-1 sm:w-32 text-center p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-[0.2em] mb-1">
                  Членове
                </p>
                <p className="text-sm font-medium tracking-tight text-zinc-950">
                  ACTIVE
                </p>
              </div>
              <div className="flex-1 sm:w-32 text-center p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-[0.2em] mb-1">
                  Финанси
                </p>
                <p className="text-sm font-medium tracking-tight text-zinc-950">
                  STABLE
                </p>
              </div>
            </div>
          </BentoCard>
        </div>

        {/* Footer info */}
        <div className="md:col-span-12 flex flex-col md:flex-row items-center justify-between px-8 py-4 text-zinc-400">
          <span className="text-[10px] font-medium uppercase tracking-[0.3em]">
            © 2024 BK GALABOVO • EXCELLENCE IN BADMINTON
          </span>
          <div className="flex gap-8 mt-4 md:mt-0">
            <Link
              href="#"
              className="text-[10px] font-medium uppercase tracking-[0.2em] hover:text-zinc-950 transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="#"
              className="text-[10px] font-medium uppercase tracking-[0.2em] hover:text-zinc-950 transition-colors"
            >
              Contact
            </Link>
            <Link
              href="#"
              className="text-[10px] font-medium uppercase tracking-[0.2em] hover:text-zinc-950 transition-colors"
            >
              Instagram
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
