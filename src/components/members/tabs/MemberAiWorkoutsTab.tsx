/* eslint-disable react/forbid-dom-props */
"use client";

import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  HeartPulse,
  Info,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ExerciseDetailModal } from "@/components/training/ExerciseDetailModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import {
  deleteWorkoutProgramAction,
  getMemberWorkoutProgramsAction,
  updateWorkoutProgramProgressAction,
} from "@/lib/actions/trainings";
import { exportWorkoutProgramPdf } from "@/lib/pdf/workout-program-pdf";
import {
  WorkoutDay,
  WorkoutDayProgress,
  WorkoutProgram,
} from "@/services/ai-workout-context-service";
import { findExerciseDetails } from "@/services/exercise-lookup-service";
import { Exercise } from "@/types/planner.types";

interface SavedWorkoutRecord extends WorkoutProgram {
  id: string;
  createdAt: string;
}

interface MemberAiWorkoutsTabProps {
  memberId: string;
  onOpenGenerator?: () => void;
}

function getGoalLabel(goal?: string): string {
  switch (goal) {
    case "explosive_power":
      return "⚡ Експлозивна мощ и отскок";
    case "aerobic_endurance":
      return "🫁 Аеробна издръжливост";
    case "agility_footwork":
      return "👟 Работа с крака & Пъргавина";
    case "injury_rehab":
      return "🩹 Щадящ режим & Рехабилитация";
    case "pre_tournament_taper":
      return "🏆 Предсъстезателен тейпър";
    case "general_conditioning":
    default:
      return "🏋️ Обща кондиционна подготовка";
  }
}

function getIntensityBadge(intensity: "low" | "medium" | "high") {
  if (intensity === "high") {
    return (
      <Badge className="bg-rose-500 text-[10px] text-white uppercase hover:bg-rose-600">
        Висока
      </Badge>
    );
  }
  if (intensity === "medium") {
    return (
      <Badge className="bg-amber-500 text-[10px] text-white uppercase hover:bg-amber-600">
        Умерена
      </Badge>
    );
  }
  return (
    <Badge className="bg-emerald-500 text-[10px] text-white uppercase hover:bg-emerald-600">
      Ниска / Регенерация
    </Badge>
  );
}

function formatDayCalendarDate(dateStr?: string) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("bg-BG", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return dateStr;
  }
}

function DayDetailCard({
  day,
  memberId,
  programId,
  progress,
  onProgressUpdated,
  onSelectExercise,
}: {
  day: WorkoutDay;
  memberId: string;
  programId: string;
  progress?: WorkoutDayProgress;
  onProgressUpdated?: (
    newProg: WorkoutDayProgress,
    overallPercent?: number
  ) => void;
  onSelectExercise?: (exercise: WorkoutDay["exercises"][number]) => void;
}) {
  const { idToken } = useAuth();
  const isCompleted = !!progress?.completed;
  const [rpe, setRpe] = useState<number>(progress?.rpeRating ?? 7);
  const [notes, setNotes] = useState<string>(progress?.notes ?? "");
  const [completedExs, setCompletedExs] = useState<number[]>(
    progress?.completedExercises ?? []
  );
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    setRpe(progress?.rpeRating ?? 7);
    setNotes(progress?.notes ?? "");
    setCompletedExs(progress?.completedExercises ?? []);
  }, [progress]);

  const handleToggleDayCompleted = async (nextCompleted: boolean) => {
    try {
      setSaving(true);
      const res = await updateWorkoutProgramProgressAction(
        memberId,
        programId,
        day.dayNumber,
        {
          completed: nextCompleted,
          rpeRating: rpe,
          notes,
          completedExercises: completedExs,
        },
        idToken || undefined
      );
      if (res.success) {
        toast.success(
          nextCompleted
            ? `${day.dayName} е отбелязан като завършен!`
            : `${day.dayName} е върнат в предстоящи.`
        );
        onProgressUpdated?.(
          {
            completed: nextCompleted,
            rpeRating: rpe,
            notes,
            completedExercises: completedExs,
            completedAt: nextCompleted ? new Date().toISOString() : undefined,
          },
          res.overallProgressPercent
        );
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Грешка при запис на прогреса.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleExercise = async (exIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextCompletedExs = completedExs.includes(exIndex)
      ? completedExs.filter((i) => i !== exIndex)
      : [...completedExs, exIndex];

    setCompletedExs(nextCompletedExs);
    try {
      const res = await updateWorkoutProgramProgressAction(
        memberId,
        programId,
        day.dayNumber,
        {
          completed: isCompleted,
          rpeRating: rpe,
          notes,
          completedExercises: nextCompletedExs,
        },
        idToken || undefined
      );
      if (res.success) {
        onProgressUpdated?.(
          {
            completed: isCompleted,
            rpeRating: rpe,
            notes,
            completedExercises: nextCompletedExs,
          },
          res.overallProgressPercent
        );
      }
    } catch {
      // non-blocking
    }
  };

  return (
    <div className="space-y-3.5">
      <div className="flex flex-col justify-between gap-2.5 rounded-2xl border border-zinc-200/80 bg-zinc-50 p-4 sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {day.dayName}
            </h4>
            {day.calendarDate && (
              <Badge
                variant="outline"
                className="flex items-center gap-1 border-blue-200 bg-blue-50/70 text-[10px] font-semibold text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
              >
                📅 {formatDayCalendarDate(day.calendarDate)}
              </Badge>
            )}
            {day.isCompetitionDay && (
              <Badge className="bg-linear-to-r from-amber-500 to-orange-500 text-[10px] font-bold text-white shadow-xs">
                🏆 {day.competitionTitle || "Официално състезание"}
              </Badge>
            )}
            {isCompleted ? (
              <Badge className="bg-emerald-600 text-[10px] font-semibold text-white">
                ✅ Завършена
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-zinc-300 text-[10px] text-zinc-600 dark:text-zinc-400"
              >
                ⏳ Предстояща
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {day.focus}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <Clock className="size-3.5" />
            <span>{day.durationMinutes} мин</span>
          </div>
          {getIntensityBadge(day.intensity)}
          {isCompleted ? (
            <Button
              size="sm"
              variant="outline"
              disabled={saving}
              onClick={() => handleToggleDayCompleted(false)}
              className="h-7.5 rounded-xl border-zinc-300 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300"
            >
              <RotateCcw className="mr-1 size-3" /> Върни
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={saving}
              onClick={() => handleToggleDayCompleted(true)}
              className="h-7.5 rounded-xl bg-emerald-600 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
            >
              <CheckCircle2 className="mr-1 size-3" /> Маркирай завършена
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-2.5 text-xs text-blue-950 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-200">
        <span className="mr-1.5 font-semibold">Загрявка:</span>
        {day.warmup.join(" • ")}
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-100 text-[10px] tracking-wider text-zinc-600 uppercase dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="w-10 p-2.5 text-center">Статус</th>
              <th className="p-2.5">Упражнение</th>
              <th className="p-2.5 text-center">Серии</th>
              <th className="p-2.5 text-center">Повторения</th>
              <th className="p-2.5 text-center">Почивка</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {day.exercises.map((ex, i) => {
              const isExDone = completedExs.includes(i);
              return (
                <tr
                  key={i}
                  onClick={() => onSelectExercise?.(ex)}
                  className={`group cursor-pointer transition-colors ${
                    isExDone
                      ? "bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30"
                      : "hover:bg-blue-50/70 dark:hover:bg-blue-950/30"
                  }`}
                  title="Кликнете за методическо описание от базата данни"
                >
                  <td
                    className="p-2.5 text-center"
                    onClick={(e) => handleToggleExercise(i, e)}
                  >
                    <span
                      className={`inline-flex size-4.5 cursor-pointer items-center justify-center rounded border transition-all ${
                        isExDone
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-zinc-300 bg-white hover:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                      }`}
                    >
                      {isExDone && <CheckCircle2 className="size-3" />}
                    </span>
                  </td>
                  <td className="p-2.5 font-medium text-zinc-900 dark:text-zinc-100">
                    <div className="flex items-center gap-1.5 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      <span
                        className={isExDone ? "text-zinc-400 line-through" : ""}
                      >
                        {ex.name}
                      </span>
                      <Info className="size-3 shrink-0 text-blue-500 opacity-60 group-hover:opacity-100" />
                    </div>
                    {ex.techniqueTip && (
                      <div className="text-[10px] text-zinc-500 italic">
                        {ex.techniqueTip}
                      </div>
                    )}
                  </td>
                  <td className="p-2.5 text-center font-semibold">{ex.sets}</td>
                  <td className="p-2.5 text-center">{ex.repsOrDuration}</td>
                  <td className="p-2.5 text-center text-zinc-500">
                    {ex.restSec}s
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-2.5 text-xs text-emerald-950 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200">
        <span className="mr-1.5 font-semibold">Разгрявка:</span>
        {day.cooldown.join(" • ")}
      </div>

      {/* Daily Progress & Biofeedback Logging Card */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3.5 text-xs dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            Оценка на натоварването (RPE 1-10):
          </span>
          <div className="flex flex-wrap gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  setRpe(num);
                  if (isCompleted) {
                    updateWorkoutProgramProgressAction(
                      memberId,
                      programId,
                      day.dayNumber,
                      {
                        completed: true,
                        rpeRating: num,
                        notes,
                        completedExercises: completedExs,
                      },
                      idToken || undefined
                    ).then((res) => {
                      if (res.success) {
                        toast.success(`RPE зададено на ${num}/10`);
                        onProgressUpdated?.(
                          {
                            completed: true,
                            rpeRating: num,
                            notes,
                            completedExercises: completedExs,
                          },
                          res.overallProgressPercent
                        );
                      }
                    });
                  }
                }}
                className={`size-6 rounded-md text-[10px] font-bold transition-all ${
                  rpe === num
                    ? "bg-blue-600 text-white shadow-xs"
                    : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2.5 flex items-center gap-2">
          <input
            type="text"
            placeholder="Бележки за изпълнението, умора или забележки..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-8 flex-1 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={saving}
            onClick={() => handleToggleDayCompleted(isCompleted)}
            className="h-8 rounded-lg text-xs"
          >
            Запази
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MemberAiWorkoutsTab({
  memberId,
  onOpenGenerator,
}: MemberAiWorkoutsTabProps) {
  const { idToken } = useAuth();
  const [programs, setPrograms] = useState<SavedWorkoutRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewingProgram, setViewingProgram] =
    useState<SavedWorkoutRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedExerciseData, setSelectedExerciseData] = useState<{
    exercise: Partial<Exercise> | null;
    workoutContext?: {
      sets?: number;
      repsOrDuration?: string;
      restSec?: number;
      techniqueTip?: string;
    };
  } | null>(null);

  const handleSelectExercise = async (ex: WorkoutDay["exercises"][number]) => {
    const details = await findExerciseDetails(ex.name, ex.techniqueTip);
    setSelectedExerciseData({
      exercise: details,
      workoutContext: {
        sets: ex.sets,
        repsOrDuration: ex.repsOrDuration,
        restSec: ex.restSec,
        techniqueTip: ex.techniqueTip,
      },
    });
  };

  const fetchPrograms = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMemberWorkoutProgramsAction(
        memberId,
        idToken || undefined
      );
      if (res.success && res.data) {
        setPrograms(res.data as SavedWorkoutRecord[]);
      }
    } catch (err) {
      console.error("Failed to fetch member AI programs:", err);
      toast.error("Грешка при зареждане на AI програмите.");
    } finally {
      setLoading(false);
    }
  }, [memberId, idToken]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const handleDeleteProgram = async (programId: string) => {
    if (
      !window.confirm(
        "Сигурни ли сте, че искате да изтриете тази тренировъчна програма?"
      )
    ) {
      return;
    }
    try {
      setDeletingId(programId);
      const res = await deleteWorkoutProgramAction(
        memberId,
        programId,
        idToken || undefined
      );
      if (res.success) {
        toast.success(res.message);
        setPrograms((prev) => prev.filter((p) => p.id !== programId));
        if (viewingProgram?.id === programId) {
          setViewingProgram(null);
        }
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Грешка при изтриване на програмата.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadPdf = async (prog: SavedWorkoutRecord) => {
    try {
      toast.info("Подготовка на PDF документа...");
      await exportWorkoutProgramPdf(prog);
      toast.success("PDF документът е свален успешно!");
    } catch (err) {
      console.error("PDF download error:", err);
      toast.error("Грешка при сваляне на PDF документа.");
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "Неизвестна дата";
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "Неизвестна дата";
    return d.toLocaleString("bg-BG", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-3xl border border-zinc-100 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <Sparkles className="size-6 animate-spin text-blue-600" />
        <p className="text-xs text-zinc-500">
          Зареждане на запазените тренировъчни програми...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Запазени AI Тренировъчни Програми ({programs.length})
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Генерирани с Google Gemini микроцикли, съобразени с физическия
            статус на състезателя
          </p>
        </div>
        {onOpenGenerator && (
          <Button
            onClick={onOpenGenerator}
            className="h-9 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-none hover:bg-blue-700"
          >
            <Plus className="mr-1.5 size-4" /> Нова AI Програма
          </Button>
        )}
      </div>

      {programs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <div className="rounded-2xl bg-blue-50 p-3.5 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <Sparkles className="size-8" />
          </div>
          <h4 className="mt-3 text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Няма запазени AI програми
          </h4>
          <p className="mt-1 max-w-sm text-xs text-zinc-500">
            Създайте първия персонализиран микроцикъл за състезателя чрез бутона
            „AI Тренировка“.
          </p>
          {onOpenGenerator && (
            <Button
              onClick={onOpenGenerator}
              variant="outline"
              className="mt-4 rounded-xl border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300"
            >
              <Sparkles className="mr-2 size-3.5" /> Генерирай с Gemini Flash
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {programs.map((prog) => {
            const daysCount = prog.schedule?.length || 0;
            const isDeload = prog.safetyAudit?.fatigueDeloadActive;

            return (
              <div
                key={prog.id}
                className="flex flex-col justify-between rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-xs transition-all hover:border-blue-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-blue-900"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge
                      variant="outline"
                      className="border-blue-200 bg-blue-50/50 text-[11px] font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300"
                    >
                      {getGoalLabel(prog.targetGoal)}
                    </Badge>
                    {isDeload && (
                      <Badge className="bg-rose-500 text-[10px] text-white">
                        Deload
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h4 className="line-clamp-1 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {prog.programTitle || `${daysCount} Тренировъчни сесии`}
                    </h4>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-zinc-500">
                      <span>
                        {daysCount} тренировки ({prog.cycleDurationDays || 7}
                        -дневен цикъл)
                      </span>
                      {prog.startDate && (
                        <>
                          <span className="text-zinc-300 dark:text-zinc-700">
                            •
                          </span>
                          <span className="font-medium text-blue-600 dark:text-blue-400">
                            📅 {prog.startDate}{" "}
                            {prog.endDate ? `до ${prog.endDate}` : ""}
                          </span>
                        </>
                      )}
                      <span className="text-zinc-300 dark:text-zinc-700">
                        •
                      </span>
                      <div className="flex items-center gap-1 text-zinc-400">
                        <Calendar className="size-3.5" />
                        <span>{formatDate(prog.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {prog.progress?.overallProgressPercent !== undefined && (
                    <div className="space-y-1 rounded-2xl bg-blue-50/60 p-2.5 dark:bg-blue-950/20">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-blue-950 dark:text-blue-200">
                          Прогрес на цикъла:
                        </span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {prog.progress.overallProgressPercent}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900/40">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all duration-300"
                          style={{
                            width: `${prog.progress.overallProgressPercent}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1 rounded-xl bg-zinc-50 p-2.5 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span className="truncate">
                        {prog.safetyAudit?.activeRestrictions?.length
                          ? `${prog.safetyAudit.activeRestrictions.length} мерки за сигурност`
                          : "Няма ограничения"}
                      </span>
                    </div>
                    {prog.safetyAudit?.coachSafetyNotes && (
                      <p className="line-clamp-1 text-[11px] text-zinc-500 italic">
                        „{prog.safetyAudit.coachSafetyNotes}“
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <Button
                    onClick={() => setViewingProgram(prog)}
                    variant="outline"
                    className="h-8.5 flex-1 rounded-xl text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  >
                    <Eye className="mr-1.5 size-3.5" /> Преглед
                  </Button>
                  <Button
                    onClick={() => handleDownloadPdf(prog)}
                    variant="outline"
                    className="h-8.5 rounded-xl border-blue-200 bg-blue-50/50 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300"
                    title="Свали PDF програма"
                  >
                    <Download className="size-3.5" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteProgram(prog.id)}
                    disabled={deletingId === prog.id}
                    variant="outline"
                    className="h-8.5 rounded-xl border-rose-200 bg-rose-50/50 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-100 hover:text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-400"
                    title="Изтрий програмата"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Program Details Modal */}
      {viewingProgram && (
        <Dialog
          open={!!viewingProgram}
          onOpenChange={(open) => !open && setViewingProgram(null)}
        >
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-3xl border-zinc-200 p-0 dark:border-zinc-800">
            <div className="border-b border-zinc-100 bg-linear-to-r from-blue-50/50 via-white to-transparent p-6 dark:border-zinc-800 dark:from-blue-950/20 dark:via-zinc-950">
              <DialogHeader>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-blue-600 p-2.5 text-white">
                      <Sparkles className="size-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
                        {getGoalLabel(viewingProgram.targetGoal)}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-zinc-500">
                        Запазена програма •{" "}
                        {formatDate(viewingProgram.createdAt)}
                      </DialogDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleDownloadPdf(viewingProgram)}
                      size="sm"
                      className="rounded-xl bg-blue-600 text-xs text-white hover:bg-blue-700"
                    >
                      <Download className="mr-1.5 size-3.5" /> Свали PDF
                    </Button>
                    <Button
                      onClick={() => handleDeleteProgram(viewingProgram.id)}
                      disabled={deletingId === viewingProgram.id}
                      size="sm"
                      variant="outline"
                      className="rounded-xl border-rose-200 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900 dark:text-rose-400"
                    >
                      <Trash2 className="mr-1.5 size-3.5" /> Изтрий
                    </Button>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <div className="space-y-5 p-6">
              {viewingProgram.safetyAudit && (
                <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50 p-4 text-xs dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="mb-2 flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100">
                    <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Инструкции за безопасност и ограничения:</span>
                  </div>
                  <ul className="space-y-1 text-zinc-600 dark:text-zinc-400">
                    {viewingProgram.safetyAudit.activeRestrictions.map(
                      (r, i) => (
                        <li key={i}>• {r}</li>
                      )
                    )}
                  </ul>
                  {viewingProgram.safetyAudit.coachSafetyNotes && (
                    <p className="mt-2 border-t border-zinc-200/50 pt-2 text-[11px] text-zinc-500 italic">
                      Бележка: {viewingProgram.safetyAudit.coachSafetyNotes}
                    </p>
                  )}
                </div>
              )}

              <Tabs defaultValue="0" className="w-full">
                <TabsList className="flex h-auto w-full gap-1 overflow-x-auto rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900">
                  {viewingProgram.schedule?.map((day, idx) => {
                    const isDayDone =
                      viewingProgram.progress?.completedDays?.[day.dayNumber]
                        ?.completed;
                    return (
                      <TabsTrigger
                        key={idx}
                        value={String(idx)}
                        className="flex-1 rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-blue-400"
                      >
                        {isDayDone ? "✅ " : ""}
                        {day.dayName}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {viewingProgram.schedule?.map((day, idx) => (
                  <TabsContent key={idx} value={String(idx)} className="mt-4">
                    <DayDetailCard
                      day={day}
                      memberId={memberId}
                      programId={viewingProgram.id}
                      progress={
                        viewingProgram.progress?.completedDays?.[day.dayNumber]
                      }
                      onProgressUpdated={(newProg, overallPercent) => {
                        setViewingProgram((prev) => {
                          if (!prev) return null;
                          const completedDays = {
                            ...(prev.progress?.completedDays || {}),
                            [day.dayNumber]: newProg,
                          };
                          const totalDays = prev.schedule?.length || 1;
                          const calcPercent =
                            overallPercent ??
                            Math.min(
                              100,
                              Math.round(
                                (Object.values(completedDays).filter(
                                  (d) => d.completed
                                ).length /
                                  totalDays) *
                                  100
                              )
                            );
                          return {
                            ...prev,
                            progress: {
                              completedDays,
                              overallProgressPercent: calcPercent,
                              lastUpdated: new Date().toISOString(),
                            },
                          };
                        });
                        setPrograms((prev) =>
                          prev.map((p) => {
                            if (p.id !== viewingProgram.id) return p;
                            const completedDays = {
                              ...(p.progress?.completedDays || {}),
                              [day.dayNumber]: newProg,
                            };
                            const totalDays = p.schedule?.length || 1;
                            const calcPercent =
                              overallPercent ??
                              Math.min(
                                100,
                                Math.round(
                                  (Object.values(completedDays).filter(
                                    (d) => d.completed
                                  ).length /
                                    totalDays) *
                                    100
                                )
                              );
                            return {
                              ...p,
                              progress: {
                                completedDays,
                                overallProgressPercent: calcPercent,
                                lastUpdated: new Date().toISOString(),
                              },
                            };
                          })
                        );
                      }}
                      onSelectExercise={handleSelectExercise}
                    />
                  </TabsContent>
                ))}
              </Tabs>

              {viewingProgram.recoveryRecommendations?.length > 0 && (
                <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold text-zinc-900 uppercase dark:text-zinc-100">
                    <HeartPulse className="size-4 text-rose-500" />
                    <span>Препоръки за възстановяване:</span>
                  </div>
                  <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                    {viewingProgram.recoveryRecommendations.map((rec, i) => (
                      <li key={i}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {selectedExerciseData && (
        <ExerciseDetailModal
          open={!!selectedExerciseData}
          onOpenChange={(open: boolean) => {
            if (!open) setSelectedExerciseData(null);
          }}
          exercise={selectedExerciseData.exercise}
          workoutContext={selectedExerciseData.workoutContext}
        />
      )}
    </div>
  );
}
