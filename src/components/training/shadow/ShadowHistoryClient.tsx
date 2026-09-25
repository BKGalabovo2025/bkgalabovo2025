/* eslint-disable sonarjs/no-nested-conditional */
"use client";

import { format } from "date-fns";
import { bg } from "date-fns/locale";
import {
  ChevronLeft,
  Clock,
  Eye,
  Flame,
  Info,
  Layers,
  Search,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import React, { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ZoneId } from "@/lib/shadow-training/audio-map";
import { TrainingSession } from "@/types/training.types";

import { CourtVisualizer } from "../CourtVisualizer";
import { DeleteTrainingButton } from "../DeleteTrainingButton";

interface ShadowHistoryClientProps {
  sessions: TrainingSession[];
  memberNameMap: Record<string, string>;
  leaderboard: { id: string; min: number; name: string }[];
}

function getModeBadge(mode?: string) {
  if (mode === "ghost_match") {
    return {
      label: "Мач на сенки",
      badgeColor:
        "bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300",
      icon: Zap,
    };
  }
  if (mode === "agility_test") {
    return {
      label: "Тест за бързина",
      badgeColor:
        "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300",
      icon: Target,
    };
  }
  return {
    label: "Стандартна тренировка",
    badgeColor:
      "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
    icon: Clock,
  };
}

function getRpeColorBadge(score: number) {
  if (score <= 3)
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
  if (score <= 6)
    return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
  if (score <= 8)
    return "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300";
  return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
}

export function ShadowHistoryClient({
  sessions,
  memberNameMap,
  leaderboard,
}: ShadowHistoryClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMode, setSelectedMode] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<"all" | "7d" | "30d">(
    "all"
  );
  const [inspectSession, setInspectSession] = useState<TrainingSession | null>(
    null
  );

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // 1. Mode filter
      if (selectedMode !== "all") {
        const mode = s.shadowDetails?.mode || "standard";
        if (mode !== selectedMode) return false;
      }

      // 2. Period filter
      if (selectedPeriod !== "all") {
        const d = new Date(s.date).getTime();
        const now = 1774439000000; // Reference 2026 timestamp
        const daysAgo = (now - d) / (1000 * 60 * 60 * 24);
        if (selectedPeriod === "7d" && daysAgo > 7) return false;
        if (selectedPeriod === "30d" && daysAgo > 30) return false;
      }

      // 3. Search query (matches player names or notes)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hasMatchingPlayer = s.memberIds.some((id) => {
          const name = (memberNameMap[id] || "").toLowerCase();
          return name.includes(q);
        });
        const hasMatchingNotes = (s.notes || "").toLowerCase().includes(q);
        const hasMatchingMode = (s.shadowDetails?.mode || "")
          .toLowerCase()
          .includes(q);
        if (!hasMatchingPlayer && !hasMatchingNotes && !hasMatchingMode) {
          return false;
        }
      }

      return true;
    });
  }, [sessions, selectedMode, selectedPeriod, searchQuery, memberNameMap]);

  // Overall Statistics
  const totalStats = useMemo(() => {
    let totalMinutes = 0;
    const uniqueMembers = new Set<string>();
    let totalRpeSum = 0;
    let totalRpeCount = 0;

    sessions.forEach((s) => {
      totalMinutes += (s.durationMs || 0) / 60000;
      s.memberIds.forEach((id) => uniqueMembers.add(id));

      const scores = s.shadowDetails?.rpeScores || s.rpeScores;
      if (scores) {
        Object.values(scores).forEach((val) => {
          if (typeof val === "number" && val > 0) {
            totalRpeSum += val;
            totalRpeCount++;
          }
        });
      }
    });

    const avgRpe =
      totalRpeCount > 0 ? (totalRpeSum / totalRpeCount).toFixed(1) : "—";

    return {
      totalSessions: sessions.length,
      totalMinutes: Math.round(totalMinutes),
      uniqueMembersCount: uniqueMembers.size,
      avgRpe,
    };
  }, [sessions]);

  // Derive preview zones for inspecting session
  const inspectZones = useMemo<ZoneId[]>(() => {
    if (!inspectSession) return [];
    const corners = inspectSession.shadowDetails?.cornersMode;
    if (corners === "2-corners") return ["frontForehand", "frontBackhand"];
    if (corners === "4-corners")
      return ["frontForehand", "frontBackhand", "backForehand", "backBackhand"];
    return [
      "frontForehand",
      "frontBackhand",
      "midForehand",
      "midBackhand",
      "backForehand",
      "backBackhand",
      "overhead",
    ];
  }, [inspectSession]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      {/* Header & Back Button */}
      <div className="flex flex-col gap-3">
        <Link href="/training/shadow" className="self-start">
          <Button
            variant="ghost"
            size="sm"
            className="mb-1 -ml-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <ChevronLeft className="mr-1 size-4" />
            Назад към Настройчика на тренировки
          </Button>
        </Link>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
              <Zap className="size-7 text-blue-600" /> История на Тренировките
            </h1>
            <p className="text-sm font-medium text-zinc-500">
              Архив на всички проведени сесии по движения на корта (Shadow
              Footwork)
            </p>
          </div>
        </div>
      </div>

      {/* ─── ОБОБЩЕНИ СТАТИСТИКИ ─── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="rounded-2xl border-zinc-200/80 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-zinc-500">
                Общо Време
              </p>
              <p className="text-xl font-black text-zinc-900 dark:text-white">
                {totalStats.totalMinutes}{" "}
                <span className="text-xs font-semibold text-zinc-500">мин</span>
              </p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-zinc-200/80 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <Layers className="size-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-zinc-500">
                Сесии
              </p>
              <p className="text-xl font-black text-zinc-900 dark:text-white">
                {totalStats.totalSessions}
              </p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-zinc-200/80 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-zinc-500">
                Състезатели
              </p>
              <p className="text-xl font-black text-zinc-900 dark:text-white">
                {totalStats.uniqueMembersCount}
              </p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-zinc-200/80 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <Flame className="size-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-zinc-500">
                Ср. RPE Натоварване
              </p>
              <p className="text-xl font-black text-zinc-900 dark:text-white">
                {totalStats.avgRpe}{" "}
                <span className="text-xs font-semibold text-zinc-500">
                  / 10
                </span>
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* ─── ОСНОВНО СЪДЪРЖАНИЕ: ЛИДЕРБОРД + СПИСЪК СЪС СЕСИИ ─── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT: Лидерборд Топ 5 (4 cols) */}
        <div className="lg:col-span-4">
          <Card className="overflow-hidden rounded-3xl border-2 border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <CardHeader className="border-b border-zinc-100 bg-zinc-50/80 p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Trophy className="size-5 text-amber-500" /> Топ Трудолюбиви
              </CardTitle>
              <CardDescription className="text-xs">
                Най-много прекарани минути в крачна работа
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {leaderboard.length === 0 ? (
                  <p className="p-4 text-center text-xs text-zinc-500">
                    Няма регистрирани сесии.
                  </p>
                ) : (
                  leaderboard.map((lb, idx) => (
                    <Link
                      key={lb.id}
                      href={`/members/${lb.id}`}
                      className="group flex items-center justify-between rounded-2xl border border-transparent p-3 transition-all hover:border-zinc-200 hover:bg-zinc-50 dark:hover:border-zinc-800 dark:hover:bg-zinc-800/50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                            idx === 0
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : idx === 1
                                ? "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                                : idx === 2
                                  ? "bg-amber-700/20 text-amber-700 dark:text-amber-400"
                                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-zinc-900 group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400">
                            {lb.name}
                          </p>
                          <p className="text-[10px] text-zinc-400">
                            Състезател
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                          {Math.round(lb.min)} мин
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Списък с проведени сесии & Филтри (8 cols) */}
        <div className="space-y-4 lg:col-span-8">
          <Card className="rounded-3xl border-2 border-zinc-200/80 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            {/* Filter controls */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Търсене по играч или бележка..."
                  className="h-10 rounded-xl pl-9 text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
                  {[
                    { id: "all", label: "Всички" },
                    { id: "standard", label: "Стандартни" },
                    { id: "ghost_match", label: "Мач" },
                    { id: "agility_test", label: "Спринт" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMode(m.id)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                        selectedMode === m.id
                          ? "bg-white text-blue-600 shadow-xs dark:bg-zinc-900 dark:text-white"
                          : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                <div className="flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
                  {[
                    { id: "all", label: "Всички дати" },
                    { id: "7d", label: "7 дни" },
                    { id: "30d", label: "30 дни" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        setSelectedPeriod(p.id as "all" | "7d" | "30d")
                      }
                      className={`rounded-lg px-2 py-1 text-xs font-bold transition-all ${
                        selectedPeriod === p.id
                          ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-white"
                          : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Sessions List */}
          <div className="space-y-3">
            {filteredSessions.length === 0 ? (
              <Card className="rounded-3xl border-dashed border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
                <Info className="mx-auto size-8 text-zinc-400" />
                <h3 className="mt-2 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  Няма намерени тренировки
                </h3>
                <p className="mt-1 text-xs text-zinc-500">
                  Опитайте да промените зададените филтри или проведете нова
                  сесия от треньора.
                </p>
              </Card>
            ) : (
              filteredSessions.map((session) => {
                const modeInfo = getModeBadge(session.shadowDetails?.mode);
                const ModeIcon = modeInfo.icon;
                const minutes = Math.round((session.durationMs || 0) / 60000);
                const seconds = Math.round(
                  ((session.durationMs || 0) % 60000) / 1000
                );
                const durationLabel =
                  minutes > 0
                    ? `${minutes} мин ${seconds} сек`
                    : `${seconds} сек`;

                return (
                  <Card
                    key={session.id}
                    className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-xs transition-all hover:border-blue-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                      {/* Left: Info */}
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${modeInfo.badgeColor}`}
                          >
                            <ModeIcon size={12} />
                            {modeInfo.label}
                          </span>
                          {session.shadowDetails?.preset && (
                            <Badge variant="outline" className="text-[10px]">
                              {session.shadowDetails.preset}
                            </Badge>
                          )}
                          <span className="text-xs text-zinc-400">
                            {format(
                              new Date(session.date),
                              "dd MMM yyyy, HH:mm",
                              {
                                locale: bg,
                              }
                            )}
                          </span>
                        </div>

                        {/* Players */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-xs font-bold text-zinc-500">
                            Участници ({session.memberIds.length}):
                          </span>
                          {session.memberIds.slice(0, 4).map((id) => (
                            <span
                              key={id}
                              className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                            >
                              {memberNameMap[id] || `#${id.slice(0, 6)}`}
                            </span>
                          ))}
                          {session.memberIds.length > 4 && (
                            <span className="text-xs font-bold text-zinc-400">
                              +{session.memberIds.length - 4} още
                            </span>
                          )}
                        </div>

                        {/* Notes snippet */}
                        {session.notes && (
                          <p className="line-clamp-1 text-xs text-zinc-500 italic">
                            „{session.notes}“
                          </p>
                        )}
                      </div>

                      {/* Right: Metrics & Actions */}
                      <div className="flex items-center justify-between gap-4 border-t border-zinc-100 pt-3 sm:border-t-0 sm:pt-0">
                        <div className="text-right">
                          <div className="text-sm font-black text-zinc-900 dark:text-white">
                            {durationLabel}
                          </div>
                          <div className="text-[11px] font-semibold text-zinc-500">
                            {session.shadowDetails?.setsCompleted || 0} от{" "}
                            {session.shadowDetails?.totalSets || 1} серии
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setInspectSession(session)}
                            className="h-9 rounded-xl text-xs font-bold"
                          >
                            <Eye className="mr-1.5 size-3.5" /> Детайли
                          </Button>
                          {session.id && (
                            <DeleteTrainingButton trainingId={session.id} />
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ─── МОДАЛ ЗА ДЕТАЙЛИ НА СЕСИЯТА ─── */}
      <Dialog
        open={!!inspectSession}
        onOpenChange={(open) => {
          if (!open) setInspectSession(null);
        }}
      >
        <DialogContent className="max-w-2xl rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black">
              <Zap className="size-5 text-blue-600" />
              Детайли за Тренировката
            </DialogTitle>
            <DialogDescription className="text-xs">
              {inspectSession?.date &&
                format(
                  new Date(inspectSession.date),
                  "EEEE, dd MMMM yyyy г., HH:mm ч.",
                  { locale: bg }
                )}
            </DialogDescription>
          </DialogHeader>

          {inspectSession && (
            <div className="space-y-6 pt-2">
              {/* Parameters Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900">
                  <span className="text-[10px] font-bold uppercase text-zinc-400">
                    Режим
                  </span>
                  <p className="text-xs font-black text-zinc-900 dark:text-white">
                    {getModeBadge(inspectSession.shadowDetails?.mode).label}
                  </p>
                </div>
                <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900">
                  <span className="text-[10px] font-bold uppercase text-zinc-400">
                    Времетраене
                  </span>
                  <p className="text-xs font-black text-zinc-900 dark:text-white">
                    {Math.round((inspectSession.durationMs || 0) / 1000)} сек
                  </p>
                </div>
                <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900">
                  <span className="text-[10px] font-bold uppercase text-zinc-400">
                    Серии
                  </span>
                  <p className="text-xs font-black text-zinc-900 dark:text-white">
                    {inspectSession.shadowDetails?.setsCompleted || 0} от{" "}
                    {inspectSession.shadowDetails?.totalSets || 1}
                  </p>
                </div>
                <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900">
                  <span className="text-[10px] font-bold uppercase text-zinc-400">
                    Конфигурация
                  </span>
                  <p className="text-xs font-black text-zinc-900 dark:text-white">
                    {inspectSession.shadowDetails?.cornersMode || "6 ъгъла"}
                  </p>
                </div>
              </div>

              {/* Court visualization preview */}
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <span className="mb-2 text-[11px] font-bold uppercase text-zinc-400">
                  Схема на корта за тази сесия
                </span>
                <div className="w-full max-w-60">
                  <CourtVisualizer
                    previewZones={inspectZones}
                    viewMode="half"
                    allowToggleView
                  />
                </div>
              </div>

              {/* Players and RPE Ratings */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Участници и индивидуално RPE натоварване (1 - 10)
                </h4>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {inspectSession.memberIds.map((id) => {
                    const rpe =
                      inspectSession.shadowDetails?.rpeScores?.[id] ||
                      inspectSession.rpeScores?.[id] ||
                      5;
                    return (
                      <div
                        key={id}
                        className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-zinc-900 dark:text-white">
                            {memberNameMap[id] ||
                              `Състезател #${id.slice(0, 6)}`}
                          </p>
                        </div>
                        <Badge
                          className={`rounded-lg text-xs font-bold ${getRpeColorBadge(rpe)}`}
                        >
                          RPE {rpe} / 10
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Coach Notes */}
              {inspectSession.notes && (
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <h4 className="text-xs font-bold uppercase text-zinc-500">
                    Треньорски бележки
                  </h4>
                  <p className="mt-1 text-xs text-zinc-700 dark:text-zinc-300">
                    {inspectSession.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
