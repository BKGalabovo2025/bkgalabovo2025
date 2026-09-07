"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  HeartPulse,
  Save,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { saveWorkoutProgramAction } from "@/lib/actions/trainings";
import { exportWorkoutProgramPdf } from "@/lib/pdf/workout-program-pdf";
import {
  WorkoutDay,
  WorkoutProgram,
  WorkoutTargetGoal,
} from "@/services/ai-workout-context-service";
import { Member } from "@/types/member.types";

interface AiWorkoutGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member;
}

const TARGET_GOALS: Array<{
  value: WorkoutTargetGoal;
  label: string;
  icon: string;
}> = [
  {
    value: "general_conditioning",
    label: "Обща кондиционна подготовка",
    icon: "🏋️",
  },
  {
    value: "explosive_power",
    label: "Експлозивна мощ и отскок (Power)",
    icon: "⚡",
  },
  {
    value: "agility_footwork",
    label: "Работа с крака & Пъргавина (Footwork)",
    icon: "👟",
  },
  {
    value: "aerobic_endurance",
    label: "Аеробна издръжливост (Endurance)",
    icon: "🫁",
  },
  {
    value: "pre_tournament_taper",
    label: "Предсъстезателен тейпър (Tapering)",
    icon: "🏆",
  },
  {
    value: "injury_rehab",
    label: "Щадящ режим & Рехабилитация (Rehab)",
    icon: "🩹",
  },
];

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
      Ниска / Възстановяване
    </Badge>
  );
}

function SafetyBox({ safety }: { safety: WorkoutProgram["safetyAudit"] }) {
  const isDeload = safety.fatigueDeloadActive;

  return (
    <div
      className={`rounded-2xl border p-4 transition-all ${
        isDeload
          ? "border-rose-200 bg-rose-50/70 text-rose-950 dark:border-rose-900 dark:bg-rose-950/20"
          : "border-emerald-200 bg-emerald-50/70 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/20"
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        {isDeload ? (
          <AlertTriangle className="size-5 text-rose-600 dark:text-rose-400" />
        ) : (
          <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
        )}
        <h4 className="text-sm font-bold tracking-tight">
          {isDeload
            ? "ВНИМАНИЕ: АКТИВИРАН DELOAD РЕЖИМ (ВИСОКА УМОРА / RPE > 7.5)"
            : "ПРЕДПАЗНИ МЕРКИ И ОГРАНИЧЕНИЯ ЗА БЕЗОПАСНОСТ"}
        </h4>
      </div>
      <ul className="space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
        {safety.activeRestrictions.map((restriction) => (
          <li key={restriction} className="flex items-start gap-1.5">
            <span className="mt-0.5 text-zinc-400">•</span>
            <span>{restriction}</span>
          </li>
        ))}
      </ul>
      {safety.coachSafetyNotes && (
        <p className="mt-2 border-t border-zinc-200/50 pt-1.5 text-[11px] text-zinc-500 italic dark:border-zinc-800 dark:text-zinc-400">
          {safety.coachSafetyNotes}
        </p>
      )}
    </div>
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

function WorkoutDayCard({ day }: { day: WorkoutDay }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50 p-3.5 sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-900">
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
          </div>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {day.focus}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <Clock className="size-3.5" />
            <span>{day.durationMinutes} мин</span>
          </div>
          {getIntensityBadge(day.intensity)}
        </div>
      </div>

      <div className="dark:blue-900/50 rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-950 dark:bg-blue-950/20 dark:text-blue-200">
        <span className="mr-1.5 font-semibold">Загрявка:</span>
        {day.warmup.join(" • ")}
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-100 text-[10px] tracking-wider text-zinc-600 uppercase dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="p-2.5">Упражнение</th>
              <th className="p-2.5 text-center">Серии</th>
              <th className="p-2.5 text-center">Повторения</th>
              <th className="p-2.5 text-center">Почивка</th>
              <th className="p-2.5">Указания</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {day.exercises.map((ex, idx) => (
              <tr
                key={ex.name + idx}
                className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50"
              >
                <td className="p-2.5 font-semibold text-zinc-900 dark:text-zinc-100">
                  {ex.name}
                  {ex.targetWeakness && (
                    <span className="block text-[10px] font-normal text-blue-600 dark:text-blue-400">
                      Цел: {ex.targetWeakness}
                    </span>
                  )}
                </td>
                <td className="p-2.5 text-center font-bold text-zinc-900 dark:text-zinc-100">
                  {ex.sets}
                </td>
                <td className="p-2.5 text-center text-zinc-700 dark:text-zinc-300">
                  {ex.repsOrDuration}
                </td>
                <td className="p-2.5 text-center text-zinc-500">
                  {ex.restSec}с
                </td>
                <td className="max-w-xs p-2.5 text-[11px] text-zinc-600 dark:text-zinc-400">
                  {ex.techniqueTip}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        <span className="mr-1.5 font-semibold">Разпускане:</span>
        {day.cooldown.join(" • ")}
      </div>
    </div>
  );
}

function getStepBoxClass(isDone: boolean, isCurrent: boolean): string {
  if (isDone) {
    return "bg-emerald-50/50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-300";
  }
  if (isCurrent) {
    return "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-200 font-medium";
  }
  return "bg-zinc-50/50 border-zinc-200 text-zinc-400 dark:bg-zinc-900/50 dark:border-zinc-800";
}

function getStepIconClass(isCurrent: boolean): string {
  if (isCurrent) {
    return "size-4 shrink-0 text-blue-600 animate-pulse";
  }
  return "size-4 shrink-0 text-zinc-400";
}

function LoadingState({ step }: { step: number }) {
  const steps = [
    {
      label: "Анализиране на физическите тестове и BWF метрики...",
      icon: HeartPulse,
    },
    {
      label: "Проверка на умора (RPE), контузии и медицински статус...",
      icon: ShieldCheck,
    },
    { label: "Синтезиране на програма с Gemini Flash AI...", icon: Sparkles },
  ];

  return (
    <div className="flex flex-col items-center justify-center space-y-6 px-6 py-12 text-center">
      <div className="relative">
        <div className="flex size-20 animate-pulse items-center justify-center rounded-3xl bg-linear-to-tr from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/20">
          <Sparkles className="size-10 animate-spin text-white duration-3000" />
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          AI Треньорът подготвя програмата
        </h3>
        <p className="text-xs text-zinc-500">
          Индивидуално съобразяване с физическото състояние на състезателя
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3 text-left">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isDone = idx < step;
          const isCurrent = idx === step;

          return (
            <div
              key={s.label}
              className={`flex items-center gap-3 rounded-xl border p-2.5 text-xs transition-all ${getStepBoxClass(
                isDone,
                isCurrent
              )}`}
            >
              {isDone ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              ) : (
                <Icon className={getStepIconClass(isCurrent)} />
              )}
              <span className="truncate">{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AiWorkoutGeneratorModal({
  open,
  onOpenChange,
  member,
}: AiWorkoutGeneratorModalProps) {
  const { idToken } = useAuth();

  const [targetGoal, setTargetGoal] = useState<WorkoutTargetGoal>(
    "general_conditioning"
  );
  const [startDate, setStartDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [cycleDurationDays, setCycleDurationDays] = useState<number>(7);
  const [sessionsPerWeek, setSessionsPerWeek] = useState<number>(4);
  const [courtAccess, setCourtAccess] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const calculatedEndDate = useMemo(() => {
    try {
      const d = new Date(startDate + "T00:00:00");
      d.setDate(d.getDate() + cycleDurationDays - 1);
      return d.toLocaleDateString("bg-BG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  }, [startDate, cycleDurationDays]);

  const formattedStartDate = useMemo(() => {
    try {
      const d = new Date(startDate + "T00:00:00");
      return d.toLocaleDateString("bg-BG", { day: "numeric", month: "short" });
    } catch {
      return startDate;
    }
  }, [startDate]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      setLoadingStep(0);
      timer = setInterval(() => {
        setLoadingStep((prev) => (prev < 2 ? prev + 1 : prev));
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [loading]);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ai/generate-workout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          memberId: member.id,
          targetGoal,
          startDate,
          cycleDurationDays,
          sessionsPerWeek,
          courtAccess,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Грешка при генериране на тренировката.");
      }

      setProgram(data.program);
      toast.success("Тренировъчната програма е генерирана успешно!");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Неуспешно генериране.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToProfile = async () => {
    if (!program) return;
    try {
      setSaving(true);
      const res = await saveWorkoutProgramAction(
        idToken || "",
        member.id,
        program
      );
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Грешка при запис.");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!program) return;
    try {
      toast.info("Подготовка на PDF документа...");
      await exportWorkoutProgramPdf(program);
      toast.success("PDF документът е свален успешно!");
    } catch (err) {
      console.error(err);
      toast.error("Възникна проблем при генериране на PDF.");
    }
  };

  function renderParametersForm() {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Основен тренировъчен фокус
          </Label>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {TARGET_GOALS.map((g) => {
              const isSelected = targetGoal === g.value;
              return (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setTargetGoal(g.value)}
                  className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50/70 text-blue-950 shadow-sm dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-200"
                      : "border-zinc-200 bg-zinc-50/50 text-zinc-700 hover:bg-zinc-100/50 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300"
                  }`}
                >
                  <span className="text-xl">{g.icon}</span>
                  <span className="text-xs font-medium">{g.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Начална дата на цикъла
            </Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-10 rounded-xl text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Продължителност
            </Label>
            <Select
              value={String(cycleDurationDays)}
              onValueChange={(val) => setCycleDurationDays(Number(val))}
            >
              <SelectTrigger className="h-10 rounded-xl text-xs">
                <SelectValue placeholder="Изберете дни" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 дни (Експресен)</SelectItem>
                <SelectItem value="7">7 дни (1 седмица)</SelectItem>
                <SelectItem value="10">10 дни (Лагер)</SelectItem>
                <SelectItem value="14">14 дни (2 седмици)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Сесии на седмица
            </Label>
            <Select
              value={String(sessionsPerWeek)}
              onValueChange={(val) => setSessionsPerWeek(Number(val))}
            >
              <SelectTrigger className="h-10 rounded-xl text-xs">
                <SelectValue placeholder="Сесии седмично" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 тренировки (Поддържащ)</SelectItem>
                <SelectItem value="3">3 тренировки (Умерен)</SelectItem>
                <SelectItem value="4">4 тренировки (Клубен)</SelectItem>
                <SelectItem value="5">5 тренировки (Интензивен)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-200">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <span>
              📅 <strong>Период на цикъла:</strong> {formattedStartDate} –{" "}
              {calculatedEndDate}
            </span>
            <span className="text-[11px] font-medium text-blue-700 dark:text-blue-300">
              ✓ Синхронизирано с клубния график и състезания
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 rounded-xl border border-zinc-200/70 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <Checkbox
            id="courtAccess"
            checked={courtAccess}
            onCheckedChange={(checked) => setCourtAccess(!!checked)}
          />
          <Label
            htmlFor="courtAccess"
            className="cursor-pointer text-xs font-medium text-zinc-800 dark:text-zinc-200"
          >
            Включи упражнения с ракета на корт (специфични бадминтон дрилове)
          </Label>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Специфични бележки от треньора (опционално)
          </Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Напр. наблегни на ускорението в задно ляво поле или намали натоварването след турнира..."
            className="min-h-[70px] rounded-xl text-xs"
          />
        </div>

        <Button
          onClick={handleGenerate}
          className="h-11 w-full rounded-2xl bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 text-xs font-semibold tracking-wider text-white uppercase shadow-lg shadow-blue-500/25 transition-all hover:from-blue-700 hover:to-indigo-700"
        >
          <Sparkles className="mr-2 size-4" />
          Генерирай Персонализирана Програма
        </Button>
      </div>
    );
  }

  function renderProgramViewer(currentProgram: WorkoutProgram) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-zinc-200/80 bg-zinc-50 p-4 sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {currentProgram.programTitle}
            </h3>
            <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
              <span>{currentProgram.targetAthlete.name}</span>
              <span>•</span>
              <Badge variant="outline" className="text-[10px] uppercase">
                {currentProgram.targetAthlete.ageGroup}
              </Badge>
              <span>•</span>
              <span className="capitalize">
                {currentProgram.targetAthlete.skillLevel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setProgram(null)}
              className="h-9 rounded-xl text-xs font-medium"
            >
              Параметри
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadPdf}
              className="h-9 rounded-xl text-xs font-medium"
            >
              <Download className="mr-1.5 size-3.5 text-blue-600" />
              PDF
            </Button>
            <Button
              onClick={handleSaveToProfile}
              disabled={saving}
              className="h-9 rounded-xl bg-zinc-900 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              <Save className="mr-1.5 size-3.5" />
              {saving ? "Запис..." : "Запази"}
            </Button>
          </div>
        </div>

        <SafetyBox safety={currentProgram.safetyAudit} />

        <div className="space-y-3">
          <h4 className="text-xs font-bold tracking-wider text-zinc-400 uppercase">
            Дневен График
          </h4>
          <Tabs defaultValue="day-0" className="w-full">
            <TabsList className="mb-4 flex h-auto flex-wrap gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900">
              {currentProgram.schedule.map((day, idx) => (
                <TabsTrigger
                  key={day.dayName + idx}
                  value={`day-${idx}`}
                  className="rounded-lg px-3 py-1.5 text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800"
                >
                  Ден {day.dayNumber}
                </TabsTrigger>
              ))}
            </TabsList>

            {currentProgram.schedule.map((day, idx) => (
              <TabsContent key={day.dayName + idx} value={`day-${idx}`}>
                <WorkoutDayCard day={day} />
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <div className="space-y-2 rounded-2xl border border-zinc-200/80 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-zinc-900 uppercase dark:text-zinc-100">
            <HeartPulse className="size-4 text-rose-500" />
            <span>Възстановяване & Recovery Zone</span>
          </div>
          <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
            {currentProgram.recoveryRecommendations.map((rec) => (
              <li key={rec} className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  function renderModalBody() {
    if (loading) {
      return <LoadingState step={loadingStep} />;
    }
    if (program) {
      return renderProgramViewer(program);
    }
    return renderParametersForm();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-3xl border-zinc-200 p-0 dark:border-zinc-800">
        <div className="border-b border-zinc-100 bg-linear-to-r from-blue-50/50 via-white to-transparent p-6 dark:border-zinc-800 dark:from-blue-950/20 dark:via-zinc-950">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-600 p-2.5 text-white shadow-md shadow-blue-500/20">
                <Sparkles className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-zinc-950 dark:text-zinc-50">
                  AI Генератор на Тренировки • Gemini Flash
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500">
                  Персонализиран микроцикъл за{" "}
                  {member.name || `${member.firstName} ${member.lastName}`}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6">{renderModalBody()}</div>
      </DialogContent>
    </Dialog>
  );
}
