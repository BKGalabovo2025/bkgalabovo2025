"use client";

import { addDays, format, isBefore, isSameDay, startOfDay } from "date-fns";
import { bg } from "date-fns/locale";
import {
  Bus,
  Check,
  Clock,
  Coffee,
  Dumbbell,
  Map,
  MapPin,
  Moon,
  Sun,
  Ticket,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { CoachNotesCard } from "@/components/training/CoachNotesCard";
import { useCampSeenSessions } from "@/hooks/useCampSeenSessions";
import { cn } from "@/lib/utils";
import {
  fetchLiveCampForecast,
  getEstimatedWeather,
  LocationWeatherForecast,
} from "@/services/weather-service";
import { CampSession } from "@/types";

const getLocationLabel = (loc: string) => {
  if (loc === "court") return "Спортна зала";
  if (loc === "stadium") return "Стадион";
  if (loc === "beach") return "Плаж";
  if (loc === "other") return "Друго";
  return loc;
};

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
  attendees?: { memberId: string; name: string }[];
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

const getPublicDayButtonClass = (
  isSelected: boolean,
  isCurrentDay: boolean,
  isPast: boolean,
  hasSessions: boolean,
  showNewIndicator: boolean
) => {
  if (isSelected) {
    return "border-blue-500 bg-blue-500/20 text-white shadow-lg ring-2 shadow-blue-500/10 ring-blue-500/40";
  }
  if (showNewIndicator) {
    return "border-rose-500/80 bg-rose-500/15 text-rose-200 ring-2 ring-rose-500/40 hover:bg-rose-500/25";
  }
  if (isCurrentDay) {
    return "border-amber-400 bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/40 hover:bg-amber-500/25";
  }
  if (isPast) {
    return "border-emerald-800/40 bg-emerald-950/20 text-zinc-300 hover:border-emerald-700/60 hover:bg-emerald-950/30";
  }
  if (hasSessions) {
    return "border-blue-500/30 bg-blue-500/5 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/80 hover:text-zinc-200";
  }
  return "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/80 hover:text-zinc-200";
};

const getPublicDotClass = (isCurrentDay: boolean, isSelected: boolean) => {
  if (isCurrentDay) return "bg-amber-400";
  if (isSelected) return "bg-blue-400";
  return "bg-blue-500/60";
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

  const todayDate = startOfDay(new Date());
  const todayStr = format(todayDate, "yyyy-MM-dd");

  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    if (initialDate) return initialDate;
    const todayMatch = days.find((d) => d.dateStr === todayStr);
    if (todayMatch) return todayMatch.dateStr;
    const lastDay = days[days.length - 1];
    if (lastDay && isBefore(startOfDay(lastDay.date), todayDate)) {
      return lastDay.dateStr;
    }
    return days[0]?.dateStr || todayStr;
  });
  const [liveWeatherMap, setLiveWeatherMap] = useState<
    Record<string, LocationWeatherForecast>
  >({});

  const campSessionsList = useMemo(
    () => camp.campSessions || [],
    [camp.campSessions]
  );

  const { hasNewSessionsOnDate, seenSessionIds } = useCampSeenSessions(
    camp.id,
    selectedDateStr,
    campSessionsList
  );

  useEffect(() => {
    if (camp.location) {
      fetchLiveCampForecast(camp.location)
        .then(setLiveWeatherMap)
        .catch((err) =>
          console.warn("Could not load public live weather:", err)
        );
    }
  }, [camp.location]);

  const currentSessions = (camp.campSessions || [])
    .filter((s) => s.date === selectedDateStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const selectedDay = days.find((d) => d.dateStr === selectedDateStr);

  return (
    <div className="flex flex-col gap-6">
      {/* Ultra-compact responsive day grid */}
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6 sm:gap-2">
        {days.map((day) => {
          const dayStart = startOfDay(day.date);
          const isSelected = day.dateStr === selectedDateStr;
          const isPast = isBefore(dayStart, todayDate);
          const isCurrentDay = isSameDay(dayStart, todayDate);
          const hasSessions = camp.campSessions?.some(
            (s) => s.date === day.dateStr
          );
          const hasNewSessions = hasNewSessionsOnDate(day.dateStr);
          const showNewIndicator = !isPast && !isSelected && hasNewSessions;

          return (
            <button
              key={day.dateStr}
              onClick={() => setSelectedDateStr(day.dateStr)}
              className={cn(
                "group relative flex flex-col items-center justify-center rounded-xl border p-1.5 text-center transition-all sm:p-2",
                getPublicDayButtonClass(
                  isSelected,
                  isCurrentDay,
                  isPast,
                  Boolean(hasSessions),
                  showNewIndicator
                )
              )}
            >
              <div className="flex w-full items-center justify-between px-0.5">
                <span className="text-[11px] font-black sm:text-xs">
                  {day.label}
                </span>
                {isPast && (
                  <span
                    className="inline-flex items-center rounded-full bg-emerald-500/20 p-0.5 text-emerald-400"
                    title="Отминал ден (Завършил)"
                  >
                    <Check size={10} strokeWidth={3} />
                  </span>
                )}
                {isCurrentDay && !showNewIndicator && (
                  <span
                    className="inline-flex items-center rounded-xs bg-amber-500 px-1 py-0.5 text-[8px] font-black text-white uppercase"
                    title="Текущ ден (Днес)"
                  >
                    Днес
                  </span>
                )}
                {showNewIndicator && (
                  <span
                    className="inline-flex animate-pulse items-center rounded-xs bg-rose-500 px-1 py-0.5 text-[8px] font-black text-white uppercase shadow-xs"
                    title="Има ново добавено събитие"
                  >
                    ✨ Ново
                  </span>
                )}
              </div>

              <div className="mt-0.5 flex items-center gap-1 leading-none">
                <span className="text-[9px] font-medium text-zinc-400">
                  {format(day.date, "dd MMM", { locale: bg })}
                </span>
                <span
                  className={cn(
                    "text-[8px] font-black uppercase",
                    isCurrentDay ? "text-amber-400" : "text-blue-400"
                  )}
                >
                  {format(day.date, "EEE", { locale: bg })}
                </span>
              </div>
              {hasSessions && (
                <div
                  className={cn(
                    "mt-1 size-1 rounded-full",
                    getPublicDotClass(isCurrentDay, isSelected)
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

        {/* Day Forecast Summary Banner */}
        {(() => {
          const dayWeather = getEstimatedWeather(
            camp.location,
            selectedDateStr,
            "12:00",
            liveWeatherMap
          );
          return (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-3.5 py-2.5 text-xs text-zinc-200 shadow-inner">
              <div className="flex items-center gap-2 font-medium">
                <span className="text-zinc-400">Прогноза:</span>
                <span className="font-bold text-white">
                  {dayWeather.iconEmoji} {dayWeather.conditionText}
                </span>
                {dayWeather.isLive && (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                    🟢 На живо
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 font-semibold">
                <span
                  title={`Въздух: Мин ${dayWeather.minAirTemp ?? dayWeather.airTemp}°C / Макс ${dayWeather.maxAirTemp ?? dayWeather.airTemp}°C`}
                  className="inline-flex items-center gap-1 text-amber-300"
                >
                  <span>☀️</span>
                  <span>{dayWeather.airTemp}°C</span>
                </span>
                {dayWeather.waterTemp !== undefined && (
                  <span
                    title="Морска вода"
                    className="inline-flex items-center gap-1 text-cyan-300"
                  >
                    <span>🌊</span>
                    <span>{dayWeather.waterTemp}°C</span>
                  </span>
                )}
                <span
                  title="Вероятност за дъжд"
                  className={cn(
                    "inline-flex items-center gap-1",
                    (dayWeather.rainProbability ?? 0) > 40
                      ? "font-bold text-blue-300"
                      : "text-zinc-300"
                  )}
                >
                  <span>💧</span>
                  <span>{dayWeather.rainProbability ?? 0}%</span>
                </span>
                {dayWeather.waveHeight !== undefined && (
                  <span
                    title={dayWeather.seaStateLabel}
                    className="inline-flex items-center gap-1 text-teal-300"
                  >
                    <span>{dayWeather.seaStateFlag || "🌊"}</span>
                    <span>
                      {dayWeather.waveHeight} м ({dayWeather.seaStateBalls}{" "}
                      бала)
                    </span>
                  </span>
                )}
              </div>
            </div>
          );
        })()}

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
                session.startTime,
                liveWeatherMap
              );

              return (
                <div
                  key={session.id}
                  className={cn(
                    "relative flex items-start gap-3.5 rounded-xl border p-3.5 transition-all sm:gap-4 sm:p-4",
                    session.isCancelled
                      ? "border-rose-950/40 bg-rose-950/15 opacity-75"
                      : cn(colors.border, colors.bg)
                  )}
                >
                  {/* Timeline Time Box */}
                  <div className="relative z-10 flex w-24 shrink-0 flex-col items-center justify-center rounded-xl border border-zinc-700/80 bg-zinc-950 p-2 text-center shadow-md sm:w-28 sm:py-2.5">
                    <span
                      className={cn(
                        "text-xs font-black tracking-tight sm:text-sm",
                        session.isCancelled
                          ? "text-zinc-500 line-through"
                          : "text-white"
                      )}
                    >
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
                      <span
                        className="inline-flex items-center gap-0.5 rounded-full border border-blue-800/50 bg-blue-950/60 px-1.5 py-0.5 text-[9px] font-bold text-blue-300"
                        title={`Вероятност за дъжд: ${weather.rainProbability ?? 0}%`}
                      >
                        <span>💧</span>
                        <span>{weather.rainProbability ?? 0}%</span>
                      </span>
                      {weather.waveHeight !== undefined && (
                        <span
                          className="inline-flex items-center gap-0.5 rounded-full border border-teal-800/50 bg-teal-950/60 px-1.5 py-0.5 text-[9px] font-bold text-teal-300"
                          title={`Вълнение на морето: ${weather.waveHeight} м (${weather.seaStateLabel})`}
                        >
                          <span>{weather.seaStateFlag || "🌊"}</span>
                          <span>{weather.waveHeight}м</span>
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
                      {!seenSessionIds.has(session.id) &&
                        !session.isCancelled && (
                          <span className="flex animate-pulse items-center gap-1 rounded-md border border-rose-500/50 bg-rose-500/20 px-2 py-0.5 text-[10px] font-black tracking-wide text-rose-300 uppercase shadow-xs">
                            ✨ Ново
                          </span>
                        )}
                      {session.isCancelled && (
                        <span className="flex items-center gap-1 rounded-md border border-rose-500/40 bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-rose-300 uppercase">
                          🚫 Отменено от треньора
                        </span>
                      )}
                    </div>

                    <h3
                      className={cn(
                        "text-sm font-bold sm:text-base",
                        session.isCancelled
                          ? "text-zinc-400 line-through"
                          : "text-white"
                      )}
                    >
                      {session.title}
                    </h3>

                    {session.location && (
                      <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-zinc-400">
                        <MapPin size={12} className="text-zinc-500" />
                        {getLocationLabel(session.location)}
                      </div>
                    )}

                    {session.groups && session.groups.length > 0 && (
                      <div className="mt-2.5 flex flex-col gap-1.5 rounded-md border border-zinc-800/60 bg-zinc-900/40 p-2.5">
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400">
                          <Users size={12} className="text-zinc-500" /> Групи:
                        </span>
                        {session.groups.map((sg) => {
                          const groupAttendees =
                            camp.attendees?.filter((a) =>
                              sg.memberIds.includes(a.memberId)
                            ) || [];
                          return (
                            <div
                              key={sg.id}
                              className="text-[11px] text-zinc-500"
                            >
                              <span className="font-semibold text-zinc-300">
                                {sg.name}
                              </span>{" "}
                              · {sg.memberIds.length} участници
                              {groupAttendees.length > 0 && (
                                <details className="group/group-details mt-1 [&_summary::-webkit-details-marker]:hidden">
                                  <summary className="cursor-pointer text-[10px] font-semibold text-indigo-400 hover:text-indigo-300">
                                    Виж участниците
                                  </summary>
                                  <ul className="mt-1.5 space-y-1 border-l border-zinc-700 pl-2">
                                    {groupAttendees.map((a) => (
                                      <li
                                        key={a.memberId}
                                        className="text-[11px] leading-tight text-zinc-400"
                                      >
                                        • {a.name}
                                      </li>
                                    ))}
                                  </ul>
                                </details>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {session.description && (
                      <CoachNotesCard
                        notes={session.description}
                        className="mt-3 border-amber-800/40 bg-amber-950/30"
                      />
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
