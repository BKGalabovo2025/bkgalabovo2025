"use client";

import { format } from "date-fns";
import { bg } from "date-fns/locale";
import {
  Check,
  ChevronLeft,
  Clock,
  Eye,
  Flame,
  Info,
  Layers,
  Link2,
  Search,
  Target,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

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
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDeepLinkHighlight } from "@/hooks/useDeepLinkHighlight";
import { ZONE_NAMES, ZoneId } from "@/lib/shadow-training/audio-map";
import { cn } from "@/lib/utils";
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

type HistoryPeriod = "all" | "7d" | "30d";

export function ShadowHistoryClient({
  sessions,
  memberNameMap,
  leaderboard,
}: ShadowHistoryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionParam =
    searchParams.get("id") ||
    searchParams.get("session") ||
    searchParams.get("sessionId");
  const cardParam = searchParams.get("card");
  const playerParam = searchParams.get("player");

  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get("q") || ""
  );
  const [selectedMode, setSelectedMode] = useState<string>(() => {
    const m = searchParams.get("mode");
    return m && ["all", "standard", "agility_test"].includes(m) ? m : "all";
  });
  const [selectedPeriod, setSelectedPeriod] = useState<HistoryPeriod>(() => {
    const p = searchParams.get("period");
    return p === "7d" || p === "30d" ? p : "all";
  });
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(
    () => playerParam || null
  );
  const [inspectSession, setInspectSession] = useState<TrainingSession | null>(
    null
  );
  const [copiedCardId, setCopiedCardId] = useState<string | null>(null);
  const [highlightedCard, setHighlightedCard] = useState<string | null>(
    () => cardParam || null
  );
  const [referenceTimestamp] = useState(() => Date.now());

  const syncQueryParams = useCallback(
    (mutator: (sp: URLSearchParams) => void, hash?: string) => {
      if (typeof window === "undefined") return;
      try {
        const sp = new URLSearchParams(window.location.search);
        mutator(sp);
        const q = sp.toString();
        const hashStr =
          hash !== undefined ? (hash ? `#${hash}` : "") : window.location.hash;
        window.history.replaceState(
          {},
          "",
          `${window.location.pathname}${q ? `?${q}` : ""}${hashStr}`
        );
      } catch {
        // Ignore URL errors
      }
    },
    []
  );

  const handleCopyCardUrl = useCallback(
    (cardId: string, label: string) => {
      if (typeof window === "undefined") return;
      try {
        syncQueryParams((sp) => {
          sp.set("card", cardId);
        }, `card-${cardId}`);
        void navigator.clipboard.writeText(window.location.href);
        setCopiedCardId(cardId);
        setHighlightedCard(cardId);
        toast.success(`Линкът към „${label}“ е копиран!`);
        setTimeout(() => setCopiedCardId(null), 2000);
        setTimeout(() => setHighlightedCard(null), 3000);
      } catch {
        // Ignore clipboard errors
      }
    },
    [syncQueryParams]
  );

  useEffect(() => {
    if (cardParam) {
      setHighlightedCard(cardParam);
      setTimeout(() => {
        const el = document.getElementById(`card-${cardParam}`);
        if (el && typeof el.scrollIntoView === "function") {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 150);
      setTimeout(() => setHighlightedCard(null), 3500);
    }
  }, [cardParam]);

  useEffect(() => {
    if (!sessionParam) return;
    const match = sessions.find((s) => s.id === sessionParam);
    if (match) {
      setInspectSession(match);
      setTimeout(() => {
        const el = document.getElementById(`session-${match.id}`);
        if (el && typeof el.scrollIntoView === "function") {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 150);
    }
  }, [sessionParam, sessions]);

  const handleOpenInspect = (session: TrainingSession) => {
    setInspectSession(session);
    if (session.id) {
      const sp = new URLSearchParams(searchParams?.toString() || "");
      sp.set("session", session.id);
      router.replace(`?${sp.toString()}`, { scroll: false });
    }
  };

  const handleCloseInspect = () => {
    setInspectSession(null);
    const sp = new URLSearchParams(searchParams?.toString() || "");
    sp.delete("session");
    sp.delete("id");
    sp.delete("sessionId");
    const q = sp.toString();
    router.replace(q ? `?${q}` : window.location.pathname, { scroll: false });
  };

  const handleModeChange = (modeId: string) => {
    setSelectedMode(modeId);
    syncQueryParams((sp) => {
      if (modeId === "all") sp.delete("mode");
      else sp.set("mode", modeId);
    });
  };

  const handlePeriodChange = (periodId: HistoryPeriod) => {
    setSelectedPeriod(periodId);
    syncQueryParams((sp) => {
      if (periodId === "all") sp.delete("period");
      else sp.set("period", periodId);
    });
  };

  const handlePlayerFilterChange = (playerId: string | null) => {
    setSelectedPlayerId(playerId);
    syncQueryParams((sp) => {
      if (!playerId) sp.delete("player");
      else sp.set("player", playerId);
    });
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    syncQueryParams((sp) => {
      if (!val.trim()) sp.delete("q");
      else sp.set("q", val.trim());
    });
  };

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // 0. Player filter (?player=...)
      if (selectedPlayerId) {
        if (!(s.memberIds || []).includes(selectedPlayerId)) return false;
      }

      // 1. Mode filter
      if (selectedMode !== "all") {
        const mode = s.shadowDetails?.mode || "standard";
        if (selectedMode === "standard") {
          if (mode !== "standard" && mode !== "ghost_match") return false;
        } else if (mode !== selectedMode) {
          return false;
        }
      }

      // 2. Period filter
      if (selectedPeriod !== "all") {
        const d = new Date(s.date).getTime();
        const daysAgo = (referenceTimestamp - d) / (1000 * 60 * 60 * 24);
        if (selectedPeriod === "7d" && daysAgo > 7) return false;
        if (selectedPeriod === "30d" && daysAgo > 30) return false;
      }

      // 3. Search query (matches player names or notes)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hasMatchingPlayer = (s.memberIds || []).some((id) => {
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
  }, [
    sessions,
    selectedPlayerId,
    selectedMode,
    selectedPeriod,
    searchQuery,
    memberNameMap,
    referenceTimestamp,
  ]);

  useDeepLinkHighlight("session", filteredSessions.length > 0, "session");

  // Best Agility Test time (PB) across all agility_test sessions
  const bestAgilityTimeSec = useMemo(() => {
    let best: number | null = null;
    sessions.forEach((s) => {
      if (s.shadowDetails?.mode === "agility_test") {
        const t =
          s.shadowDetails.agilityTestTimeSec ??
          (s.durationMs ? s.durationMs / 1000 : null);
        if (typeof t === "number" && t > 0) {
          if (best === null || t < best) {
            best = t;
          }
        }
      }
    });
    return best;
  }, [sessions]);

  // Overall Statistics
  const totalStats = useMemo(() => {
    let totalMinutes = 0;
    const uniqueMembers = new Set<string>();
    let totalRpeSum = 0;
    let totalRpeCount = 0;

    sessions.forEach((s) => {
      totalMinutes += (s.durationMs || 0) / 60000;
      (s.memberIds || []).forEach((id) => uniqueMembers.add(id));

      const scores =
        (
          s.shadowDetails as TrainingSession["shadowDetails"] & {
            individualRpe?: Record<string, number>;
          }
        )?.individualRpe ||
        s.shadowDetails?.rpeScores ||
        s.rpeScores;
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
      totalMinutes: Math.floor(totalMinutes),
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

  const renderCardLinkBtn = (cardId: string, label: string) => {
    const isCopied = copiedCardId === cardId;
    return (
      <button
        type="button"
        onClick={() => handleCopyCardUrl(cardId, label)}
        className="flex size-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
        title={`Копирай директен URL за ${label}`}
        aria-label={`Копирай директен URL за ${label}`}
      >
        {isCopied ? (
          <Check className="size-3.5 text-emerald-500" />
        ) : (
          <Link2 className="size-3.5" />
        )}
      </button>
    );
  };

  return (
    <div className="w-full space-y-5">
      {/* Компактен Хедър & Назад */}
      <div className="flex flex-col gap-2 rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
            <Zap className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight text-zinc-900 sm:text-lg dark:text-white">
              История на Тренировките
            </h2>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Архив на всички проведени сесии по движения на корта (Shadow
              Footwork)
            </p>
          </div>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-9 self-start rounded-xl text-xs font-bold sm:self-auto"
        >
          <Link href="/training/shadow">
            <ChevronLeft className="mr-1 size-4" />
            Назад към Настройчика на тренировки
          </Link>
        </Button>
      </div>

      {/* ─── ОБОБЩЕНИ СТАТИСТИКИ (4 BENTO КАРТИ СЪС СОБСТВЕН URL) ─── */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {[
          {
            id: "kpi-time",
            label: "Общо Време",
            value: totalStats.totalMinutes,
            unit: "мин",
            icon: Clock,
            iconClass:
              "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
          },
          {
            id: "kpi-sessions",
            label: "Сесии",
            value: totalStats.totalSessions,
            unit: "",
            icon: Layers,
            iconClass:
              "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
          },
          {
            id: "kpi-players",
            label: "Състезатели",
            value: totalStats.uniqueMembersCount,
            unit: "",
            icon: Users,
            iconClass:
              "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
          },
          {
            id: "kpi-rpe",
            label: "Ср. RPE Натоварване",
            value: totalStats.avgRpe,
            unit: "/ 10",
            icon: Flame,
            iconClass:
              "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
          },
        ].map((kpi) => {
          const KpiIcon = kpi.icon;
          return (
            <Card
              key={kpi.id}
              id={`card-${kpi.id}`}
              className={cn(
                "rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-xs transition-all dark:border-zinc-800 dark:bg-zinc-950",
                highlightedCard === kpi.id &&
                  "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-950"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${kpi.iconClass}`}
                  >
                    <KpiIcon className="size-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                      {kpi.label}
                    </p>
                    <p className="text-lg font-black text-zinc-900 sm:text-xl dark:text-white">
                      {kpi.value}{" "}
                      {kpi.unit && (
                        <span className="text-xs font-semibold text-zinc-500">
                          {kpi.unit}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {renderCardLinkBtn(kpi.id, kpi.label)}
              </div>
            </Card>
          );
        })}
      </div>

      {/* ─── ОСНОВНО СЪДЪРЖАНИЕ: ЛИДЕРБОРД + СПИСЪК СЪС СЕСИИ ─── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* LEFT: Лидерборд Топ 5 (4 cols) */}
        <div className="lg:col-span-4">
          <Card
            id="card-leaderboard"
            className={cn(
              "overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs transition-all dark:border-zinc-800 dark:bg-zinc-950",
              highlightedCard === "leaderboard" &&
                "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-950"
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
              <div>
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white">
                  <Trophy className="size-4 text-amber-500" /> Топ Трудолюбиви
                </CardTitle>
                <CardDescription className="text-[11px]">
                  Кликнете състезател за филтър (?player=...)
                </CardDescription>
              </div>
              {renderCardLinkBtn("leaderboard", "Топ Трудолюбиви")}
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-1.5">
                {leaderboard.length === 0 ? (
                  <p className="p-4 text-center text-xs text-zinc-500">
                    Няма регистрирани сесии.
                  </p>
                ) : (
                  leaderboard.map((lb, idx) => {
                    const isPlayerSelected = selectedPlayerId === lb.id;
                    return (
                      <div
                        key={lb.id}
                        className={cn(
                          "group flex items-center justify-between rounded-xl border p-2.5 transition-all",
                          isPlayerSelected
                            ? "border-blue-500 bg-blue-50/60 dark:border-blue-500 dark:bg-blue-950/40"
                            : "border-transparent hover:border-zinc-200 hover:bg-zinc-50 dark:hover:border-zinc-800 dark:hover:bg-zinc-900"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            handlePlayerFilterChange(
                              isPlayerSelected ? null : lb.id
                            )
                          }
                          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                        >
                          <div
                            className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
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
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-zinc-900 group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400">
                              {lb.name}
                            </p>
                            <p className="text-[10px] text-zinc-400">
                              {isPlayerSelected
                                ? "Активен филтър"
                                : "Състезател"}
                            </p>
                          </div>
                        </button>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                            {Math.floor(lb.min)} мин
                          </span>
                          <Link
                            href={`/members/${lb.id}`}
                            className="rounded-lg px-1.5 py-0.5 text-[10px] font-bold text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
                            title={`Отвори профила на ${lb.name}`}
                          >
                            Профил
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Списък с проведени сесии & Филтри (8 cols) */}
        <div className="space-y-3.5 lg:col-span-8">
          <Card
            id="card-filters"
            className={cn(
              "rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-xs transition-all dark:border-zinc-800 dark:bg-zinc-950",
              highlightedCard === "filters" &&
                "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-950"
            )}
          >
            {/* Filter controls */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  aria-label="Търсене по играч или бележка"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Търсене по играч или бележка..."
                  className="h-9 rounded-xl pl-9 text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {selectedPlayerId && (
                  <button
                    type="button"
                    onClick={() => handlePlayerFilterChange(null)}
                    className="inline-flex items-center gap-1 rounded-xl border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400"
                  >
                    <span>
                      {memberNameMap[selectedPlayerId] || "Избран играч"}
                    </span>
                    <X className="size-3" />
                  </button>
                )}

                <div className="flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900">
                  {[
                    { id: "all", label: "Всички" },
                    { id: "standard", label: "Стандартни" },
                    { id: "agility_test", label: "Тест за бързина" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleModeChange(m.id)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                        selectedMode === m.id
                          ? "bg-white text-blue-600 shadow-2xs dark:bg-zinc-800 dark:text-white"
                          : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                <div className="flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900">
                  {[
                    { id: "all", label: "Всички дати" },
                    { id: "7d", label: "7 дни" },
                    { id: "30d", label: "30 дни" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        handlePeriodChange(p.id as "all" | "7d" | "30d")
                      }
                      className={`rounded-lg px-2 py-1 text-xs font-bold transition-all ${
                        selectedPeriod === p.id
                          ? "bg-white text-zinc-900 shadow-2xs dark:bg-zinc-800 dark:text-white"
                          : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {renderCardLinkBtn("filters", "Филтри на сесиите")}
              </div>
            </div>
          </Card>

          {/* Sessions List */}
          <div className="space-y-3">
            {filteredSessions.length === 0 ? (
              <Card className="rounded-2xl border-dashed border-zinc-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-950">
                <Info className="mx-auto size-7 text-zinc-400" />
                <h2 className="mt-2 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  Няма намерени тренировки
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Опитайте да промените зададените филтри или проведете нова
                  сесия от треньора.
                </p>
              </Card>
            ) : (
              filteredSessions.map((session) => {
                const modeInfo = getModeBadge(session.shadowDetails?.mode);
                const ModeIcon = modeInfo.icon;
                const minutes = Math.floor((session.durationMs || 0) / 60000);
                const seconds = Math.floor(
                  ((session.durationMs || 0) % 60000) / 1000
                );
                const durationLabel = `${minutes} мин ${seconds} сек`;
                const isHighlighted = sessionParam === session.id;
                const memberIdsList = session.memberIds || [];
                const agilityTime =
                  session.shadowDetails?.mode === "agility_test"
                    ? (session.shadowDetails?.agilityTestTimeSec ??
                      (session.durationMs ? session.durationMs / 1000 : null))
                    : null;
                const isPb =
                  agilityTime !== null &&
                  bestAgilityTimeSec !== null &&
                  Math.abs(agilityTime - bestAgilityTimeSec) < 0.01;

                return (
                  <Card
                    key={session.id}
                    id={`session-${session.id}`}
                    className={`overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs transition-all hover:border-blue-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 ${
                      isHighlighted ? "ring-2 ring-indigo-500" : ""
                    }`}
                  >
                    <div className="flex flex-col gap-3.5 p-4 sm:flex-row sm:items-center sm:justify-between">
                      {/* Left: Info */}
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${modeInfo.badgeColor}`}
                          >
                            <ModeIcon size={12} />
                            {modeInfo.label}
                          </span>
                          {isPb && (
                            <Badge className="bg-amber-100 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              🏆 Личен рекорд (PB)
                            </Badge>
                          )}
                          {session.shadowDetails?.preset && (
                            <Badge variant="outline" className="text-[10px]">
                              {session.shadowDetails.preset === "custom"
                                ? "Персонализиран"
                                : session.shadowDetails.preset}
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
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-xs font-bold text-zinc-500">
                            Участници ({memberIdsList.length}):
                          </span>
                          {memberIdsList.slice(0, 4).map((id) => (
                            <span
                              key={id}
                              className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                            >
                              {memberNameMap[id] || `#${id.slice(0, 6)}`}
                            </span>
                          ))}
                          {memberIdsList.length > 4 && (
                            <span className="text-xs font-bold text-zinc-400">
                              +{memberIdsList.length - 4} още
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
                      <div className="flex items-center justify-between gap-4 border-t border-zinc-100 pt-2.5 sm:border-t-0 sm:pt-0 dark:border-zinc-800">
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
                          {session.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const url = `${window.location.origin}${window.location.pathname}?session=${session.id}`;
                                void navigator.clipboard.writeText(url);
                                toast.success("Линкът към сесията е копиран!");
                              }}
                              className="size-8 rounded-xl text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400"
                              title="Копирай директен линк"
                              aria-label="Копирай директен линк"
                            >
                              <Link2 className="size-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenInspect(session)}
                            className="h-8 rounded-xl text-xs font-bold"
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

      {/* URL-Synced Session Details Modal (?session=<id>) */}
      <Dialog
        open={!!inspectSession}
        onOpenChange={(open) => {
          if (!open) handleCloseInspect();
        }}
      >
        <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1.25rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-0 shadow-2xl sm:max-h-[85vh] sm:w-full sm:max-w-2xl lg:max-w-3xl dark:border-zinc-800 dark:bg-zinc-950 [&>button:last-child]:top-3.5 [&>button:last-child]:right-3.5">
          {/* Fixed Sticky Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-4 py-3 sm:px-5 sm:py-3.5 dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="flex items-center gap-3 pr-8">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                <Zap className="size-4" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="truncate text-base font-bold text-zinc-900 sm:text-lg dark:text-white">
                  Детайли за Тренировката
                </DialogTitle>
                <DialogDescription className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {inspectSession?.date &&
                    format(
                      new Date(inspectSession.date),
                      "EEEE, dd MMMM yyyy г., HH:mm ч.",
                      { locale: bg }
                    )}
                </DialogDescription>
              </div>
            </div>
          </div>

          {inspectSession && (
            <div className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-3.5 sm:p-4.5">
              {/* Parameters Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">
                    Режим
                  </span>
                  <p className="text-xs font-black text-zinc-900 dark:text-white">
                    {getModeBadge(inspectSession.shadowDetails?.mode).label}
                  </p>
                </div>
                <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">
                    Времетраене
                  </span>
                  <p className="text-xs font-black text-zinc-900 dark:text-white">
                    {`${Math.floor((inspectSession.durationMs || 0) / 60000)} мин ${Math.floor(((inspectSession.durationMs || 0) % 60000) / 1000)} сек`}
                  </p>
                </div>
                <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">
                    Серии
                  </span>
                  <p className="text-xs font-black text-zinc-900 dark:text-white">
                    {inspectSession.shadowDetails?.setsCompleted || 0} от{" "}
                    {inspectSession.shadowDetails?.totalSets || 1}
                  </p>
                </div>
                <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">
                    Конфигурация
                  </span>
                  <p className="text-xs font-black text-zinc-900 dark:text-white">
                    {inspectSession.shadowDetails?.cornersMode || "6 ъгъла"}
                  </p>
                </div>
              </div>

              {/* Agility Test Result & Personal Best */}
              {inspectSession.shadowDetails?.mode === "agility_test" &&
                (() => {
                  const agilitySec =
                    inspectSession.shadowDetails?.agilityTestTimeSec ??
                    (inspectSession.durationMs
                      ? Math.floor(inspectSession.durationMs / 1000)
                      : null);
                  const isPb =
                    agilitySec !== null &&
                    bestAgilityTimeSec !== null &&
                    Math.abs(agilitySec - bestAgilityTimeSec) < 0.01;
                  return (
                    <div className="flex items-center justify-between rounded-2xl border border-red-200/80 bg-red-50/50 p-3.5 dark:border-red-900/50 dark:bg-red-950/30">
                      <div>
                        <span className="text-[10px] font-bold text-red-600 uppercase dark:text-red-400">
                          Постигнато време (Тест за бързина)
                        </span>
                        <p className="text-sm font-black text-zinc-900 dark:text-white">
                          {agilitySec !== null ? `${agilitySec} сек` : "—"}
                        </p>
                      </div>
                      {isPb && (
                        <Badge className="bg-amber-100 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          🏆 Личен рекорд (PB)
                        </Badge>
                      )}
                    </div>
                  );
                })()}

              {/* Court visualization preview */}
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <span className="mb-2 text-[11px] font-bold text-zinc-400 uppercase">
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

              {/* Real Heatmap breakdown if present */}
              {inspectSession.shadowDetails?.heatmap &&
                (() => {
                  const heatmap = inspectSession.shadowDetails.heatmap;
                  const entries = Object.entries(heatmap).filter(
                    ([, count]) => typeof count === "number" && count > 0
                  );
                  const totalHits = entries.reduce(
                    (acc, [, count]) => acc + count,
                    0
                  );
                  if (totalHits === 0) return null;
                  return (
                    <div className="space-y-2 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/50">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold tracking-wider text-zinc-500 uppercase">
                          Разпределение по зони (Heatmap)
                        </h4>
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Общо: {totalHits} извиквания
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {entries.map(([zoneKey, count]) => {
                          const pct = Math.round((count / totalHits) * 100);
                          const label =
                            ZONE_NAMES[zoneKey as ZoneId] || zoneKey;
                          return (
                            <div
                              key={zoneKey}
                              className="flex items-center justify-between rounded-xl border border-zinc-200/80 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-900"
                            >
                              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                {label}
                              </span>
                              <span className="font-black text-blue-600 dark:text-blue-400">
                                {count} ({pct}%)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

              {/* Players and RPE Ratings */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold tracking-wider text-zinc-500 uppercase">
                  Участници и индивидуално RPE натоварване (1 - 10)
                </h4>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {(inspectSession.memberIds || []).map((id) => {
                    const detailsWithIndiv =
                      inspectSession.shadowDetails as TrainingSession["shadowDetails"] & {
                        individualRpe?: Record<string, number>;
                      };
                    const rpe =
                      detailsWithIndiv?.individualRpe?.[id] ??
                      inspectSession.shadowDetails?.rpeScores?.[id] ??
                      inspectSession.rpeScores?.[id] ??
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
                  <h4 className="text-xs font-bold text-zinc-500 uppercase">
                    Треньорски бележки
                  </h4>
                  <p className="mt-1 text-xs text-zinc-700 dark:text-zinc-300">
                    {inspectSession.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Fixed Sticky Footer */}
          <div className="flex shrink-0 items-center justify-between border-t border-zinc-100 bg-zinc-50/80 px-4 py-2.5 sm:px-5 sm:py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
            {inspectSession?.id && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const url = `${window.location.origin}${window.location.pathname}?session=${inspectSession.id}`;
                  void navigator.clipboard.writeText(url);
                  toast.success("Директният URL на сесията е копиран!");
                }}
                className="h-8 rounded-xl text-xs font-bold"
              >
                <Link2 className="mr-1.5 size-3.5" /> Копирай URL на сесията
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={handleCloseInspect}
              className="ml-auto h-9 rounded-xl px-4 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              Затвори
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
