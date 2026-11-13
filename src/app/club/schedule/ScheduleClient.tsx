"use client";

import {
  Calendar as CalendarIcon,
  ChevronRight,
  Search,
  Share2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { PublicFooter } from "@/components/layout/public-footer";
import { PublicNav } from "@/components/layout/public-nav";
import { PublicEventCard } from "@/components/shared/schedule/PublicEventCard";
import { Site } from "@/types/site.types";

interface EventSlot {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  type?: string;
  isTournament?: boolean;
  isCancelled?: boolean;
  description?: string;
  location?: string;
  tournamentUrl?: string | null;
  tournamentId?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: "pdf" | "word" | "excel" | "other" | null;
}

interface Props {
  schedule: EventSlot[];
  clubSite?: Site | null;
}

// Group events by date label
function groupByDate(events: EventSlot[]): Record<string, EventSlot[]> {
  return events.reduce(
    (acc, event) => {
      const date = new Date(event.startTime);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      let label: string;
      if (date >= today && date < tomorrow) {
        label = "Днес";
      } else if (
        date >= tomorrow &&
        date < new Date(tomorrow.getTime() + 86400000)
      ) {
        label = "Утре";
      } else {
        label = date.toLocaleDateString("bg-BG", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        // Capitalize first letter
        label = label.charAt(0).toUpperCase() + label.slice(1);
      }

      if (!acc[label]) acc[label] = [];
      acc[label].push(event);
      return acc;
    },
    {} as Record<string, EventSlot[]>
  );
}

type ScheduleFilter = "all" | "trainings" | "tournaments" | "events";

function getEmptyTitle(filter: ScheduleFilter): string {
  if (filter === "tournaments") return "Няма предстоящи състезания или турнири";
  if (filter === "trainings") return "Няма предстоящи тренировки";
  if (filter === "events") return "Няма предстоящи лагери или клубни събития";
  return "Няма предстоящи събития";
}

function getEmptySubtitle(filter: ScheduleFilter): string {
  if (filter === "tournaments") {
    return "Следете тук за обявяване на нови турнири и наредби от БФБ.";
  }
  if (filter === "trainings") {
    return "Проверете по-късно за актуалния график на тренировките.";
  }
  if (filter === "events") {
    return "Следете тук за нови клубни лагери, събития и инициативи.";
  }
  return "Проверете по-късно за актуалния график.";
}

function getMonthKey(dateInput: string): string {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) return monthKey;
  const date = new Date(year, month - 1, 1);
  const label = date.toLocaleDateString("bg-BG", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const isCompetitionEvent = (e: EventSlot) =>
  Boolean(e.isTournament) ||
  e.type === "competition" ||
  Boolean(e.tournamentUrl) ||
  Boolean(e.tournamentId);

const isClubEvent = (e: EventSlot) =>
  !isCompetitionEvent(e) &&
  (e.type === "camp" || e.type === "event" || e.type === "other");

const isTrainingEvent = (e: EventSlot) =>
  !isCompetitionEvent(e) && (e.type === "training" || !e.type);

export default function ScheduleClient({ schedule, clubSite }: Props) {
  const [filter, setFilter] = useState<ScheduleFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const hasSyncedFromUrl = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (
        tabParam === "tournaments" ||
        tabParam === "trainings" ||
        tabParam === "events"
      ) {
        setFilter(tabParam);
      } else {
        setFilter("all");
      }
      setSearchQuery(params.get("q") || "");
      setSelectedMonth(params.get("month") || "all");
    };

    syncFromUrl();
    hasSyncedFromUrl.current = true;

    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !hasSyncedFromUrl.current) return;

    const url = new URL(window.location.href);
    if (filter !== "all") {
      url.searchParams.set("tab", filter);
    } else {
      url.searchParams.delete("tab");
    }

    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      url.searchParams.set("q", trimmedQuery);
    } else {
      url.searchParams.delete("q");
    }

    if (selectedMonth !== "all") {
      url.searchParams.set("month", selectedMonth);
    } else {
      url.searchParams.delete("month");
    }

    const nextRelativeUrl =
      url.pathname + (url.search ? url.search : "") + url.hash;
    const currentRelativeUrl =
      window.location.pathname + window.location.search + window.location.hash;

    if (nextRelativeUrl !== currentRelativeUrl) {
      window.history.replaceState({}, "", nextRelativeUrl);
    }
  }, [filter, searchQuery, selectedMonth]);

  const availableMonths = useMemo(() => {
    const keys = new Set<string>();
    schedule.forEach((event) => {
      const key = getMonthKey(event.startTime);
      if (key) keys.add(key);
    });
    return Array.from(keys).sort();
  }, [schedule]);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return schedule.filter((event) => {
      if (filter === "trainings" && !isTrainingEvent(event)) return false;
      if (filter === "tournaments" && !isCompetitionEvent(event)) return false;
      if (filter === "events" && !isClubEvent(event)) return false;

      if (selectedMonth !== "all") {
        if (getMonthKey(event.startTime) !== selectedMonth) return false;
      }

      if (normalizedQuery) {
        const titleMatch = event.title.toLowerCase().includes(normalizedQuery);
        const locationMatch = (event.location || "")
          .toLowerCase()
          .includes(normalizedQuery);
        if (!titleMatch && !locationMatch) return false;
      }

      return true;
    });
  }, [schedule, filter, selectedMonth, searchQuery]);

  const trainingsCount = schedule.filter(isTrainingEvent).length;
  const tournamentsCount = schedule.filter(isCompetitionEvent).length;
  const eventsCount = schedule.filter(isClubEvent).length;

  const grouped = groupByDate(filteredEvents);
  const groups = Object.entries(grouped);

  const handleShare = async () => {
    const shareData = {
      title: "График - БК Гълъбово",
      text: "Вижте предстоящите тренировки и събития на Бадминтон клуб Гълъбово.",
      url: window.location.href,
    };

    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare(shareData)
    ) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          console.error("Error sharing:", err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Връзката е копирана!", {
          description: "Можете да я поставите и споделите навсякъде.",
        });
      } catch {
        toast.error("Неуспешно копиране на връзката.");
      }
    }
  };

  // Detect "Днес" / "Утре" for badge
  const isSpecialLabel = (label: string) =>
    label === "Днес" || label === "Утре";

  return (
    <div className="public-portal-shell min-h-screen overflow-x-hidden bg-zinc-950 font-sans text-white">
      <PublicNav clubSite={clubSite} />

      <main
        id="main-content"
        className="px-4 pt-20 pb-16 sm:px-6 sm:pt-24 sm:pb-20"
      >
        <div className="m-auto max-w-4xl">
          {/* Breadcrumbs */}
          <nav
            aria-label="Навигационна пътека"
            className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-zinc-400"
          >
            <Link href="/" className="transition-colors hover:text-white">
              Портал
            </Link>
            <ChevronRight size={12} aria-hidden="true" />
            <Link
              href="/club"
              className="transition-colors hover:text-blue-400"
            >
              БК Гълъбово
            </Link>
            <ChevronRight size={12} aria-hidden="true" />
            <span className="font-medium text-blue-400">График</span>
          </nav>

          {/* Header */}
          <div className="mb-6 w-full sm:mb-8">
            <div className="flex w-full flex-col items-start justify-between gap-4 sm:flex-row sm:items-center sm:gap-5">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-blue-800/50 bg-black text-blue-400 shadow-[0_0_20px_rgba(30,58,138,0.25)] sm:size-14">
                  <CalendarIcon size={24} className="sm:size-7" />
                </div>
                <div>
                  <p className="mb-0.5 text-[10px] font-bold tracking-[0.4em] text-blue-400 uppercase sm:mb-1 sm:text-[11px]">
                    График
                  </p>
                  <h1 className="text-2xl font-black tracking-tight sm:text-3xl md:text-4xl">
                    Календар и Събития
                  </h1>
                  <p className="mt-0.5 text-xs text-zinc-300 sm:mt-1 sm:text-sm">
                    Вижте всички тренировки, лагери и турнири на клуба.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleShare}
                className="flex shrink-0 items-center gap-2 rounded-xl border border-blue-700/50 bg-blue-600/15 px-4 py-2 text-xs font-semibold text-blue-300 transition-all hover:border-blue-500/70 hover:bg-blue-600/25 sm:px-5 sm:py-2.5 sm:text-sm"
              >
                <Share2 size={15} />
                <span>Сподели Графика</span>
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="mt-8 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold tracking-wider uppercase transition-all ${
                  filter === "all"
                    ? "bg-zinc-100 text-zinc-950 shadow-md"
                    : "border border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:text-white"
                }`}
              >
                <span>Всички</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    filter === "all"
                      ? "bg-zinc-200 text-black"
                      : "bg-zinc-800 text-zinc-200"
                  }`}
                >
                  {schedule.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilter("trainings")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold tracking-wider uppercase transition-all ${
                  filter === "trainings"
                    ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                    : "border border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:text-white"
                }`}
              >
                <span>🏸 Тренировки</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    filter === "trainings"
                      ? "bg-blue-950 text-blue-100"
                      : "bg-zinc-800 text-zinc-200"
                  }`}
                >
                  {trainingsCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilter("tournaments")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold tracking-wider uppercase transition-all ${
                  filter === "tournaments"
                    ? "bg-amber-500 font-black text-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                    : "border border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:text-white"
                }`}
              >
                <span>🏆 Състезания</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                    filter === "tournaments"
                      ? "bg-amber-950 text-amber-100"
                      : "bg-zinc-800 text-zinc-200"
                  }`}
                >
                  {tournamentsCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilter("events")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold tracking-wider uppercase transition-all ${
                  filter === "events"
                    ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                    : "border border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:text-white"
                }`}
              >
                <span>⛺ Лагери и събития</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    filter === "events"
                      ? "bg-purple-950 text-purple-100"
                      : "bg-zinc-800 text-zinc-200"
                  }`}
                >
                  {eventsCount}
                </span>
              </button>
            </div>

            {/* Search & Month Filter */}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-500"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Търси по заглавие или локация..."
                  aria-label="Търси събитие по заглавие или локация"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 py-2.5 px-10 text-sm text-white placeholder:text-zinc-500 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Изчисти търсенето"
                    className="absolute top-1/2 right-2.5 flex size-6 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {availableMonths.length > 0 && (
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  aria-label="Филтрирай по месец"
                  className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2.5 text-sm text-white focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 focus:outline-none sm:w-56"
                >
                  <option value="all">Всички месеци</option>
                  {availableMonths.map((monthKey) => (
                    <option key={monthKey} value={monthKey}>
                      {formatMonthLabel(monthKey)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Content */}
          {filteredEvents.length === 0 ? (
            <div className="rounded-3xl border border-zinc-800 bg-black/60 p-16 text-center">
              <CalendarIcon size={56} className="mx-auto mb-6 text-zinc-700" />
              <p className="mb-2 text-2xl font-light text-white">
                {searchQuery.trim() || selectedMonth !== "all"
                  ? "Няма намерени събития по зададените филтри"
                  : getEmptyTitle(filter)}
              </p>
              <p className="text-zinc-300">
                {searchQuery.trim() || selectedMonth !== "all"
                  ? "Опитайте с друга ключова дума или изчистете филтрите."
                  : getEmptySubtitle(filter)}
              </p>
              {(searchQuery.trim() ||
                selectedMonth !== "all" ||
                filter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setFilter("all");
                    setSearchQuery("");
                    setSelectedMonth("all");
                  }}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-300 transition-colors hover:bg-blue-500/20 hover:text-white"
                >
                  Изчисти филтрите
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-10">
              {groups.map(([dateLabel, events], groupIdx) => (
                <div key={dateLabel}>
                  {/* Date Header */}
                  <div className="mb-4 flex items-center gap-4">
                    <span
                      suppressHydrationWarning
                      className={`rounded-full px-3 py-1 text-xs font-bold tracking-[0.35em] uppercase ${
                        isSpecialLabel(dateLabel)
                          ? "border border-blue-600/40 bg-blue-600/20 text-blue-300"
                          : "text-zinc-300"
                      }`}
                    >
                      {dateLabel}
                    </span>
                    <div className="h-px flex-1 bg-zinc-800" />
                  </div>

                  {/* Events for this date */}
                  <div className="space-y-3">
                    {events.map((event, i) => (
                      <PublicEventCard
                        key={event.id}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        event={event as any}
                        groupIdx={groupIdx}
                        i={i}
                        showAdminLinks={false}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer CTA */}
          <div className="mt-16 text-center">
            <p className="mb-4 text-sm text-zinc-300">
              Имате въпроси за графика?
            </p>
            <Link
              href="/club#contacts"
              className="inline-flex items-center gap-2 rounded-2xl border border-blue-700/50 bg-blue-600/15 px-8 py-4 text-sm font-bold tracking-widest text-blue-300 uppercase transition-all hover:border-blue-500/70 hover:bg-blue-600/25 hover:text-white"
            >
              Свържете се с нас <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter clubSite={clubSite} />
    </div>
  );
}
