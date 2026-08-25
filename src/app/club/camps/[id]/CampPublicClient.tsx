"use client";

import { addDays, format, isSameDay } from "date-fns";
import { bg } from "date-fns/locale";
import {
  Bus,
  Clock,
  Coffee,
  Dumbbell,
  Map,
  Moon,
  Sun,
  Ticket,
  Users,
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { getEstimatedWeather } from "@/services/weather-service";
import { CampSession } from "@/types";

interface PublicCampDay {
  date: Date;
  dateStr: string;
  label: string;
}

interface CampPublicData {
  id: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  campSessions: CampSession[];
}

interface CampPublicClientProps {
  camp: CampPublicData;
  initialDate?: string;
}

const sessionTypeIcons: Record<string, React.ElementType> = {
  training: Dumbbell,
  meal: Coffee,
  quiet_hour: Moon,
  leisure: Sun,
  attraction: Ticket,
  travel: Bus,
  other: Map,
};

const sessionTypeLabels: Record<string, string> = {
  training: "Тренировка",
  meal: "Хранене",
  quiet_hour: "Тих час / Почивка",
  leisure: "Свободно време",
  attraction: "Атракция / Събитие",
  travel: "Пътуване",
  other: "Друго",
};

const sessionTypeColors: Record<
  string,
  { bg: string; icon: string; border: string; badge: string; accent: string }
> = {
  training: {
    bg: "bg-orange-500/10 dark:bg-orange-950/20",
    icon: "text-orange-400",
    border: "border-orange-500/30",
    badge: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    accent: "bg-orange-500",
  },
  meal: {
    bg: "bg-emerald-500/10 dark:bg-emerald-950/20",
    icon: "text-emerald-400",
    border: "border-emerald-500/30",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    accent: "bg-emerald-500",
  },
  quiet_hour: {
    bg: "bg-indigo-500/10 dark:bg-indigo-950/20",
    icon: "text-indigo-400",
    border: "border-indigo-500/30",
    badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    accent: "bg-indigo-500",
  },
  leisure: {
    bg: "bg-sky-500/10 dark:bg-sky-950/20",
    icon: "text-sky-400",
    border: "border-sky-500/30",
    badge: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    accent: "bg-sky-500",
  },
  attraction: {
    bg: "bg-pink-500/10 dark:bg-pink-950/20",
    icon: "text-pink-400",
    border: "border-pink-500/30",
    badge: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    accent: "bg-pink-500",
  },
  travel: {
    bg: "bg-violet-500/10 dark:bg-violet-950/20",
    icon: "text-violet-400",
    border: "border-violet-500/30",
    badge: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    accent: "bg-violet-500",
  },
  other: {
    bg: "bg-zinc-500/10 dark:bg-zinc-900/40",
    icon: "text-zinc-400",
    border: "border-zinc-700/50",
    badge: "bg-zinc-800 text-zinc-300 border-zinc-700",
    accent: "bg-zinc-500",
  },
};

export default function CampPublicClient({
  camp,
  initialDate,
}: CampPublicClientProps) {
  // Build day list from camp dates
  const start = new Date(camp.startDate);
  const end = new Date(camp.endDate);
  const days: PublicCampDay[] = [];
  let current = start;
  let dayIndex = 1;
  while ((current <= end || isSameDay(current, end)) && dayIndex < 30) {
    days.push({
      date: current,
      dateStr: format(current, "yyyy-MM-dd"),
      label: `Ден ${dayIndex}`,
    });
    current = addDays(current, 1);
    dayIndex++;
  }

  const defaultDate = initialDate
    ? initialDate
    : days[0]?.dateStr || format(new Date(), "yyyy-MM-dd");

  const [selectedDateStr, setSelectedDateStr] = useState<string>(defaultDate);

  const currentSessions = (camp.campSessions || [])
    .filter((s) => s.date === selectedDateStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const selectedDay = days.find((d) => d.dateStr === selectedDateStr);

  return (
    <div className="flex flex-col gap-6">
      {/* Ultra-compact responsive day grid */}
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6 sm:gap-2">
        {days.map((day) => {
          const isSelected = day.dateStr === selectedDateStr;
          const hasSessions = camp.campSessions?.some(
            (s) => s.date === day.dateStr
          );
          return (
            <button
              key={day.dateStr}
              onClick={() => setSelectedDateStr(day.dateStr)}
              className={cn(
                "flex flex-col items-center justify-center rounded-xl border p-1.5 text-center transition-all sm:p-2",
                isSelected
                  ? "border-blue-500 bg-blue-500/20 text-white shadow-lg ring-2 shadow-blue-500/10 ring-blue-500/40"
                  : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/80 hover:text-zinc-200",
                hasSessions && !isSelected && "border-blue-500/30 bg-blue-500/5"
              )}
            >
              <span className="text-[11px] font-black sm:text-xs">
                {day.label}
              </span>
              <div className="flex items-center gap-1 leading-none">
                <span className="text-[9px] font-medium text-zinc-400">
                  {format(day.date, "dd MMM", { locale: bg })}
                </span>
                <span className="text-[8px] font-black text-blue-400 uppercase">
                  {format(day.date, "EEE", { locale: bg })}
                </span>
              </div>
              {hasSessions && (
                <div
                  className={cn(
                    "mt-1 size-1 rounded-full",
                    isSelected ? "bg-blue-400" : "bg-blue-500/60"
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Program schedule for selected day */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-xl backdrop-blur-xl">
        <div className="mb-6 flex flex-col gap-1 border-b border-zinc-800/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-white">
                {selectedDay?.label || "Програма"}
              </span>
              {selectedDay && (
                <span className="rounded-md border border-zinc-700 bg-zinc-800/80 px-2 py-0.5 text-xs font-semibold text-zinc-300">
                  {format(selectedDay.date, "EEEE, dd MMMM yyyy", {
                    locale: bg,
                  })}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              График и режим на тренировките и активностите за деня
            </p>
          </div>
          <div className="mt-2 flex items-center gap-2 sm:mt-0">
            <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-300">
              {currentSessions.length}{" "}
              {currentSessions.length === 1 ? "събитие" : "събития"}
            </span>
          </div>
        </div>

        {currentSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Clock className="mb-3 size-12 text-zinc-700" />
            <p className="text-base font-semibold text-zinc-400">
              Няма планирани дейности за този ден
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Програмата се обновява в реално време от треньорския щаб.
            </p>
          </div>
        ) : (
          <div className="relative space-y-3.5 before:absolute before:inset-y-3 before:left-[47px] before:w-0.5 before:bg-zinc-800 sm:before:left-[51px]">
            {currentSessions.map((session) => {
              const Icon = sessionTypeIcons[session.type] || Map;
              const colors =
                sessionTypeColors[session.type] || sessionTypeColors.other;
              const weather = getEstimatedWeather(
                camp.location,
                selectedDateStr,
                session.startTime
              );

              return (
                <div
                  key={session.id}
                  className={cn(
                    "relative flex items-start gap-3.5 rounded-xl border p-3.5 transition-all sm:gap-4 sm:p-4",
                    colors.border,
                    colors.bg
                  )}
                >
                  {/* Timeline Time Box */}
                  <div className="relative z-10 flex w-20 shrink-0 flex-col items-center justify-center rounded-xl border border-zinc-700/80 bg-zinc-950 p-2 text-center shadow-md sm:w-24 sm:py-2.5">
                    <span className="text-xs font-black tracking-tight text-white sm:text-sm">
                      {session.startTime}
                    </span>
                    <div className="my-1 h-px w-full bg-zinc-800" />
                    <span className="text-[11px] font-medium text-zinc-400">
                      {session.endTime}
                    </span>
                    <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1 border-t border-zinc-800/80 pt-1">
                      <span
                        className="inline-flex items-center gap-0.5 rounded-full border border-amber-800/50 bg-amber-950/60 px-1.5 py-0.5 text-[9px] font-bold text-amber-300"
                        title={`Въздух: ${weather.airTemp}°C (${weather.conditionText})`}
                      >
                        <span>{weather.iconEmoji}</span>
                        <span>{weather.airTemp}°</span>
                      </span>
                      {weather.waterTemp !== undefined && (
                        <span
                          className="inline-flex items-center gap-0.5 rounded-full border border-cyan-800/50 bg-cyan-950/60 px-1.5 py-0.5 text-[9px] font-bold text-cyan-300"
                          title={`Вода: ${weather.waterTemp}°C`}
                        >
                          <span>🌊</span>
                          <span>{weather.waterTemp}°</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content card */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          "flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase",
                          colors.badge
                        )}
                      >
                        <Icon size={12} className={colors.icon} />
                        {sessionTypeLabels[session.type] || session.type}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white sm:text-base">
                      {session.title}
                    </h3>

                    {session.description && (
                      <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                        {session.description}
                      </p>
                    )}

                    {session.groups && session.groups.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400">
                          <Users size={12} className="text-zinc-500" /> Групи:
                        </span>
                        {session.groups.map((g) => (
                          <span
                            key={g.id}
                            className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-300"
                          >
                            {g.name} · {g.memberIds.length} участници
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
