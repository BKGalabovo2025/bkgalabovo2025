"use client";

import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import { RankingEntry } from "@/types/ranking.types";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Trophy,
  TrendingUp,
  Star,
  Users,
  Award,
  Calendar,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { BentoCard } from "@/components/ui/bento-card";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";
import ShareStoryDialog from "@/components/rankings/ShareStoryDialog";
import { refreshRankingsAction } from "@/lib/actions/rankings";

const CATEGORY_TABS = [
  { id: "all", label: "Общо" },
  { id: "singles", label: "Единично" },
  { id: "doubles", label: "Двойки" },
  { id: "mixed", label: "Смесени" },
];

function getMedalEmoji(position: number): string {
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  if (position === 3) return "🥉";
  return `${position}.`;
}

function getWinRateColor(winRate: number): string {
  if (winRate > 70) return "bg-emerald-400";
  if (winRate > 40) return "bg-yellow-400";
  return "bg-rose-400";
}

function getPositionBadgeClasses(position: number): string {
  if (position === 1) return "bg-yellow-500 text-white";
  if (position === 2) return "bg-zinc-400 text-white";
  if (position === 3) return "bg-orange-400 text-white";
  return "bg-zinc-100 text-zinc-600";
}

interface RankingsClientProps {
  initialRankings: RankingEntry[];
}

export default function RankingsClient({
  initialRankings,
}: RankingsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("all");
  const [isPending, startTransition] = useTransition();
  const [rankings, setRankings] = useState<RankingEntry[]>(initialRankings);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);
  const period = searchParams.get("period") || "all";
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const { rankings: fresh, updatedAt } =
        await refreshRankingsAction(period);
      setRankings(fresh);
      setLastUpdated(new Date(updatedAt));
      setSecondsAgo(0);
    } catch {
      // silently ignore refresh errors
    }
  }, [period]);

  // 60-second auto-refresh
  useEffect(() => {
    intervalRef.current = setInterval(refresh, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh]);

  // "X seconds ago" clock
  useEffect(() => {
    clockRef.current = setInterval(() => {
      setSecondsAgo((s) => s + 1);
    }, 1000);
    return () => {
      if (clockRef.current) clearInterval(clockRef.current);
    };
  }, [lastUpdated]);

  const handlePeriodChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("period");
    } else {
      params.set("period", value);
    }

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const filteredRankings = (() => {
    if (activeTab === "all") return rankings;

    const catLabel =
      {
        singles: "Единично",
        doubles: "Двойки",
        mixed: "Смесени",
      }[activeTab as "singles" | "doubles" | "mixed"] || "Смесени";

    return initialRankings
      .map((r) => {
        const cat = r.categoryBreakdown.find((c) => c.category === catLabel);
        if (!cat) return null;
        return { ...r, totalPoints: cat.points, tournamentsPlayed: cat.played };
      })
      .filter(Boolean)
      .sort((a, b) => (b?.totalPoints ?? 0) - (a?.totalPoints ?? 0))
      .map((r, idx) => ({ ...r!, position: idx + 1 })) as RankingEntry[];
  })();

  const topThree = filteredRankings.slice(0, 3);

  const liveIndicator = (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
        {secondsAgo < 5 ? "Опреснено сега" : `Преди ${secondsAgo}с`}
      </span>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {isPending && (
        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-50 flex items-center justify-center backdrop-blur-[1px] rounded-2xl">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      <PageHeader
        title="Ранглиста"
        description="Глобално класиране по натрупани точки от всички официални турнири."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Ранглиста" },
        ]}
      >
        <div className="flex flex-wrap items-center gap-3">
          {liveIndicator}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <Select value={period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-full md:w-[220px] rounded-xl border-slate-200 bg-white shadow-sm">
                <SelectValue placeholder="Период" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всички турнири</SelectItem>
                <SelectItem value="year">Текуща година (2026)</SelectItem>
                <SelectItem value="h1">Първо полугодие</SelectItem>
                <SelectItem value="h2">Второ полугодие</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ShareStoryDialog topThree={topThree} />
        </div>
      </PageHeader>

      {initialRankings.length === 0 ? (
        <BentoCard className="py-24 text-center">
          <Award className="h-16 w-16 mx-auto mb-4 opacity-10" />
          <p className="text-lg font-medium text-slate-400 uppercase tracking-widest">
            Няма намерени данни за избрания период.
          </p>
        </BentoCard>
      ) : (
        <>
          {/* Top 3 Podium Bento */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            {/* Stats Col */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-4 h-full">
              <BentoCard className="p-5 bg-white border-zinc-100 flex flex-col justify-between">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-light tracking-tight">
                    {initialRankings.length}
                  </p>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] mt-1">
                    Играчи
                  </p>
                </div>
              </BentoCard>
              <BentoCard className="p-5 bg-white border-zinc-100 flex flex-col justify-between">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-2xl font-light tracking-tight">
                    {initialRankings[0]?.totalPoints ?? 0}
                  </p>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] mt-1">
                    Макс. точки
                  </p>
                </div>
              </BentoCard>
              <BentoCard className="p-5 bg-white border-zinc-100 flex flex-col justify-between">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-light tracking-tight">
                    {initialRankings.reduce(
                      (s, r) => s + r.tournamentsPlayed,
                      0
                    )}
                  </p>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] mt-1">
                    Участия
                  </p>
                </div>
              </BentoCard>
              <BentoCard className="p-5 bg-white border-zinc-100 flex flex-col justify-between">
                <Star className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-light tracking-tight">
                    {initialRankings.reduce((s, r) => s + r.wins, 0)}
                  </p>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] mt-1">
                    Победи
                  </p>
                </div>
              </BentoCard>
            </div>

            {/* Podium Col */}
            <BentoCard className="lg:col-span-8 p-8 bg-white border-zinc-100 h-full flex flex-col justify-center">
              <div className="flex items-end justify-center gap-4 md:gap-8 pb-4">
                {/* 2nd Place */}
                {topThree[1] && (
                  <div className="flex flex-col items-center w-1/3">
                    <div className="text-3xl mb-4 grayscale opacity-50">🥈</div>
                    <div className="w-full bg-zinc-50 rounded-2xl p-4 text-center border border-zinc-100">
                      <p className="text-[11px] uppercase tracking-widest text-zinc-400 mb-2 truncate px-2">
                        {topThree[1].memberName}
                      </p>
                      <p className="text-3xl font-light tracking-tighter text-zinc-950">
                        {topThree[1].totalPoints}
                      </p>
                      <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-400 mt-1">
                        точки
                      </p>
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {topThree[0] && (
                  <div className="flex flex-col items-center w-1/3 mb-6">
                    <div className="text-4xl mb-4">🥇</div>
                    <div className="w-full bg-white rounded-2xl p-6 text-center border border-yellow-200 shadow-sm ring-8 ring-yellow-50/50">
                      <p className="text-[12px] uppercase tracking-[0.2em] text-zinc-900 mb-2 truncate px-2">
                        {topThree[0].memberName}
                      </p>
                      <p className="text-4xl font-light tracking-tighter text-yellow-600">
                        {topThree[0].totalPoints}
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.4em] text-yellow-600/60 mt-1">
                        точки
                      </p>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                  <div className="flex flex-col items-center w-1/3">
                    <div className="text-3xl mb-4 grayscale opacity-30">🥉</div>
                    <div className="w-full bg-zinc-50 rounded-2xl p-4 text-center border border-zinc-100">
                      <p className="text-[11px] uppercase tracking-widest text-zinc-400 mb-2 truncate px-2">
                        {topThree[2].memberName}
                      </p>
                      <p className="text-3xl font-light tracking-tighter text-zinc-950">
                        {topThree[2].totalPoints}
                      </p>
                      <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-400 mt-1">
                        точки
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </BentoCard>
          </div>

          {/* Full List Bento */}
          <BentoCard className="overflow-hidden">
            <div className="p-8 border-b border-zinc-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-[14px] uppercase tracking-[0.3em] text-zinc-400">
                  Пълно класиране
                </h3>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="bg-zinc-50 border border-zinc-100 rounded-xl p-1 h-11">
                    {CATEGORY_TABS.map((tab) => (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="rounded-lg text-[10px] uppercase tracking-widest px-6 data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm"
                      >
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-50/50">
                  <TableRow className="hover:bg-transparent border-zinc-100 h-14">
                    <TableHead className="w-16 text-center text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                      №
                    </TableHead>
                    <TableHead className="min-w-[200px] text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                      Играч
                    </TableHead>
                    <TableHead className="text-center text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                      Турнири
                    </TableHead>
                    <TableHead className="text-center text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                      Победи
                    </TableHead>
                    <TableHead className="text-center text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                      Загуби
                    </TableHead>
                    <TableHead className="text-center text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                      Успех
                    </TableHead>
                    <TableHead className="text-right pr-8 text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                      Точки
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRankings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-64 text-center">
                        <p className="text-[12px] uppercase tracking-widest text-zinc-300">
                          Няма данни за тази категория
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRankings.map((entry) => {
                      const winRate =
                        entry.wins + entry.losses > 0
                          ? Math.round(
                              (entry.wins / (entry.wins + entry.losses)) * 100
                            )
                          : 0;

                      return (
                        <TableRow
                          key={entry.memberId}
                          className="group hover:bg-zinc-50/50 transition-colors border-zinc-50 h-20"
                        >
                          <TableCell className="text-center text-xl font-light">
                            {getMedalEmoji(entry.position)}
                          </TableCell>
                          <TableCell>
                            <div className="text-[14px] font-medium text-zinc-900">
                              {entry.memberName}
                            </div>
                            {activeTab === "all" &&
                              entry.categoryBreakdown.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {entry.categoryBreakdown.map(
                                    (c: { category: string }) => (
                                      <Badge
                                        key={c.category}
                                        variant="secondary"
                                        className="text-[9px] px-2 py-0.5 rounded-full font-medium uppercase tracking-widest bg-zinc-100 text-zinc-500 border-none"
                                      >
                                        {c.category}
                                      </Badge>
                                    )
                                  )}
                                </div>
                              )}
                          </TableCell>
                          <TableCell className="text-center text-sm text-zinc-600">
                            {entry.tournamentsPlayed}
                          </TableCell>
                          <TableCell className="text-center text-sm text-emerald-600">
                            {entry.wins}
                          </TableCell>
                          <TableCell className="text-center text-sm text-rose-500">
                            {entry.losses}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-3">
                              <div className="w-20 h-1 rounded-full bg-zinc-100 overflow-hidden hidden md:block">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    getWinRateColor(winRate)
                                  )}
                                  style={{ width: `${winRate}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-medium text-zinc-400 tabular-nums">
                                {winRate}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            <Badge
                              className={cn(
                                "font-medium text-[13px] px-4 py-1.5 rounded-full border-none min-w-[60px] justify-center tabular-nums",
                                getPositionBadgeClasses(entry.position)
                              )}
                            >
                              {entry.totalPoints}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </BentoCard>

          {/* Points System Bento */}
          <BentoCard className="p-8 bg-zinc-950 text-white border-none">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="shrink-0">
                <h4 className="text-[12px] uppercase tracking-[0.4em] text-zinc-500 mb-3 flex items-center gap-3">
                  <Award className="h-4 w-4" /> Система за точки
                </h4>
                <p className="text-xl font-light text-zinc-300">
                  Как се формира официалната
                  <br />
                  ранглиста на клуба
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 flex-1">
                {[
                  { pos: "🥇", pts: 100 },
                  { pos: "🥈", pts: 70 },
                  { pos: "🥉", pts: 50 },
                  { pos: "4-то", pts: 35 },
                  { pos: "5-то", pts: 20 },
                  { pos: "6-то", pts: 15 },
                  { pos: "7-мо", pts: 10 },
                  { pos: "Участие", pts: 3 },
                ].map(({ pos, pts }) => (
                  <div
                    key={pos}
                    className="bg-white/5 rounded-2xl p-4 border border-white/5 text-center flex flex-col items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <span className="text-xl mb-2">{pos}</span>
                    <span className="text-2xl font-light text-zinc-100 tracking-tighter">
                      {pts}
                    </span>
                    <span className="text-[8px] uppercase tracking-widest text-zinc-500 mt-1">
                      точки
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </BentoCard>
        </>
      )}
    </div>
  );
}
