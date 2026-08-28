"use client";

import { addDays, format, isBefore, isSameDay, startOfDay } from "date-fns";
import { bg } from "date-fns/locale";
import {
  Ban,
  Bus,
  CalendarRange,
  Check,
  Clock,
  Coffee,
  Copy,
  Dumbbell,
  Edit,
  Map,
  Moon,
  Play,
  Plus,
  RotateCcw,
  Search,
  Sun,
  Ticket,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

import CreateSessionWizard from "@/app/(protected)/training/planner/create-session-wizard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCampSeenSessions } from "@/hooks/useCampSeenSessions";
import { cn } from "@/lib/utils";
import { plannerService } from "@/services/planner-service";
import { updateCampSessions } from "@/services/schedule-service";
import {
  getEstimatedWeather,
  LocationWeatherForecast,
} from "@/services/weather-service";
import { useAppStore } from "@/store/use-app-store";
import { CampSession, ScheduleEvent } from "@/types";
import { Exercise, PlannerSession } from "@/types/planner.types";

const getDayButtonClass = (
  isSelected: boolean,
  isCurrentDay: boolean,
  isPast: boolean,
  hasContent: boolean,
  showNewIndicator: boolean
) => {
  if (isSelected) {
    return "border-indigo-600 bg-indigo-50/95 font-bold text-indigo-950 shadow-xs ring-2 ring-indigo-500/40 dark:border-indigo-500 dark:bg-indigo-950/70 dark:text-white";
  }
  if (showNewIndicator) {
    return "border-rose-400 bg-rose-50/80 text-rose-950 ring-2 ring-rose-400/50 hover:bg-rose-100 dark:border-rose-600 dark:bg-rose-950/50 dark:text-rose-100";
  }
  if (isCurrentDay) {
    return "border-amber-400 bg-amber-50/80 text-amber-950 ring-2 ring-amber-400/50 hover:bg-amber-100 dark:border-amber-600 dark:bg-amber-950/50 dark:text-amber-100";
  }
  if (isPast) {
    return "border-emerald-200/80 bg-emerald-50/40 text-zinc-600 hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-zinc-400";
  }
  if (hasContent) {
    return "border-indigo-200/50 bg-indigo-50/20 hover:bg-zinc-100 dark:border-indigo-900/20 dark:bg-zinc-900/40 dark:hover:bg-zinc-800";
  }
  return "border-zinc-200 bg-zinc-50/60 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:bg-zinc-800";
};

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

export function CampItineraryClient({
  camp,
  liveWeatherMap,
}: {
  camp: ScheduleEvent;
  liveWeatherMap?: Record<string, LocationWeatherForecast>;
}) {
  const getLocLabel = (loc: string) => {
    if (loc === "court") return "В зала";
    if (loc === "stadium") return "Стадион";
    if (loc === "beach") return "Плаж";
    // Custom / manual location — show as-is
    return loc || "Плаж";
  };
  const getPhaseLabel = (phase: string) => {
    if (phase === "warmup") return "Загрявка";
    if (phase === "main") return "Основна";
    return "Разпускане";
  };
  const { activeBranch } = useAppStore();
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [plannerSessions, setPlannerSessions] = useState<PlannerSession[]>([]);

  useEffect(() => {
    if (activeBranch) {
      plannerService
        .getExercises(activeBranch)
        .then(setAvailableExercises)
        .catch(console.error);

      plannerService
        .getSessionsByCampId(activeBranch, camp.id)
        .then(setPlannerSessions)
        .catch(console.error);
    }
  }, [activeBranch, camp.id]);

  const [sessions, setSessions] = useState<CampSession[]>(
    camp.campSessions || []
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlannerWizardOpen, setIsPlannerWizardOpen] = useState(false);
  const [plannerSessionToEdit, setPlannerSessionToEdit] = useState<
    PlannerSession | undefined
  >(undefined);

  // Generate days based on camp dates
  const start = new Date(camp.startDate);
  const end = new Date(camp.endDate);

  const days: { date: Date; dateStr: string; label: string }[] = [];
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
    const todayMatch = days.find((d) => d.dateStr === todayStr);
    if (todayMatch) return todayMatch.dateStr;
    const lastDay = days[days.length - 1];
    if (lastDay && isBefore(startOfDay(lastDay.date), todayDate)) {
      return lastDay.dateStr;
    }
    return days[0]?.dateStr || todayStr;
  });

  const allCampSessionDateItems = useMemo(
    () => [
      ...sessions.map((s) => ({ id: s.id, date: s.date })),
      ...plannerSessions.map((ps) => ({ id: ps.id, date: ps.date })),
    ],
    [sessions, plannerSessions]
  );

  const { hasNewSessionsOnDate } = useCampSeenSessions(
    camp.id,
    selectedDateStr,
    allCampSessionDateItems
  );

  const currentDaysSessions = sessions
    .filter((s) => s.date === selectedDateStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Planner sessions for the selected day
  const currentDayPlannerSessions = plannerSessions.filter(
    (s) => s.date === selectedDateStr
  );

  // Form State
  const [formId, setFormId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState<string>(""); // Track original session date when editing
  const [formType, setFormType] = useState<CampSession["type"]>("training");
  const [formTitle, setFormTitle] = useState("");
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState("11:00");
  const [formExercises, setFormExercises] = useState<string[]>([]);
  const [formGroups, setFormGroups] = useState<
    { id: string; name: string; memberIds: string[] }[]
  >([]);
  const [newGroupName, setNewGroupName] = useState("");

  const defaultEventConfigs: Record<
    string,
    { title: string; startTime: string; endTime: string }
  > = {
    meal: {
      title: "Закуска / Обяд / Вечеря",
      startTime: "08:00",
      endTime: "09:00",
    },
    leisure: {
      title: "Свободно време / Почивка",
      startTime: "14:00",
      endTime: "16:00",
    },
    travel: {
      title: "Пътуване / Транспорт",
      startTime: "10:00",
      endTime: "11:30",
    },
    other: {
      title: "Атракцион / Събитие",
      startTime: "17:00",
      endTime: "19:00",
    },
  };

  const handleOpenModal = (
    session?: CampSession,
    defaultType: CampSession["type"] = "meal"
  ) => {
    if (session) {
      setFormId(session.id);
      setFormDate(session.date);
      setFormType(session.type);
      setFormTitle(session.title);
      setFormStartTime(session.startTime);
      setFormEndTime(session.endTime);
      setFormExercises(session.exercises || []);
      setFormGroups(session.groups || []);
      setNewGroupName("");
    } else {
      const config = defaultEventConfigs[defaultType] || {
        title: "",
        startTime: "09:00",
        endTime: "10:00",
      };
      setFormId(null);
      setFormDate("");
      setFormType(defaultType);
      setFormTitle(config.title);
      setFormStartTime(config.startTime);
      setFormEndTime(config.endTime);
      setFormExercises([]);
      setFormGroups([]);
      setNewGroupName("");
    }

    setExerciseSearch("");
    setIsModalOpen(true);
  };

  const handleOpenPlannerWizard = (session?: PlannerSession) => {
    if (session) {
      setPlannerSessionToEdit(session);
    } else {
      setPlannerSessionToEdit(undefined);
    }
    setIsPlannerWizardOpen(true);
  };

  const handleSaveSession = async () => {
    if (!formTitle || !formStartTime || !formEndTime) {
      toast.error("Моля, попълнете всички задължителни полета.");
      return;
    }

    const newSession: CampSession = {
      id: formId || uuidv4(),
      date: formId ? formDate : selectedDateStr, // Preserve original date when editing
      type: formType,
      title: formTitle,
      startTime: formStartTime,
      endTime: formEndTime,
      exercises: formType === "training" ? formExercises : [],
      ...(formType === "training" && formGroups.length > 0
        ? { groups: formGroups }
        : {}),
      isCancelled: formId
        ? sessions.find((s) => s.id === formId)?.isCancelled
        : false,
      cancelledReason: formId
        ? sessions.find((s) => s.id === formId)?.cancelledReason
        : undefined,
    };

    let newSessions = [...sessions];
    if (formId) {
      newSessions = newSessions.map((s) => (s.id === formId ? newSession : s));
    } else {
      newSessions.push(newSession);
    }

    try {
      setIsSaving(true);
      await updateCampSessions(camp.id, newSessions);
      setSessions(newSessions);
      setIsModalOpen(false);
      toast.success(formId ? "Сесията е обновена" : "Сесията е добавена");
    } catch (error) {
      console.error(error);
      toast.error("Грешка при запазване на сесията");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleCancelSession = async (session: CampSession) => {
    const isNowCancelled = !session.isCancelled;
    const newSessions = sessions.map((s) =>
      s.id === session.id
        ? {
            ...s,
            isCancelled: isNowCancelled,
            cancelledReason: isNowCancelled
              ? "Отменено от треньора"
              : undefined,
          }
        : s
    );

    try {
      setIsSaving(true);
      await updateCampSessions(camp.id, newSessions);
      setSessions(newSessions);
      toast.success(
        isNowCancelled
          ? `Събитието "${session.title}" е отбелязано като отменено.`
          : `Събитието "${session.title}" е възстановено.`
      );
    } catch (error) {
      console.error(error);
      toast.error("Грешка при промяна статуса на събитието");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm("Сигурни ли сте, че искате да изтриете тази сесия?")) return;

    const newSessions = sessions.filter((s) => s.id !== id);
    try {
      setIsSaving(true);
      await updateCampSessions(camp.id, newSessions);
      setSessions(newSessions);
      toast.success("Сесията е изтрита");
    } catch (error) {
      console.error(error);
      toast.error("Грешка при изтриване");
    } finally {
      setIsSaving(false);
    }
  };

  const [draggedSessionId, setDraggedSessionId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedSessionId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropSession = async (
    e: React.DragEvent,
    targetSessionId: string
  ) => {
    e.preventDefault();
    if (!draggedSessionId || draggedSessionId === targetSessionId) return;

    const currentDayList = [...currentDaysSessions];
    const sourceIndex = currentDayList.findIndex(
      (s) => s.id === draggedSessionId
    );
    const targetIndex = currentDayList.findIndex(
      (s) => s.id === targetSessionId
    );

    if (sourceIndex === -1 || targetIndex === -1) return;

    const [moved] = currentDayList.splice(sourceIndex, 1);
    currentDayList.splice(targetIndex, 0, moved);

    // Merge reordered day sessions with all other sessions
    const otherSessions = sessions.filter((s) => s.date !== selectedDateStr);
    const updatedSessions = [...otherSessions, ...currentDayList];

    try {
      setIsSaving(true);
      await updateCampSessions(camp.id, updatedSessions);
      setSessions(updatedSessions);
      toast.success("Графикът е пренареден успешно");
    } catch (err) {
      console.error("Error reordering sessions:", err);
      toast.error("Грешка при пренареждане");
    } finally {
      setDraggedSessionId(null);
      setIsSaving(false);
    }
  };

  const addGroup = () => {
    if (newGroupName.trim()) {
      setFormGroups([
        ...formGroups,
        { id: uuidv4(), name: newGroupName.trim(), memberIds: [] },
      ]);
      setNewGroupName("");
    }
  };

  const removeGroup = (id: string) => {
    setFormGroups(formGroups.filter((g) => g.id !== id));
  };

  const toggleParticipantInGroup = (groupId: string, participantId: string) => {
    setFormGroups(
      formGroups.map((g) => {
        if (g.id === groupId) {
          const isMember = g.memberIds.includes(participantId);
          return {
            ...g,
            memberIds: isMember
              ? g.memberIds.filter((id) => id !== participantId)
              : [...g.memberIds, participantId],
          };
        }
        return g;
      })
    );
  };

  const handleCopyPreviousDay = async () => {
    const currentIndex = days.findIndex((d) => d.dateStr === selectedDateStr);
    if (currentIndex <= 0) {
      toast.error("Няма предходен ден за копиране");
      return;
    }

    const previousDateStr = days[currentIndex - 1].dateStr;
    const previousSessions = sessions.filter((s) => s.date === previousDateStr);
    const previousPlannerSessions = plannerSessions.filter(
      (s) => s.date === previousDateStr
    );

    if (previousSessions.length === 0 && previousPlannerSessions.length === 0) {
      toast.error("Предходният ден е празен");
      return;
    }

    if (
      !confirm(
        "Това ще копира програмата от предходния ден към текущия. Продължаваме ли?"
      )
    )
      return;

    // Copy camp sessions preserving their type structure
    const copiedCampSessions = previousSessions.map((s) => ({
      ...s,
      id: uuidv4(),
      date: selectedDateStr,
    }));

    // Keep sessions from other dates and replace/add for current date
    const otherDateSessions = sessions.filter(
      (s) => s.date !== selectedDateStr
    );
    const mergedSessions = [...otherDateSessions, ...copiedCampSessions];

    try {
      setIsSaving(true);
      await updateCampSessions(camp.id, mergedSessions);
      setSessions(mergedSessions);
      toast.success("Програмата от предходния ден е копирана!");
    } catch (error) {
      console.error(error);
      toast.error("Грешка при копиране на програмата");
    } finally {
      setIsSaving(false);
    }
  };

  const buildShareUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/club/camps/${camp.id}?date=${selectedDateStr}`;
  };

  const handleCopyLink = () => {
    const shareUrl = buildShareUrl();
    navigator.clipboard
      ?.writeText(shareUrl)
      .then(() => toast.success("Линкът е копиран!"))
      .catch(() => toast.error("Грешка при копиране"));
  };

  const filteredExercises = availableExercises.filter(
    (ex) =>
      exerciseSearch === "" ||
      ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
      (ex.category ?? "").toLowerCase().includes(exerciseSearch.toLowerCase())
  );

  const selectedDayIndex = days.findIndex((d) => d.dateStr === selectedDateStr);
  const selectedDayLabel =
    days.find((d) => d.dateStr === selectedDateStr)?.label ?? "Ден 1";

  // Combine camp sessions + planner sessions for the timeline, sorted by time
  const hasAnyContent =
    currentDaysSessions.length > 0 || currentDayPlannerSessions.length > 0;

  return (
    <>
      <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-zinc-950">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              Дневен график
            </h2>
            <p className="text-sm text-zinc-500">
              Управлявайте програмата на лагера по дни.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleCopyLink}
              variant="outline"
              size="sm"
              className="gap-2 text-xs"
              title="Копирай линк за споделяне"
            >
              <Copy size={14} className="text-zinc-500" />
              Копирай линк
            </Button>
          </div>
        </div>

        {/* Day Selector - Ultra-Compact Grid without horizontal scroll */}
        <div className="mb-4 grid grid-cols-3 gap-1 sm:grid-cols-6 sm:gap-1.5">
          {days.map((day) => {
            const dayStart = startOfDay(day.date);
            const isSelected = selectedDateStr === day.dateStr;
            const isPast = isBefore(dayStart, todayDate);
            const isCurrentDay = isSameDay(dayStart, todayDate);
            const hasCampSessions = sessions.some(
              (s) => s.date === day.dateStr
            );
            const hasPlannerSessions = plannerSessions.some(
              (s) => s.date === day.dateStr
            );
            const hasContent = hasCampSessions || hasPlannerSessions;
            const hasNewSessions = hasNewSessionsOnDate(day.dateStr);
            const showNewIndicator = !isPast && !isSelected && hasNewSessions;

            return (
              <button
                key={day.dateStr}
                onClick={() => setSelectedDateStr(day.dateStr)}
                className={cn(
                  "group relative flex flex-col items-center justify-center rounded-xl border p-1.5 text-center transition-all",
                  getDayButtonClass(
                    isSelected,
                    isCurrentDay,
                    isPast,
                    hasContent,
                    showNewIndicator
                  )
                )}
              >
                <div className="flex w-full items-center justify-between px-0.5">
                  <span className="text-[11px] leading-tight font-black sm:text-xs">
                    {day.label}
                  </span>
                  {isPast && (
                    <span
                      className="inline-flex items-center rounded-full bg-emerald-100/90 p-0.5 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"
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
                      title="Има ново добавено събитие / тренировка"
                    >
                      ✨ Ново
                    </span>
                  )}
                </div>

                <div className="mt-0.5 flex items-center gap-1 leading-none">
                  <span className="text-[9px] font-medium text-zinc-600 dark:text-zinc-400">
                    {format(day.date, "dd MMM", { locale: bg })}
                  </span>
                  <span
                    className={cn(
                      "text-[8px] font-black uppercase",
                      isCurrentDay
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-indigo-600 dark:text-indigo-400"
                    )}
                  >
                    {format(day.date, "EEE", { locale: bg })}
                  </span>
                </div>
                {hasContent && (
                  <div
                    className={cn(
                      "mt-1 size-1 rounded-full",
                      isCurrentDay
                        ? "bg-amber-500"
                        : "bg-indigo-600 dark:bg-indigo-400"
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Timeline View */}
        <div className="relative rounded-xl border border-zinc-100 bg-zinc-50 p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
          <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              Програма за {selectedDayLabel}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {/* Quick action buttons */}
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-xs sm:h-8"
                onClick={() => handleOpenModal()}
              >
                <Plus size={14} />
                Добави събитие (Закуска/Почивка)
              </Button>
              <Button
                size="sm"
                className="h-9 gap-1.5 bg-indigo-600 text-xs text-white hover:bg-indigo-700 sm:h-8"
                onClick={() => handleOpenPlannerWizard()}
              >
                <CalendarRange size={14} />
                Планирай тренировка (Планировчик)
              </Button>
              {selectedDayIndex > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyPreviousDay}
                  disabled={isSaving}
                  className="h-9 gap-1.5 text-xs text-blue-600 hover:text-blue-700 sm:h-8 dark:text-blue-400"
                >
                  <Copy size={14} />
                  Копирай от предходния ден
                </Button>
              )}
            </div>
          </div>

          {/* Day Overview Weather Banner */}
          {(() => {
            const dayWeather = getEstimatedWeather(
              camp.location,
              selectedDateStr,
              "12:00",
              liveWeatherMap
            );
            return (
              <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-sky-200/80 bg-linear-to-r from-sky-50/70 via-amber-50/50 to-cyan-50/70 px-3.5 py-2.5 text-xs shadow-2xs dark:border-sky-900/40 dark:from-sky-950/20 dark:via-amber-950/20 dark:to-cyan-950/20">
                <div className="flex items-center gap-2 font-medium">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Прогноза:
                  </span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    {dayWeather.iconEmoji} {dayWeather.conditionText}
                  </span>
                  {dayWeather.isLive && (
                    <Badge
                      variant="outline"
                      className="border-emerald-300 bg-emerald-100/70 text-[9px] font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    >
                      🟢 На живо
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 font-semibold text-zinc-800 dark:text-zinc-200">
                  <span
                    title={`Въздух: Мин ${dayWeather.minAirTemp ?? dayWeather.airTemp}°C / Макс ${dayWeather.maxAirTemp ?? dayWeather.airTemp}°C`}
                    className="inline-flex items-center gap-1 text-amber-900 dark:text-amber-300"
                  >
                    <span>☀️</span>
                    <span>{dayWeather.airTemp}°C</span>
                  </span>
                  {dayWeather.waterTemp !== undefined && (
                    <span
                      title="Морска вода"
                      className="inline-flex items-center gap-1 text-cyan-900 dark:text-cyan-300"
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
                        ? "text-blue-700 dark:text-blue-300"
                        : "text-zinc-700 dark:text-zinc-300"
                    )}
                  >
                    <span>💧</span>
                    <span>{dayWeather.rainProbability ?? 0}%</span>
                  </span>
                  {dayWeather.waveHeight !== undefined && (
                    <span
                      title={dayWeather.seaStateLabel}
                      className="inline-flex items-center gap-1 text-teal-800 dark:text-teal-300"
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

          {!hasAnyContent ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="mb-3 size-12 text-zinc-300 dark:text-zinc-700" />
              <p className="text-zinc-500">
                Няма добавени събития за този ден.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenModal()}
                >
                  <Plus size={14} className="mr-1" />
                  Добави събитие / Хранене
                </Button>
                <Button
                  size="sm"
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                  onClick={() => handleOpenPlannerWizard()}
                >
                  <CalendarRange size={14} className="mr-1" />
                  Планирай тренировка
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Session Cards List */}
              <div className="space-y-3">
                {currentDaysSessions.map((session) => {
                  const Icon = sessionTypeIcons[session.type] || Map;
                  const weather = getEstimatedWeather(
                    camp.location,
                    selectedDateStr,
                    session.startTime,
                    liveWeatherMap
                  );

                  return (
                    <div
                      key={session.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, session.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => void handleDropSession(e, session.id)}
                      className={cn(
                        "group flex cursor-grab flex-col gap-3 rounded-xl border p-4 shadow-xs transition-all active:cursor-grabbing sm:flex-row sm:items-center",
                        session.isCancelled
                          ? "border-rose-200/80 bg-rose-50/20 opacity-80 dark:border-rose-900/30 dark:bg-rose-950/10"
                          : "border-zinc-200 bg-white hover:border-primary/30 dark:border-zinc-800 dark:bg-zinc-950",
                        draggedSessionId === session.id &&
                          "border-dashed border-primary opacity-50"
                      )}
                    >
                      <div className="flex shrink-0 items-center justify-between gap-1.5 rounded-lg bg-zinc-100 p-2 sm:w-40 sm:flex-col sm:justify-center dark:bg-zinc-900">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "font-black",
                              session.isCancelled
                                ? "text-zinc-400 line-through dark:text-zinc-500"
                                : "text-zinc-900 dark:text-zinc-100"
                            )}
                          >
                            {session.startTime}
                          </span>
                          <span className="text-xs text-zinc-500">
                            - {session.endTime}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          <span
                            className={cn(
                              "inline-flex items-center gap-0.5 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300"
                            )}
                            title={`Въздух: ${weather.airTemp}°C (${weather.conditionText})`}
                          >
                            <span>{weather.iconEmoji}</span>
                            <span>{weather.airTemp}°C</span>
                          </span>
                          {weather.waterTemp !== undefined && (
                            <span
                              className="inline-flex items-center gap-0.5 rounded-full border border-cyan-200 bg-cyan-50 px-1.5 py-0.5 text-[9px] font-bold text-cyan-700 dark:border-cyan-900/50 dark:bg-cyan-950/40 dark:text-cyan-300"
                              title={`Вода: ${weather.waterTemp}°C`}
                            >
                              <span>🌊</span>
                              <span>{weather.waterTemp}°C</span>
                            </span>
                          )}
                          <span
                            className="inline-flex items-center gap-0.5 rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300"
                            title={`Вероятност за дъжд: ${weather.rainProbability ?? 0}%`}
                          >
                            <span>💧</span>
                            <span>{weather.rainProbability ?? 0}%</span>
                          </span>
                          {weather.waveHeight !== undefined && (
                            <span
                              className="inline-flex items-center gap-0.5 rounded-full border border-teal-200 bg-teal-50 px-1.5 py-0.5 text-[9px] font-bold text-teal-700 dark:border-teal-900/50 dark:bg-teal-950/40 dark:text-teal-300"
                              title={`Вълнение на морето: ${weather.waveHeight} м (${weather.seaStateLabel})`}
                            >
                              <span>{weather.seaStateFlag || "🌊"}</span>
                              <span>{weather.waveHeight}м</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-1 items-start gap-4">
                        <div
                          className={cn(
                            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                            session.isCancelled &&
                              "bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
                            !session.isCancelled &&
                              session.type === "training" &&
                              "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
                            !session.isCancelled &&
                              session.type === "meal" &&
                              "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
                            !session.isCancelled &&
                              session.type !== "training" &&
                              session.type !== "meal" &&
                              "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                          )}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4
                              className={cn(
                                "font-bold",
                                session.isCancelled
                                  ? "text-zinc-500 line-through dark:text-zinc-400"
                                  : "text-zinc-900 dark:text-white"
                              )}
                            >
                              {session.title}
                            </h4>
                            <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                              {sessionTypeLabels[session.type]}
                            </span>
                            {session.isCancelled && (
                              <Badge
                                variant="outline"
                                className="border-rose-300 bg-rose-50 text-[10px] font-bold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-300"
                              >
                                🚫 Отменено от треньора
                              </Badge>
                            )}
                          </div>

                          {session.exercises &&
                            session.exercises.length > 0 && (
                              <div className="mt-3 rounded-lg border border-zinc-100 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                                <div className="mb-2 text-xs font-semibold text-zinc-500">
                                  Избрани упражнения:
                                </div>
                                <ul className="space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                                  {session.exercises.map((exId) => {
                                    const ex = availableExercises.find(
                                      (e) => (e.id || e.name) === exId
                                    );
                                    return (
                                      <li
                                        key={exId}
                                        className="flex items-start gap-2"
                                      >
                                        <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-blue-400" />
                                        <span>{ex ? ex.name : exId}</span>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            )}

                          {session.groups && session.groups.length > 0 && (
                            <div className="mt-3 flex flex-col gap-1.5 rounded-md border border-zinc-100 bg-zinc-50/50 p-2 dark:border-zinc-800 dark:bg-zinc-900/30">
                              <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                Групи:
                              </div>
                              {session.groups.map((sg) => {
                                const groupAttendees =
                                  camp.attendees?.filter((a) =>
                                    sg.memberIds.includes(a.memberId)
                                  ) || [];
                                return (
                                  <div
                                    key={sg.id}
                                    className="text-xs text-zinc-500"
                                  >
                                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                      {sg.name}
                                    </span>{" "}
                                    · {sg.memberIds.length} участници
                                    {groupAttendees.length > 0 && (
                                      <details className="group/group-details mt-1 [&_summary::-webkit-details-marker]:hidden">
                                        <summary className="cursor-pointer text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                                          Виж участниците
                                        </summary>
                                        <ul className="mt-1.5 space-y-1 border-l border-zinc-200 pl-2 dark:border-zinc-700">
                                          {groupAttendees.map((a) => (
                                            <li
                                              key={a.memberId}
                                              className="text-[11px] leading-tight text-zinc-500 dark:text-zinc-400"
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
                            <div className="mt-3 border-l-2 border-amber-500/50 pl-2 text-xs text-zinc-600 dark:text-zinc-400">
                              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                Бележки:{" "}
                              </span>
                              {session.description}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            void handleToggleCancelSession(session)
                          }
                          className={cn(
                            "size-8",
                            session.isCancelled
                              ? "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400"
                              : "text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400"
                          )}
                          title={
                            session.isCancelled
                              ? "Възстанови събитието"
                              : "Отмени събитието (остава в графика с отметка)"
                          }
                        >
                          {session.isCancelled ? (
                            <RotateCcw size={14} />
                          ) : (
                            <Ban size={14} />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenModal(session)}
                          className="size-8 text-zinc-500 hover:text-blue-600"
                          title="Редактирай"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => void handleDeleteSession(session.id)}
                          className="size-8 text-zinc-500 hover:text-red-600"
                          title="Изтрий напълно"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Planner sessions for the same day */}
              {currentDayPlannerSessions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-indigo-100 dark:bg-indigo-900/30" />
                    <span className="text-[10px] font-bold tracking-widest text-indigo-500 uppercase">
                      Детайлни тренировки (Планировчик)
                    </span>
                    <div className="h-px flex-1 bg-indigo-100 dark:bg-indigo-900/30" />
                  </div>
                  {currentDayPlannerSessions.map((ps) => {
                    const weather = getEstimatedWeather(
                      camp.location,
                      selectedDateStr,
                      ps.startTime || "",
                      liveWeatherMap
                    );

                    return (
                      <div
                        key={ps.id}
                        className="group flex flex-col gap-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 shadow-sm transition-all hover:border-indigo-400/50 sm:flex-row sm:items-center dark:border-indigo-900/40 dark:bg-indigo-900/10"
                      >
                        <div className="flex shrink-0 items-center justify-between gap-1.5 rounded-lg bg-indigo-100 p-2 sm:w-40 sm:flex-col sm:justify-center dark:bg-indigo-900/30">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-indigo-900 dark:text-indigo-100">
                              {ps.startTime || "--:--"}
                            </span>
                            <span className="text-xs text-indigo-600 dark:text-indigo-400">
                              - {ps.endTime || "--:--"}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center justify-center gap-1">
                            <span
                              className={cn(
                                "inline-flex items-center gap-0.5 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300"
                              )}
                              title={`Въздух: ${weather.airTemp}°C (${weather.conditionText})`}
                            >
                              <span>{weather.iconEmoji}</span>
                              <span>{weather.airTemp}°C</span>
                            </span>
                            {weather.waterTemp !== undefined && (
                              <span
                                className="inline-flex items-center gap-0.5 rounded-full border border-cyan-200 bg-cyan-50 px-1.5 py-0.5 text-[9px] font-bold text-cyan-700 dark:border-cyan-900/50 dark:bg-cyan-950/40 dark:text-cyan-300"
                                title={`Вода: ${weather.waterTemp}°C`}
                              >
                                <span>🌊</span>
                                <span>{weather.waterTemp}°C</span>
                              </span>
                            )}
                            <span
                              className="inline-flex items-center gap-0.5 rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300"
                              title={`Вероятност за дъжд: ${weather.rainProbability ?? 0}%`}
                            >
                              <span>💧</span>
                              <span>{weather.rainProbability ?? 0}%</span>
                            </span>
                            {weather.waveHeight !== undefined && (
                              <span
                                className="inline-flex items-center gap-0.5 rounded-full border border-teal-200 bg-teal-50 px-1.5 py-0.5 text-[9px] font-bold text-teal-700 dark:border-teal-900/50 dark:bg-teal-950/40 dark:text-teal-300"
                                title={`Вълнение на морето: ${weather.waveHeight} м (${weather.seaStateLabel})`}
                              >
                                <span>{weather.seaStateFlag || "🌊"}</span>
                                <span>{weather.waveHeight}м</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-1 items-start gap-4">
                          <div className="flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <Badge
                                variant="outline"
                                className="border-indigo-200 bg-indigo-100 text-[10px] text-indigo-700 uppercase dark:border-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300"
                              >
                                Планировчик
                              </Badge>
                              {ps.targetGroups?.map((g, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="text-[10px] uppercase"
                                >
                                  {g}
                                </Badge>
                              ))}
                            </div>
                            <h4 className="font-bold text-zinc-900 dark:text-white">
                              {ps.title}
                            </h4>
                            <div className="mt-2 flex flex-col gap-2">
                              <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
                                <span>{getLocLabel(ps.location)}</span>
                                {(() => {
                                  if (ps.blocks && ps.blocks.length > 0) {
                                    const totalItems = ps.blocks.reduce(
                                      (acc, b) => acc + b.items.length,
                                      0
                                    );
                                    return <span>{totalItems} общо упр.</span>;
                                  }
                                  if (ps.groupedExercises) {
                                    const totalExercises =
                                      ps.groupedExercises.reduce(
                                        (acc, g) => acc + g.exercises.length,
                                        0
                                      );
                                    return <span>{totalExercises} упр.</span>;
                                  }
                                  return null;
                                })()}
                              </div>

                              {ps.blocks && ps.blocks.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                  {ps.blocks
                                    .filter((b) => {
                                      const actualMinutes = b.items.reduce(
                                        (acc, i) => acc + i.durationMinutes,
                                        0
                                      );
                                      return (
                                        actualMinutes > 0 ||
                                        (b.targetDuration > 0 &&
                                          b.items.length > 0)
                                      );
                                    })
                                    .map((b) => {
                                      const totalPhaseMinutes =
                                        b.items.reduce(
                                          (acc, i) => acc + i.durationMinutes,
                                          0
                                        ) || b.targetDuration;
                                      const isQuizBlock = b.items.some(
                                        (i) => i.exercise?.category === "quiz"
                                      );
                                      return (
                                        <Badge
                                          key={b.id}
                                          variant="secondary"
                                          className="bg-indigo-100/50 text-[10px] text-indigo-700 transition-colors hover:bg-indigo-100/80"
                                        >
                                          {isQuizBlock
                                            ? "🧠 Викторина"
                                            : getPhaseLabel(b.phase)}
                                          : {totalPhaseMinutes} мин
                                        </Badge>
                                      );
                                    })}
                                </div>
                              )}
                              {ps.sessionGroups &&
                                ps.sessionGroups.length > 0 && (
                                  <div className="mt-2 flex flex-col gap-1.5 rounded-md border border-zinc-100 bg-zinc-50/50 p-2 dark:border-zinc-800 dark:bg-zinc-900/30">
                                    <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                      Групи:
                                    </div>
                                    {ps.sessionGroups.map((sg) => {
                                      const groupAttendees =
                                        camp.attendees?.filter((a) =>
                                          sg.memberIds.includes(a.memberId)
                                        ) || [];
                                      return (
                                        <div
                                          key={sg.id}
                                          className="text-xs text-zinc-500"
                                        >
                                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                            {sg.name}
                                          </span>{" "}
                                          · {sg.memberIds.length} участници
                                          {groupAttendees.length > 0 && (
                                            <details className="group/group-details mt-1 [&_summary::-webkit-details-marker]:hidden">
                                              <summary className="cursor-pointer text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                                                Виж участниците
                                              </summary>
                                              <ul className="mt-1.5 space-y-1 border-l border-zinc-200 pl-2 dark:border-zinc-700">
                                                {groupAttendees.map((a) => (
                                                  <li
                                                    key={a.memberId}
                                                    className="text-[11px] leading-tight text-zinc-500 dark:text-zinc-400"
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

                              {ps.coachNotes && (
                                <div className="mt-3 border-l-2 border-amber-500/50 pl-2 text-xs text-zinc-600 dark:text-zinc-400">
                                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                    Бележки:{" "}
                                  </span>
                                  {ps.coachNotes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenPlannerWizard(ps)}
                            className="h-8 gap-1.5 text-xs text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                          >
                            <Edit size={12} />
                            Редактирай
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={async () => {
                              if (
                                confirm(
                                  `Сигурни ли сте, че искате да изтриете "${ps.title}"?`
                                )
                              ) {
                                try {
                                  await plannerService.deleteSession(ps.id);
                                  setPlannerSessions((prev) =>
                                    prev.filter((s) => s.id !== ps.id)
                                  );
                                  toast.success("Тренировката е изтрита");
                                } catch (err) {
                                  console.error(err);
                                  toast.error(
                                    "Грешка при изтриване на тренировката"
                                  );
                                }
                              }
                            }}
                            className="size-8 text-zinc-400 hover:text-red-600"
                            title="Изтрий тренировка"
                          >
                            <Trash2 size={14} />
                          </Button>
                          <Button
                            asChild
                            size="sm"
                            className="h-8 gap-1.5 bg-indigo-600 text-xs text-white hover:bg-indigo-700"
                          >
                            <Link href={`/training/planner/${ps.id}/active`}>
                              <Play size={12} />
                              Старт
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Session Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {formId ? "Редактиране на сесия" : "Нова сесия"}
              </DialogTitle>
              <DialogDescription>
                Добавете събитие към програмата за{" "}
                {days.find((d) => d.dateStr === selectedDateStr)?.label}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Вид дейност</Label>
                <Select
                  value={formType}
                  onValueChange={(v) => setFormType(v as CampSession["type"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quiet_hour">
                      😴 ТИХ ЧАС / Почивка
                    </SelectItem>
                    <SelectItem value="attraction">
                      🎡 Атракция / Събитие
                    </SelectItem>
                    <SelectItem value="leisure">
                      🏖️ Свободно време (Плаж/Разходка)
                    </SelectItem>
                    <SelectItem value="meal">
                      🍽️ Хранене (Закуска/Обяд/Вечеря)
                    </SelectItem>
                    <SelectItem value="travel">
                      🚌 Пътуване / Транспорт
                    </SelectItem>
                    <SelectItem value="other">
                      📌 Друго организационно събитие
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="title">Заглавие</Label>
                <Input
                  id="title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="напр. Сутрешен крос"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startTime">Начален час</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endTime">Краен час</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                  />
                </div>
              </div>

              {formType === "training" && (
                <div className="grid gap-2 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label>Бързи упражнения (опционално)</Label>
                    <span className="text-[10px] text-zinc-500">
                      {formExercises.length} избрани
                    </span>
                  </div>
                  {/* Search box */}
                  <div className="relative">
                    <Search
                      size={13}
                      className="absolute top-1/2 left-2.5 -translate-y-1/2 text-zinc-400"
                    />
                    <Input
                      placeholder="Търси упражнение..."
                      value={exerciseSearch}
                      onChange={(e) => setExerciseSearch(e.target.value)}
                      className="pl-8 text-xs"
                    />
                  </div>
                  <ScrollArea className="h-45 rounded-md border p-3">
                    <div className="space-y-3">
                      {filteredExercises.map((ex) => (
                        <div
                          key={ex.id || ex.name}
                          className="flex items-start space-x-3"
                        >
                          <Checkbox
                            id={`ex-${ex.id || ex.name}`}
                            checked={formExercises.includes(ex.id || ex.name)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormExercises([
                                  ...formExercises,
                                  ex.id || ex.name,
                                ]);
                              } else {
                                setFormExercises(
                                  formExercises.filter(
                                    (id) => id !== (ex.id || ex.name)
                                  )
                                );
                              }
                            }}
                          />
                          <div className="grid gap-1 leading-none">
                            <label
                              htmlFor={`ex-${ex.id || ex.name}`}
                              className="cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {ex.name}
                            </label>
                            {ex.category && (
                              <p className="text-[10px] text-zinc-500 uppercase">
                                {ex.category}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                      {filteredExercises.length === 0 && (
                        <div className="py-4 text-center text-xs text-zinc-500">
                          {exerciseSearch
                            ? "Няма резултати"
                            : "Зареждане на упражнения..."}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  {/* Quick link to Planner */}
                  <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3 text-xs text-indigo-900 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:text-indigo-200">
                    <p className="font-medium">
                      Искате ли детайлен план на тренировката?
                    </p>
                    <p className="mt-0.5 text-[11px] text-indigo-600 dark:text-indigo-400">
                      За планиране по фази (загрявка, основни упражнения,
                      интензитет, оборудване и таймери), използвайте подобрения
                      Универсален Планировчик.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      className="mt-2.5 h-7 bg-indigo-600 text-xs text-white hover:bg-indigo-700"
                      onClick={() => {
                        setIsModalOpen(false);
                        handleOpenPlannerWizard();
                      }}
                    >
                      <CalendarRange size={13} className="mr-1.5" />
                      Отвори Универсалния Планировчик за лагер
                    </Button>
                  </div>

                  <div className="mt-2 grid gap-2 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <Label>Управление на групи (опционално)</Label>
                      <span className="text-[10px] text-zinc-500">
                        {formGroups.length} групи
                      </span>
                    </div>
                    <div className="mt-2 space-y-2">
                      {formGroups.map((g) => (
                        <div
                          key={g.id}
                          className="flex items-center justify-between rounded-md border bg-zinc-50 p-2"
                        >
                          <span className="text-sm font-medium">{g.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeGroup(g.id)}
                            className="size-6 p-0 text-red-500"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Нова група (напр. Група А)"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          className="h-8 text-sm"
                        />
                        <Button
                          size="sm"
                          className="h-8"
                          onClick={addGroup}
                          type="button"
                        >
                          <Plus className="size-4" />
                        </Button>
                      </div>
                    </div>

                    {formGroups.length > 0 && (
                      <div className="mt-4">
                        <h4 className="mb-2 text-sm font-semibold text-zinc-800">
                          Разпределение на участници
                        </h4>
                        <ScrollArea className="h-48 rounded-md border border-zinc-200 bg-zinc-50 p-2">
                          {(!camp.attendees || camp.attendees.length === 0) && (
                            <p className="p-2 text-xs text-zinc-500">
                              Няма записани участници в лагера.
                            </p>
                          )}
                          {camp.attendees?.map((p) => (
                            <div
                              key={p.memberId}
                              className="mb-2 flex flex-col justify-between rounded-md border border-zinc-100 bg-white p-2 shadow-sm sm:flex-row sm:items-center"
                            >
                              <span className="text-sm font-medium">
                                {p.name}
                              </span>
                              <div className="mt-2 flex flex-wrap gap-3 sm:mt-0">
                                {formGroups.map((g) => (
                                  <label
                                    key={g.id}
                                    className="flex cursor-pointer items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={g.memberIds.includes(p.memberId)}
                                      onChange={() =>
                                        toggleParticipantInGroup(
                                          g.id,
                                          p.memberId
                                        )
                                      }
                                      className="size-3.5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-600"
                                    />
                                    {g.name}
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Отказ
              </Button>
              <Button onClick={handleSaveSession} disabled={isSaving}>
                {isSaving ? "Запазване..." : "Запази"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <CreateSessionWizard
        open={isPlannerWizardOpen}
        onOpenChange={setIsPlannerWizardOpen}
        onSaveSuccess={() => {
          // Refresh planner sessions after save
          plannerService
            .getSessionsByCampId(activeBranch, camp.id)
            .then(setPlannerSessions);
        }}
        initialCampId={camp.id}
        initialDate={selectedDateStr}
        initialSession={plannerSessionToEdit}
      />
    </>
  );
}
