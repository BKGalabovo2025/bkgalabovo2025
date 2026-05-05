"use client";

import { useState, useTransition } from "react";
import { RankingEntry } from "@/services/ranking-service";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const period = searchParams.get("period") || "all";

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
    if (activeTab === "all") return initialRankings;

    const catLabel =
      activeTab === "singles"
        ? "Единично"
        : activeTab === "doubles"
          ? "Двойки"
          : "Смесени";

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
      </PageHeader>

      {initialRankings.length === 0 ? (
        <BentoCard className="py-24 text-center">
          <Award className="h-16 w-16 mx-auto mb-4 opacity-10" />
          <p className="text-lg font-medium text-slate-500">
            Няма намерени данни за избрания период.
          </p>
        </BentoCard>
      ) : (
        <>
          {/* Top 3 Podium Bento */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            {/* Stats Col */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-4 h-full">
              <BentoCard className="p-5 bg-blue-50/30 border-blue-100/50 flex flex-col justify-between">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{initialRankings.length}</p>
                  <p className="text-xs text-blue-600/70 font-medium">Играчи</p>
                </div>
              </BentoCard>
              <BentoCard className="p-5 bg-emerald-50/30 border-emerald-100/50 flex flex-col justify-between">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {initialRankings[0]?.totalPoints ?? 0}
                  </p>
                  <p className="text-xs text-emerald-600/70 font-medium">
                    Макс. точки
                  </p>
                </div>
              </BentoCard>
              <BentoCard className="p-5 bg-yellow-50/30 border-yellow-100/50 flex flex-col justify-between">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {initialRankings.reduce(
                      (s, r) => s + r.tournamentsPlayed,
                      0
                    )}
                  </p>
                  <p className="text-xs text-yellow-600/70 font-medium">
                    Участия
                  </p>
                </div>
              </BentoCard>
              <BentoCard className="p-5 bg-purple-50/30 border-purple-100/50 flex flex-col justify-between">
                <Star className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {initialRankings.reduce((s, r) => s + r.wins, 0)}
                  </p>
                  <p className="text-xs text-purple-600/70 font-medium">
                    Победи
                  </p>
                </div>
              </BentoCard>
            </div>

            {/* Podium Col */}
            <BentoCard className="lg:col-span-8 p-8 bg-gradient-to-b from-white to-slate-50/50 border-slate-100 shadow-md h-full flex flex-col justify-center">
              <div className="flex items-end justify-center gap-4 md:gap-8 pb-4">
                {/* 2nd Place */}
                {topThree[1] && (
                  <div className="flex flex-col items-center group w-1/3">
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                      🥈
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 text-center border-t-4 border-slate-300 shadow-sm">
                      <p className="font-bold text-sm truncate mb-1">
                        {topThree[1].memberName}
                      </p>
                      <p className="text-2xl font-black text-slate-700">
                        {topThree[1].totalPoints}
                      </p>
                      <p className="text-[10px] uppercase tracking-tighter text-slate-400 font-bold">
                        точки
                      </p>
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {topThree[0] && (
                  <div className="flex flex-col items-center group w-1/3 mb-4">
                    <div className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">
                      🥇
                    </div>
                    <div className="w-full bg-yellow-50 dark:bg-yellow-900/10 rounded-2xl p-6 text-center border-t-4 border-yellow-400 shadow-lg ring-4 ring-yellow-400/10">
                      <p className="font-black text-base truncate mb-1 text-yellow-900 dark:text-yellow-100">
                        {topThree[0].memberName}
                      </p>
                      <p className="text-3xl font-black text-yellow-600">
                        {topThree[0].totalPoints}
                      </p>
                      <p className="text-[10px] uppercase tracking-tighter text-yellow-600/70 font-bold">
                        точки
                      </p>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                  <div className="flex flex-col items-center group w-1/3">
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                      🥉
                    </div>
                    <div className="w-full bg-orange-50 dark:bg-orange-900/10 rounded-2xl p-4 text-center border-t-4 border-orange-300 shadow-sm">
                      <p className="font-bold text-sm truncate mb-1">
                        {topThree[2].memberName}
                      </p>
                      <p className="text-2xl font-black text-orange-700">
                        {topThree[2].totalPoints}
                      </p>
                      <p className="text-[10px] uppercase tracking-tighter text-orange-400 font-bold">
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
            <div className="p-6 border-b border-slate-100 bg-slate-50/30">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold font-bento">
                  Пълно класиране
                </h3>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="bg-white border border-slate-200 rounded-xl p-1 shadow-sm h-10">
                    {CATEGORY_TABS.map((tab) => (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="rounded-lg text-xs px-4 data-[state=active]:bg-slate-900 data-[state=active]:text-white"
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
                <TableHeader className="bg-slate-50/20">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="w-16 text-center font-bold">
                      №
                    </TableHead>
                    <TableHead className="min-w-[200px]">Играч</TableHead>
                    <TableHead className="text-center">Турнири</TableHead>
                    <TableHead className="text-center text-emerald-600 font-bold">
                      Победи
                    </TableHead>
                    <TableHead className="text-center text-rose-500 font-bold">
                      Загуби
                    </TableHead>
                    <TableHead className="text-center">Успех</TableHead>
                    <TableHead className="text-right pr-8">Точки</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRankings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-64 text-center">
                        <p className="text-slate-400 font-medium">
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
                          className={cn(
                            "group hover:bg-slate-50/50 transition-colors border-slate-50",
                            entry.position === 1 &&
                              "bg-yellow-50/30 dark:bg-yellow-900/5",
                            entry.position === 2 &&
                              "bg-slate-50/50 dark:bg-slate-900/5",
                            entry.position === 3 &&
                              "bg-orange-50/30 dark:bg-orange-900/5"
                          )}
                        >
                          <TableCell className="text-center font-black text-lg">
                            {getMedalEmoji(entry.position)}
                          </TableCell>
                          <TableCell>
                            <div className="font-bold text-slate-900 group-hover:text-primary transition-colors">
                              {entry.memberName}
                            </div>
                            {activeTab === "all" &&
                              entry.categoryBreakdown.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {entry.categoryBreakdown.map((c) => (
                                    <Badge
                                      key={c.category}
                                      variant="secondary"
                                      className="text-[9px] px-1.5 py-0 rounded-md font-bold uppercase tracking-tighter bg-slate-100 text-slate-500 border-none"
                                    >
                                      {c.category}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {entry.tournamentsPlayed}
                          </TableCell>
                          <TableCell className="text-center text-emerald-600 font-bold">
                            {entry.wins}
                          </TableCell>
                          <TableCell className="text-center text-rose-500 font-bold">
                            {entry.losses}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden hidden md:block">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    winRate > 70
                                      ? "bg-emerald-500"
                                      : winRate > 40
                                        ? "bg-yellow-500"
                                        : "bg-rose-500"
                                  )}
                                  style={{ width: `${winRate}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-bold text-slate-500">
                                {winRate}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            <Badge
                              className={cn(
                                "font-black text-sm px-3 py-1 rounded-xl shadow-sm border-none min-w-[50px] justify-center",
                                entry.position === 1
                                  ? "bg-yellow-500 text-white"
                                  : entry.position === 2
                                    ? "bg-slate-400 text-white"
                                    : entry.position === 3
                                      ? "bg-orange-400 text-white"
                                      : "bg-slate-100 text-slate-700"
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
          <BentoCard className="p-6 bg-slate-900 text-white border-none shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h4 className="text-lg font-bold font-bento mb-1 flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-400" /> Система за точки
                </h4>
                <p className="text-slate-400 text-xs">
                  Как се формира официалната ранглиста на клуба
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 flex-1 max-w-4xl">
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
                    className="bg-white/5 rounded-xl p-2.5 border border-white/10 text-center"
                  >
                    <span className="block text-sm mb-1">{pos}</span>
                    <span className="block text-lg font-black text-yellow-400">
                      {pts}
                    </span>
                    <span className="block text-[8px] uppercase font-bold text-slate-500">
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
