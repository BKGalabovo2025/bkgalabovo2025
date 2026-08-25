"use client";

import { addDays, format, isSameDay } from "date-fns";
import { bg } from "date-fns/locale";
import {
  Bus,
  CalendarRange,
  Clock,
  Coffee,
  Copy,
  Dumbbell,
  Edit,
  Map,
  Play,
  Plus,
  Search,
  Sun,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
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
import { cn } from "@/lib/utils";
import { plannerService } from "@/services/planner-service";
import { updateCampSessions } from "@/services/schedule-service";
import { useAppStore } from "@/store/use-app-store";
import { CampSession, ScheduleEvent } from "@/types";
import { Exercise, PlannerSession } from "@/types/planner.types";

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

export function CampItineraryClient({ camp }: { camp: ScheduleEvent }) {
  const getLocLabel = (loc: string) => {
    if (loc === "court") return "В зала";
    if (loc === "stadium") return "Стадион";
    return "Плаж";
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

  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    days[0]?.dateStr || format(new Date(), "yyyy-MM-dd")
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

  const handleOpenModal = (session?: CampSession) => {
    if (session) {
      setFormId(session.id);
      setFormDate(session.date); // Preserve original session date
      setFormType(session.type);
      setFormTitle(session.title);
      setFormStartTime(session.startTime);
      setFormEndTime(session.endTime);
      setFormExercises(session.exercises || []);
      setFormGroups(session.groups || []);
      setNewGroupName("");
    } else {
      setFormId(null);
      setFormDate(""); // Clear form date for new session
      setFormType("training");
      setFormTitle("");
      setFormStartTime("09:00");
      setFormEndTime("11:00");
      setFormExercises([]);
      setFormGroups([]);
      setNewGroupName("");
      // Auto-distribute attendees into groups A, B, C for training sessions
      if (
        camp.attendees &&
        camp.attendees.length > 0 &&
        formType === "training"
      ) {
        const attendees = camp.attendees;
        const numGroups = 3; // A, B, C
        const groupSize = Math.ceil(attendees.length / numGroups);
        const groups = [];
        for (let i = 0; i < numGroups; i++) {
          const groupMembers = attendees.slice(
            i * groupSize,
            (i + 1) * groupSize
          );
          groups.push({
            id: uuidv4(),
            name: `Група ${String.fromCharCode(65 + i)}`, // A, B, C
            memberIds: groupMembers.map((a) => a.memberId),
          });
        }
        setFormGroups(groups);
      }
    }

    // If training type, open the Universal Planner Wizard instead of simple modal
    if (formType === "training") {
      setIsModalOpen(false);
      handleOpenPlannerWizard();
      return;
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
            <Button onClick={() => handleOpenModal()} className="gap-2">
              <Plus size={16} />
              Добави сесия
            </Button>
          </div>
        </div>

        {/* Day Selector */}
        <div className="mb-8 flex scrollbar-thin overflow-x-auto pb-2">
          <div className="flex gap-2">
            {days.map((day) => {
              const isSelected = selectedDateStr === day.dateStr;
              const hasCampSessions = sessions.some(
                (s) => s.date === day.dateStr
              );
              const hasPlannerSessions = plannerSessions.some(
                (s) => s.date === day.dateStr
              );
              const hasContent = hasCampSessions || hasPlannerSessions;

              return (
                <button
                  key={day.dateStr}
                  onClick={() => setSelectedDateStr(day.dateStr)}
                  className={cn(
                    "flex min-w-30 flex-col items-center justify-center rounded-xl border p-3 text-sm transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800",
                    hasContent &&
                      !isSelected &&
                      "border-blue-200 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-900/10"
                  )}
                >
                  <span className="font-bold">{day.label}</span>
                  <span className="mt-1 text-xs opacity-70">
                    {format(day.date, "dd MMM yyyy", { locale: bg })}
                  </span>
                  {hasContent && (
                    <div className="mt-2 size-1.5 rounded-full bg-blue-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeline View */}
        <div className="relative rounded-xl border border-zinc-100 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-semibold text-zinc-900 dark:text-white">
              Програма за {selectedDayLabel}
            </h3>
            <div className="flex items-center gap-2">
              {/* Quick action buttons */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => handleOpenModal()}
              >
                <Plus size={14} />
                Добави събитие (Закуска/Почивка)
              </Button>
              <Button
                size="sm"
                className="h-8 gap-1.5 bg-indigo-600 text-xs text-white hover:bg-indigo-700"
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
                  className="h-8 gap-1.5 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  <Copy size={14} />
                  Копирай от предходния ден
                </Button>
              )}
            </div>
          </div>

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
              <div className="grid h-16 grid-cols-24 gap-1 rounded-lg bg-zinc-200 p-1 dark:bg-zinc-800">
                <div className="size-full text-[10px] text-zinc-500 capitalize dark:text-zinc-400">
                  6:00
                </div>
                <div className="size-full text-[10px] text-zinc-500 capitalize dark:text-zinc-400">
                  7:00
                </div>
                <div className="size-full text-[10px] text-zinc-500 capitalize dark:text-zinc-400">
                  8:00
                </div>
                <div className="size-full text-[10px] text-zinc-500 capitalize dark:text-zinc-400">
                  9:00
                </div>
                <div className="size-full text-[10px] text-zinc-500 capitalize dark:text-zinc-400">
                  10:00
                </div>
                <div className="size-full text-[10px] text-zinc-500 capitalize dark:text-zinc-400">
                  11:00
                </div>
                <div className="size-full text-[10px] text-zinc-500 capitalize dark:text-zinc-400">
                  12:00
                </div>
                <div className="size-full text-[10px] text-zinc-500 capitalize dark:text-zinc-400">
                  13:00
                </div>
                <div className="size-full text-[10px] text-zinc-500 capitalize dark:text-zinc-400">
                  14:00
                </div>
                <div className="size-full text-[10px] text-zinc-500 capitalize dark:text-zinc-400">
                  15:00
                </div>
                <div className="size-full text-[10px] text-zinc-500 capitalize dark:text-zinc-400">
                  16:00
                </div>
                <div className="size-full text-[10px] text-zinc-500 capitalize dark:text-zinc-400">
                  17:00
                </div>
                <div className="size-full text-[10px] text-zinc-500 capitalize dark:text-zinc-400">
                  18:00
                </div>
                <div className="size-full text-[10px] text-zinc-500 capitalize dark:text-zinc-400">
                  19:00
                </div>
                <div className="size-full text-[10px] text-zinc-500 capitalize dark:text-zinc-400">
                  20:00
                </div>
                <div className="size-full text-[10px] text-zinc-500 capitalize dark:text-zinc-400">
                  21:00
                </div>
                <div className="size-full text-[10px] text-zinc-500 capitalize dark:text-zinc-400">
                  22:00
                </div>
                <div className="size-full text-[10px] text-zinc-500 capitalize dark:text-zinc-400">
                  23:00
                </div>
                <div className="size-full text-[10px] text-zinc-500 capitalize dark:text-zinc-400">
                  24:00
                </div>
                <div className="size-full text-[10px] text-zinc-500 capitalize dark:text-zinc-400">
                  25:00
                </div>
                <div className="size-full text-[10px] text-zinc-500 capitalize dark:text-zinc-400">
                  26:00
                </div>
                <div className="size-full text-[10px] text-zinc-500 capitalize dark:text-zinc-400">
                  27:00
                </div>
                <div className="size-full text-[10px] text-zinc-500 capitalize dark:text-zinc-400">
                  28:00
                </div>
                <div className="size-full text-[10px] text-zinc-500 capitalize dark:text-zinc-400">
                  29:00
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {currentDaysSessions.map((session) => {
                  const startHour = parseInt(session.startTime);
                  const endHour = parseInt(session.endTime);
                  const startCol = startHour - 6;
                  const endCol = endHour - 6;
                  const colSpan = Math.max(1, endCol - startCol);
                  const getBgColor = (type: string) => {
                    switch (type) {
                      case "training":
                        return "bg-orange-500/60";
                      case "meal":
                        return "bg-green-500/60";
                      case "leisure":
                        return "bg-sky-500/60";
                      case "travel":
                        return "bg-purple-500/60";
                      default:
                        return "bg-zinc-500/60";
                    }
                  };
                  const bgColor = getBgColor(session.type);
                  return (
                    <div
                      key={session.id}
                      className={cn(
                        "rounded-b transition-colors hover:opacity-80",
                        `grid-row: span ${colSpan}`,
                        `grid-column: ${startCol + 1}`,
                        bgColor
                      )}
                      aria-label={session.title}
                    />
                  );
                })}
              </div>
              <div className="space-y-4">
                {currentDaysSessions.map((session) => {
                  const Icon = sessionTypeIcons[session.type] || Map;
                  return (
                    <div
                      key={session.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, session.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => void handleDropSession(e, session.id)}
                      className={cn(
                        "group flex cursor-grab flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:border-primary/30 active:cursor-grabbing sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-950",
                        draggedSessionId === session.id &&
                          "border-dashed border-primary opacity-50"
                      )}
                    >
                      <div className="flex shrink-0 items-center justify-center rounded-lg bg-zinc-100 p-3 sm:w-24 dark:bg-zinc-900">
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">
                          {session.startTime}
                        </span>
                      </div>

                      <div className="flex flex-1 items-start gap-4">
                        <div
                          className={cn(
                            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                            session.type === "training" &&
                              "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
                            session.type === "meal" &&
                              "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
                            session.type !== "training" &&
                              session.type !== "meal" &&
                              "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                          )}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-zinc-900 dark:text-white">
                            {session.title}
                          </h4>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-500">
                            <span className="rounded-md bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
                              {sessionTypeLabels[session.type]}
                            </span>
                            <span className="flex items-center gap-1">
                              До: {session.endTime}
                            </span>
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
                            <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3 dark:border-indigo-900/30 dark:bg-indigo-900/10">
                              <div className="mb-2 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                                Създадени групи:
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {session.groups.map((g) => (
                                  <Badge
                                    key={g.id}
                                    variant="outline"
                                    className="border-indigo-200 bg-white text-[10px] text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                                  >
                                    {g.name} ({g.memberIds.length})
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenModal(session)}
                          className="size-8 text-zinc-500 hover:text-blue-600"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSession(session.id)}
                          className="size-8 text-zinc-500 hover:text-red-600"
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
                  {currentDayPlannerSessions.map((ps) => (
                    <div
                      key={ps.id}
                      className="group flex flex-col gap-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 shadow-sm transition-all hover:border-indigo-400/50 sm:flex-row sm:items-center dark:border-indigo-900/40 dark:bg-indigo-900/10"
                    >
                      <div className="flex shrink-0 items-center justify-center rounded-lg bg-indigo-100 p-3 sm:w-24 dark:bg-indigo-900/30">
                        <CalendarRange
                          size={18}
                          className="text-indigo-600 dark:text-indigo-400"
                        />
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
                                  return (
                                    <span>
                                      {ps.blocks.reduce(
                                        (acc, b) => acc + b.items.length,
                                        0
                                      )}{" "}
                                      общо упр.
                                    </span>
                                  );
                                }
                                if (ps.groupedExercises) {
                                  return (
                                    <span>
                                      {ps.groupedExercises.reduce(
                                        (acc, g) => acc + g.exercises.length,
                                        0
                                      )}{" "}
                                      упр.
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </div>

                            {ps.blocks && ps.blocks.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                {ps.blocks.map((b) => (
                                  <Badge
                                    key={b.id}
                                    variant="secondary"
                                    className="bg-indigo-100/50 text-[10px] text-indigo-700 transition-colors hover:bg-indigo-100/80"
                                  >
                                    {getPhaseLabel(b.phase)}: {b.targetDuration}{" "}
                                    мин
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {ps.sessionGroups &&
                              ps.sessionGroups.length > 0 && (
                                <div className="mt-1">
                                  <Badge
                                    variant="outline"
                                    className="text-[10px]"
                                  >
                                    {ps.sessionGroups.length} групи
                                  </Badge>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
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
                  ))}
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
                    <SelectItem value="training">
                      Тренировка (Сутрешна/Следобедна)
                    </SelectItem>
                    <SelectItem value="meal">
                      Хранене (Закуска/Обяд/Вечеря)
                    </SelectItem>
                    <SelectItem value="leisure">
                      Свободно време / Почивка
                    </SelectItem>
                    <SelectItem value="travel">Пътуване</SelectItem>
                    <SelectItem value="other">Друго</SelectItem>
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
