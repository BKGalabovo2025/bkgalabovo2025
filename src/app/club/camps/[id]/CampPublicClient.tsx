"use client";

import { addDays, format, isSameDay } from "date-fns";
import { bg } from "date-fns/locale";
import { Bus, Clock, Coffee, Dumbbell, Map, Sun } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
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
  leisure: Sun,
  travel: Bus,
  other: Map,
};

const sessionTypeLabels: Record<string, string> = {
  training: "Тренировка",
  meal: "Хранене",
  leisure: "Свободно време",
  travel: "Пътуване",
  other: "Друго",
};

const sessionTypeColors: Record<
  string,
  { bg: string; icon: string; border: string; badge: string }
> = {
  training: {
    bg: "bg-orange-500/10",
    icon: "text-orange-400",
    border: "border-orange-500/20",
    badge: "bg-orange-500/10 text-orange-300",
  },
  meal: {
    bg: "bg-green-500/10",
    icon: "text-green-400",
    border: "border-green-500/20",
    badge: "bg-green-500/10 text-green-300",
  },
  leisure: {
    bg: "bg-sky-500/10",
    icon: "text-sky-400",
    border: "border-sky-500/20",
    badge: "bg-sky-500/10 text-sky-300",
  },
  travel: {
    bg: "bg-violet-500/10",
    icon: "text-violet-400",
    border: "border-violet-500/20",
    badge: "bg-violet-500/10 text-violet-300",
  },
  other: {
    bg: "bg-zinc-500/10",
    icon: "text-zinc-400",
    border: "border-zinc-500/20",
    badge: "bg-zinc-500/10 text-zinc-300",
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
      {/* Day selector */}
      <div className="flex scrollbar-thin gap-2 overflow-x-auto pb-2">
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
                "flex min-w-28 flex-col items-center justify-center rounded-xl border p-3 text-sm transition-all duration-200",
                isSelected
                  ? "border-blue-400/50 bg-blue-500/15 text-blue-300 shadow-[0_0_16px_rgba(59,130,246,0.15)]"
                  : "border-zinc-700/50 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              )}
            >
              <span className="font-bold">{day.label}</span>
              <span className="mt-1 text-[11px] opacity-70">
                {format(day.date, "dd MMM", { locale: bg })}
              </span>
              {hasSessions && (
                <div
                  className={cn(
                    "mt-2 size-1.5 rounded-full",
                    isSelected ? "bg-blue-400" : "bg-blue-500/60"
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Sessions for selected day */}
      <div className="rounded-2xl border border-zinc-700/50 bg-zinc-900/40 p-5 backdrop-blur-sm">
        <h2 className="mb-5 text-base font-semibold text-zinc-200">
          Програма за{" "}
          <span className="text-blue-400">{selectedDay?.label}</span>
          {selectedDay && (
            <span className="ml-2 text-xs font-normal text-zinc-500">
              ({format(selectedDay.date, "dd MMMM yyyy", { locale: bg })})
            </span>
          )}
        </h2>

        {currentSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <Clock className="mb-3 size-12 text-zinc-700" />
            <p className="text-sm text-zinc-500">
              Няма добавени дейности за този ден.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentSessions.map((session) => {
              const Icon = sessionTypeIcons[session.type] || Map;
              const colors =
                sessionTypeColors[session.type] || sessionTypeColors.other;
              return (
                <div
                  key={session.id}
                  className={cn(
                    "flex items-start gap-4 rounded-xl border p-4 transition-all",
                    colors.border,
                    colors.bg
                  )}
                >
                  {/* Time */}
                  <div className="flex w-20 shrink-0 flex-col items-center justify-center rounded-lg border border-zinc-700/50 bg-zinc-950/60 px-2 py-2.5 text-center">
                    <span className="text-sm font-bold text-zinc-200">
                      {session.startTime}
                    </span>
                    <div className="my-1 h-px w-full bg-zinc-700/50" />
                    <span className="text-xs text-zinc-500">
                      {session.endTime}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <div
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full",
                          colors.bg
                        )}
                      >
                        <Icon size={13} className={colors.icon} />
                      </div>
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                          colors.badge
                        )}
                      >
                        {sessionTypeLabels[session.type] || session.type}
                      </span>
                    </div>
                    <h3 className="text-sm leading-snug font-semibold text-zinc-100">
                      {session.title}
                    </h3>
                    {session.description && (
                      <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                        {session.description}
                      </p>
                    )}
                    {session.groups && session.groups.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {session.groups.map((g) => (
                          <span
                            key={g.id}
                            className="rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] text-indigo-300"
                          >
                            {g.name} · {g.memberIds.length} уч.
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
