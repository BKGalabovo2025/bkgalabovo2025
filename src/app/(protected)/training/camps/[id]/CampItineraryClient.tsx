"use client";

import { addDays, format, isSameDay } from "date-fns";
import { bg } from "date-fns/locale";
import {
  Bus,
  Clock,
  Coffee,
  Copy,
  Dumbbell,
  Edit,
  Map,
  Plus,
  Share2,
  Sun,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

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
import { Exercise } from "@/types/planner.types";

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
  const { activeBranch } = useAppStore();
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    if (activeBranch) {
      plannerService
        .getExercises(activeBranch)
        .then(setAvailableExercises)
        .catch(console.error);
    }
  }, [activeBranch]);

  const [sessions, setSessions] = useState<CampSession[]>(
    camp.campSessions || []
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Generate days based on camp dates
  const start = new Date(camp.startDate);
  const end = new Date(camp.endDate);

  const days: { date: Date; dateStr: string; label: string }[] = [];
  let current = start;
  let dayIndex = 1;
  // Ensure we at least have one day, and loop until end date
  // (We use a simple loop, max 30 days to be safe)
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

  // Form State
  const [formId, setFormId] = useState<string | null>(null);
  const [formType, setFormType] = useState<CampSession["type"]>("training");
  const [formTitle, setFormTitle] = useState("");
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState("11:00");
  const [formExercises, setFormExercises] = useState<string[]>([]);

  const handleOpenModal = (session?: CampSession) => {
    if (session) {
      setFormId(session.id);
      setFormType(session.type);
      setFormTitle(session.title);
      setFormStartTime(session.startTime);
      setFormEndTime(session.endTime);
      setFormExercises(session.exercises || []);
    } else {
      setFormId(null);
      setFormType("training");
      setFormTitle("");
      setFormStartTime("09:00");
      setFormEndTime("11:00");
      setFormExercises([]);
    }
    setIsModalOpen(true);
  };

  const handleSaveSession = async () => {
    if (!formTitle || !formStartTime || !formEndTime) {
      toast.error("Моля, попълнете всички задължителни полета.");
      return;
    }

    const newSession: CampSession = {
      id: formId || uuidv4(),
      date: selectedDateStr,
      type: formType,
      title: formTitle,
      startTime: formStartTime,
      endTime: formEndTime,
      exercises: formType === "training" ? formExercises : [],
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

  const handleCopyPreviousDay = async () => {
    const currentIndex = days.findIndex((d) => d.dateStr === selectedDateStr);
    if (currentIndex <= 0) {
      toast.error("Няма предходен ден за копиране");
      return;
    }

    const previousDateStr = days[currentIndex - 1].dateStr;
    const previousSessions = sessions.filter((s) => s.date === previousDateStr);

    if (previousSessions.length === 0) {
      toast.error("Предходният ден е празен");
      return;
    }

    if (
      !confirm(
        "Това ще копира програмата от предходния ден към текущия. Продължаваме ли?"
      )
    )
      return;

    const newCopiedSessions = previousSessions.map((s) => ({
      ...s,
      id: uuidv4(),
      date: selectedDateStr,
    }));

    const mergedSessions = [...sessions, ...newCopiedSessions];

    try {
      setIsSaving(true);
      await updateCampSessions(camp.id, mergedSessions);
      setSessions(mergedSessions);
      toast.success("Програмата е копирана успешно!");
    } catch (error) {
      console.error(error);
      toast.error("Грешка при копиране");
    } finally {
      setIsSaving(false);
    }
  };

  const generateShareText = () => {
    let text = `📅 Програма за лагер: ${camp.title}\n`;
    text += `📍 Локация: ${camp.location || "Не е посочена"}\n\n`;

    days.forEach((day) => {
      const daySessions = sessions
        .filter((s) => s.date === day.dateStr)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      if (daySessions.length > 0) {
        text += `🔹 ${day.label} (${format(day.date, "dd.MM", { locale: bg })})\n`;
        daySessions.forEach((s) => {
          let emoji = "🔹";
          if (s.type === "training") emoji = "🏸";
          if (s.type === "meal") emoji = "🍽️";
          if (s.type === "leisure") emoji = "🏖️";
          if (s.type === "travel") emoji = "🚌";

          text += `  ${s.startTime}-${s.endTime} | ${emoji} ${s.title}\n`;
        });
        text += "\n";
      }
    });

    return text.trim();
  };

  const handleShareViber = () => {
    const text = generateShareText();
    if (!text) {
      toast.error("Няма програма за споделяне");
      return;
    }
    const url = `viber://forward?text=${encodeURIComponent(text)}`;
    window.location.href = url;
  };

  return (
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
            onClick={handleShareViber}
            variant="outline"
            className="gap-2"
          >
            <Share2 size={16} className="text-purple-600" />
            Сподели (Viber)
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
            const hasSessions = sessions.some((s) => s.date === day.dateStr);

            return (
              <button
                key={day.dateStr}
                onClick={() => setSelectedDateStr(day.dateStr)}
                className={cn(
                  "flex min-w-30 flex-col items-center justify-center rounded-xl border p-3 text-sm transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800",
                  hasSessions &&
                    !isSelected &&
                    "border-blue-200 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-900/10"
                )}
              >
                <span className="font-bold">{day.label}</span>
                <span className="mt-1 text-xs opacity-70">
                  {format(day.date, "dd MMM yyyy", { locale: bg })}
                </span>
                {hasSessions && (
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
            Програма за {days.find((d) => d.dateStr === selectedDateStr)?.label}
          </h3>
          {days.findIndex((d) => d.dateStr === selectedDateStr) > 0 && (
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

        {currentDaysSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="mb-3 size-12 text-zinc-300 dark:text-zinc-700" />
            <p className="text-zinc-500">Няма добавени събития за този ден.</p>
            <Button
              variant="link"
              onClick={() => handleOpenModal()}
              className="mt-2 text-primary"
            >
              Създайте първата сесия
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {currentDaysSessions.map((session) => {
              const Icon = sessionTypeIcons[session.type] || Map;
              return (
                <div
                  key={session.id}
                  className="group flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:border-primary/30 sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-950"
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

                      {session.exercises && session.exercises.length > 0 && (
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

                      {session.type === "training" && (
                        <div className="mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            asChild
                          >
                            <a
                              href="/training/planner"
                              target="_blank"
                              rel="noreferrer"
                            >
                              Детайлно в Планировчика &rarr;
                            </a>
                          </Button>
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
                <ScrollArea className="h-45 rounded-md border p-3">
                  <div className="space-y-3">
                    {availableExercises.map((ex) => (
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
                    {availableExercises.length === 0 && (
                      <div className="py-4 text-center text-xs text-zinc-500">
                        Зареждане на упражнения...
                      </div>
                    )}
                  </div>
                </ScrollArea>
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
  );
}
