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
    <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
      <span className="text-[9px] font-bold tracking-widest text-emerald-600 uppercase dark:text-emerald-400">
        {secondsAgo < 5 ? "Опреснено сега" : `Преди ${secondsAgo}с`}
      </span>
    </div>
  );

  return (
    <div className="relative space-y-8 duration-500 animate-in fade-in">
      {isPending && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl bg-white/50 backdrop-blur-[1px] dark:bg-black/50">
          <Loader2 className="size-8 animate-spin text-primary" />
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
            <Calendar className="size-4 text-slate-400" />
            <Select value={period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-full rounded-xl border-slate-200 bg-white shadow-sm md:w-55">
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
          <Award className="mx-auto mb-4 size-16 opacity-10" />
          <p className="text-lg font-medium tracking-widest text-slate-400 uppercase">
            Няма намерени данни за избрания период.
          </p>
        </BentoCard>
      ) : (
        <>
          {/* Top 3 Podium Bento */}
          <div className="grid grid-cols-1 items-end gap-6 lg:grid-cols-12">
            {/* Stats Col */}
            <div className="grid h-full grid-cols-2 gap-4 lg:col-span-4">
              <BentoCard className="flex flex-col justify-between border-zinc-100 bg-white p-5">
                <Users className="size-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-light tracking-tight">
                    {initialRankings.length}
                  </p>
                  <p className="mt-1 text-[10px] tracking-[0.2em] text-zinc-400 uppercase">
                    Играчи
                  </p>
                </div>
              </BentoCard>
              <BentoCard className="flex flex-col justify-between border-zinc-100 bg-white p-5">
                <TrendingUp className="size-5 text-emerald-500" />
                <div>
                  <p className="text-2xl font-light tracking-tight">
                    {initialRankings[0]?.totalPoints ?? 0}
                  </p>
                  <p className="mt-1 text-[10px] tracking-[0.2em] text-zinc-400 uppercase">
                    Макс. точки
                  </p>
                </div>
              </BentoCard>
              <BentoCard className="flex flex-col justify-between border-zinc-100 bg-white p-5">
                <Trophy className="size-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-light tracking-tight">
                    {initialRankings.reduce(
                      (s, r) => s + r.tournamentsPlayed,
                      0
                    )}
                  </p>
                  <p className="mt-1 text-[10px] tracking-[0.2em] text-zinc-400 uppercase">
                    Участия
                  </p>
                </div>
              </BentoCard>
              <BentoCard className="flex flex-col justify-between border-zinc-100 bg-white p-5">
                <Star className="size-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-light tracking-tight">
                    {initialRankings.reduce((s, r) => s + r.wins, 0)}
                  </p>
                  <p className="mt-1 text-[10px] tracking-[0.2em] text-zinc-400 uppercase">
                    Победи
                  </p>
                </div>
              </BentoCard>
            </div>

            {/* Podium Col */}
            <BentoCard className="flex h-full flex-col justify-center border-zinc-100 bg-white p-8 lg:col-span-8">
              <div className="flex items-end justify-center gap-4 pb-4 md:gap-8">
                {/* 2nd Place */}
                {topThree[1] && (
                  <div className="flex w-1/3 flex-col items-center">
                    <div className="mb-4 text-3xl opacity-50 grayscale">🥈</div>
                    <div className="w-full rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-center">
                      <p className="mb-2 truncate px-2 text-[11px] tracking-widest text-zinc-400 uppercase">
                        {topThree[1].memberName}
                      </p>
                      <p className="text-3xl font-light tracking-tighter text-zinc-950">
                        {topThree[1].totalPoints}
                      </p>
                      <p className="mt-1 text-[9px] tracking-[0.3em] text-zinc-400 uppercase">
                        точки
                      </p>
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {topThree[0] && (
                  <div className="mb-6 flex w-1/3 flex-col items-center">
                    <div className="mb-4 text-4xl">🥇</div>
                    <div className="w-full rounded-2xl border border-yellow-200 bg-white p-6 text-center shadow-sm ring-8 ring-yellow-50/50">
                      <p className="mb-2 truncate px-2 text-[12px] tracking-[0.2em] text-zinc-900 uppercase">
                        {topThree[0].memberName}
                      </p>
                      <p className="text-4xl font-light tracking-tighter text-yellow-600">
                        {topThree[0].totalPoints}
                      </p>
                      <p className="mt-1 text-[10px] tracking-[0.4em] text-yellow-600/60 uppercase">
                        точки
                      </p>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                  <div className="flex w-1/3 flex-col items-center">
                    <div className="mb-4 text-3xl opacity-30 grayscale">🥉</div>
                    <div className="w-full rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-center">
                      <p className="mb-2 truncate px-2 text-[11px] tracking-widest text-zinc-400 uppercase">
                        {topThree[2].memberName}
                      </p>
                      <p className="text-3xl font-light tracking-tighter text-zinc-950">
                        {topThree[2].totalPoints}
                      </p>
                      <p className="mt-1 text-[9px] tracking-[0.3em] text-zinc-400 uppercase">
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
            <div className="border-b border-zinc-100 p-8">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <h3 className="text-[14px] tracking-[0.3em] text-zinc-400 uppercase">
                  Пълно класиране
                </h3>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="h-11 rounded-xl border border-zinc-100 bg-zinc-50 p-1">
                    {CATEGORY_TABS.map((tab) => (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="rounded-lg px-6 text-[10px] tracking-widest uppercase data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm"
                      >
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader className="bg-zinc-50/50">
                  <TableRow className="h-14 border-zinc-100 hover:bg-transparent">
                    <TableHead className="w-16 text-center text-[10px] tracking-[0.2em] text-zinc-400 uppercase">
                      №
                    </TableHead>
                    <TableHead className="min-w-50 text-[10px] tracking-[0.2em] text-zinc-400 uppercase">
                      Играч
                    </TableHead>
                    <TableHead className="text-center text-[10px] tracking-[0.2em] text-zinc-400 uppercase">
                      Турнири
                    </TableHead>
                    <TableHead className="text-center text-[10px] tracking-[0.2em] text-zinc-400 uppercase">
                      Победи
                    </TableHead>
                    <TableHead className="text-center text-[10px] tracking-[0.2em] text-zinc-400 uppercase">
                      Загуби
                    </TableHead>
                    <TableHead className="text-center text-[10px] tracking-[0.2em] text-zinc-400 uppercase">
                      Успех
                    </TableHead>
                    <TableHead className="pr-8 text-right text-[10px] tracking-[0.2em] text-zinc-400 uppercase">
                      Точки
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRankings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-64 text-center">
                        <p className="text-[12px] tracking-widest text-zinc-300 uppercase">
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
                          className="group h-20 border-zinc-50 transition-colors hover:bg-zinc-50/50"
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
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {entry.categoryBreakdown.map(
                                    (c: { category: string }) => (
                                      <Badge
                                        key={c.category}
                                        variant="secondary"
                                        className="rounded-full border-none bg-zinc-100 px-2 py-0.5 text-[9px] font-medium tracking-widest text-zinc-500 uppercase"
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
                              <div className="hidden h-1 w-20 overflow-hidden rounded-full bg-zinc-100 md:block">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    getWinRateColor(winRate)
                                  )}
                                  // eslint-disable-next-line react/forbid-dom-props
                                  style={{ width: `${winRate}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-medium text-zinc-400 tabular-nums">
                                {winRate}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="pr-8 text-right">
                            <Badge
                              className={cn(
                                "min-w-15 justify-center rounded-full border-none px-4 py-1.5 text-[13px] font-medium tabular-nums",
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

            {/* Mobile View: Cards */}
            <div className="divide-y divide-zinc-50 md:hidden dark:divide-zinc-900">
              {filteredRankings.length === 0 ? (
                <div className="flex h-48 items-center justify-center text-center">
                  <p className="text-[11px] tracking-widest text-zinc-400 uppercase">
                    Няма данни за тази категория
                  </p>
                </div>
              ) : (
                filteredRankings.map((entry) => {
                  const winRate =
                    entry.wins + entry.losses > 0
                      ? Math.round(
                          (entry.wins / (entry.wins + entry.losses)) * 100
                        )
                      : 0;

                  return (
                    <div
                      key={entry.memberId}
                      className="flex flex-col gap-4 p-5 transition-colors active:bg-zinc-50 dark:active:bg-zinc-900"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 shrink-0 text-center text-2xl font-light">
                            {getMedalEmoji(entry.position)}
                          </div>
                          <div>
                            <span className="text-sm font-medium text-zinc-900 dark:text-white">
                              {entry.memberName}
                            </span>
                            {activeTab === "all" &&
                              entry.categoryBreakdown.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {entry.categoryBreakdown.map(
                                    (c: { category: string }) => (
                                      <Badge
                                        key={c.category}
                                        variant="secondary"
                                        className="rounded border-none bg-zinc-100 px-1.5 py-0 text-[8px] font-medium tracking-widest text-zinc-500 uppercase"
                                      >
                                        {c.category}
                                      </Badge>
                                    )
                                  )}
                                </div>
                              )}
                          </div>
                        </div>
                        <Badge
                          className={cn(
                            "rounded-full border-none px-3 py-1 text-sm font-semibold tabular-nums",
                            getPositionBadgeClasses(entry.position)
                          )}
                        >
                          {entry.totalPoints}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-4 gap-2 border-t border-zinc-50 pt-3 dark:border-zinc-900">
                        <div className="rounded-lg bg-zinc-50 py-2 text-center dark:bg-zinc-800/50">
                          <div className="mb-1 text-[9px] tracking-widest text-zinc-400 uppercase">
                            Турн.
                          </div>
                          <div className="text-xs font-semibold text-zinc-700 tabular-nums dark:text-zinc-300">
                            {entry.tournamentsPlayed}
                          </div>
                        </div>
                        <div className="rounded-lg bg-emerald-50 py-2 text-center dark:bg-emerald-950/20">
                          <div className="mb-1 text-[9px] tracking-widest text-emerald-600/70 uppercase">
                            Поб.
                          </div>
                          <div className="text-xs font-semibold text-emerald-600 tabular-nums">
                            {entry.wins}
                          </div>
                        </div>
                        <div className="rounded-lg bg-rose-50 py-2 text-center dark:bg-rose-950/20">
                          <div className="mb-1 text-[9px] tracking-widest text-rose-500/70 uppercase">
                            Заг.
                          </div>
                          <div className="text-xs font-semibold text-rose-500 tabular-nums">
                            {entry.losses}
                          </div>
                        </div>
                        <div className="flex flex-col items-center justify-center rounded-lg bg-zinc-50 py-2 text-center dark:bg-zinc-800/50">
                          <div className="mb-1 text-[9px] tracking-widest text-zinc-400 uppercase">
                            Успех
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div
                              className={cn(
                                "size-1.5 rounded-full",
                                getWinRateColor(winRate)
                              )}
                            />
                            <span className="text-xs font-semibold text-zinc-700 tabular-nums dark:text-zinc-300">
                              {winRate}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </BentoCard>

          {/* Points System Bento */}
          <BentoCard className="border-none bg-zinc-950 p-8 text-white">
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
              <div className="shrink-0">
                <h4 className="mb-3 flex items-center gap-3 text-[12px] tracking-[0.4em] text-zinc-500 uppercase">
                  <Award className="size-4" /> Система за точки
                </h4>
                <p className="text-xl font-light text-zinc-300">
                  Как се формира официалната
                  <br />
                  ранглиста на клуба
                </p>
              </div>
              <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
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
                    className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5 p-4 text-center transition-colors hover:bg-white/10"
                  >
                    <span className="mb-2 text-xl">{pos}</span>
                    <span className="text-2xl font-light tracking-tighter text-zinc-100">
                      {pts}
                    </span>
                    <span className="mt-1 text-[8px] tracking-widest text-zinc-500 uppercase">
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
