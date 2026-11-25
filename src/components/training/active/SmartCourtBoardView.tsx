"use client";

import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Flame,
  Loader2,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Printer,
  RotateCcw,
  Shuffle,
  Star,
  Target,
  Trophy,
  UserCheck,
  Users,
  Volume2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { CoachMethodologyDialog } from "@/components/training/exercises/CoachMethodologyDialog";
import { DrillCourtDiagram } from "@/components/training/exercises/DrillCourtDiagram";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { BWF_FUNDAMENTAL_BY_ID } from "@/lib/bwf-fundamentals";
import {
  BWF_TEXTBOOK_EXERCISES,
  getExerciseCourtDiagram,
  getExerciseMethodology,
} from "@/lib/exercises/bwf-textbook";
import { pickNonRepeatingExercise } from "@/lib/fundamental-engine";
import type { SmartTrainingPlan } from "@/lib/smart-session-generator";
import { cn } from "@/lib/utils";
import { plannerService } from "@/services/planner-service";
import { useAppStore } from "@/store/use-app-store";
import type { Member } from "@/types/member.types";
import type {
  Exercise,
  PlannerSession,
  SessionAttendance,
} from "@/types/planner.types";

import { QuickTestModal } from "./QuickTestModal";

function playAudioSignal(type: "beep" | "whistle") {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "whistle") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.45, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.55);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.55);
    } else {
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.16);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.16);
    }
  } catch {
    // Audio playback blocked by browser autoplay policy
  }
}

type PlayerQuickTag = "normal" | "star" | "struggle" | "discomfort";

interface SmartCourtBoardViewProps {
  session: PlannerSession;
  initialPlan: SmartTrainingPlan;
  allMembers: Member[];
}

export function SmartCourtBoardView({
  session,
  initialPlan,
  allMembers,
}: SmartCourtBoardViewProps) {
  const router = useRouter();
  const { activeBranch } = useAppStore();

  const [plan, setPlan] = useState<SmartTrainingPlan>(initialPlan);
  const [gymDisplayMode, setGymDisplayMode] = useState(false);
  const [exercisesPool, setExercisesPool] = useState<Exercise[]>([]);

  // Master Timer state (свирка + 3-2-1 отброяване)
  const [secondsLeft, setSecondsLeft] = useState(plan.warmupMinutes * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [activeTimerLabel, setActiveTimerLabel] = useState("Загрявка");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Dialog states
  const [methodologyExercise, setMethodologyExercise] =
    useState<Exercise | null>(null);
  const [quickTestTarget, setQuickTestTarget] = useState<{
    memberId: string;
    memberName: string;
    testId: string;
  } | null>(null);
  const [completedTests, setCompletedTests] = useState<Record<string, string>>(
    {}
  );

  // 20-секундно приключване (по подразбиране всички "normal")
  const [playerTags, setPlayerTags] = useState<Record<string, PlayerQuickTag>>(
    {}
  );
  const [publishParentReport, setPublishParentReport] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    const fallback: Exercise[] = BWF_TEXTBOOK_EXERCISES.map((seed, idx) => ({
      ...seed,
      id: `tb-${idx}`,
      siteId: activeBranch,
      createdAt: "",
      updatedAt: "",
    }));
    setExercisesPool(fallback);
    plannerService
      .getExercises(activeBranch)
      .then((loaded) => {
        if (loaded.length > 0) {
          const byName = new Map(fallback.map((e) => [e.name, e]));
          loaded.forEach((e) =>
            byName.set(e.name, { ...byName.get(e.name), ...e })
          );
          setExercisesPool(Array.from(byName.values()));
        }
      })
      .catch(() => {});
  }, [activeBranch]);

  useEffect(() => {
    if (!timerRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          playAudioSignal("whistle");
          toast.info(`Край на блок: ${activeTimerLabel}!`);
          return 0;
        }
        if (prev <= 4) {
          playAudioSignal("beep");
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning, activeTimerLabel]);

  const setTimerPreset = (label: string, minutes: number) => {
    setTimerRunning(false);
    setActiveTimerLabel(label);
    setSecondsLeft(minutes * 60);
  };

  const formatClock = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleSwapExercise = (courtId: string) => {
    setPlan((prev) => ({
      ...prev,
      courts: prev.courts.map((c) => {
        if (c.id !== courtId) return c;
        const nextSeed = c.rotationSeed + 1;
        const nextEx = pickNonRepeatingExercise({
          fundamentalId: c.fundamentalId,
          stage: c.stage,
          exercises: exercisesPool,
          recentlyUsedNames: [c.exercise.name],
          availableEquipment: prev.selectedEquipment,
          allowCoachFeed: c.isCoachCourt,
          preferGamesOnly: prev.dayMode === "games_recovery",
          rotationSeed: nextSeed,
        });
        return nextEx ? { ...c, exercise: nextEx, rotationSeed: nextSeed } : c;
      }),
    }));
  };

  const handleMovePlayer = (
    memberId: string,
    fromCourtId: string,
    toCourtId: string
  ) => {
    if (fromCourtId === toCourtId) return;
    setPlan((prev) => {
      const from = prev.courts.find((c) => c.id === fromCourtId);
      const player = from?.players.find((p) => p.memberId === memberId);
      if (!player) return prev;
      return {
        ...prev,
        courts: prev.courts.map((c) => {
          if (c.id === fromCourtId) {
            return {
              ...c,
              players: c.players.filter((p) => p.memberId !== memberId),
            };
          }
          if (c.id === toCourtId) {
            return { ...c, players: [...c.players, player] };
          }
          return c;
        }),
      };
    });
  };

  const presentPlayerIds = plan.courts.flatMap((c) =>
    c.players.map((p) => p.memberId)
  );
  const latecomerCandidates = allMembers.filter(
    (m) =>
      m.siteId !== "recoveryzone" &&
      m.status !== "inactive" &&
      !presentPlayerIds.includes(m.id)
  );

  const handleAddLatecomer = (memberId: string, courtId: string) => {
    const member = allMembers.find((m) => m.id === memberId);
    if (!member) return;
    setPlan((prev) => ({
      ...prev,
      courts: prev.courts.map((c) =>
        c.id === courtId
          ? {
              ...c,
              players: [
                ...c.players,
                {
                  memberId: member.id,
                  name: `${member.firstName} ${member.lastName}`.trim(),
                  ageGroup: member.ageGroup || "U13",
                  recommendLightLoad: false,
                },
              ],
            }
          : c
      ),
    }));
    toast.success(`${member.firstName} е добавен/а в движение!`);
  };

  const handleQuickFinish = async () => {
    setIsFinishing(true);
    try {
      const nowIso = new Date().toISOString();
      const records: SessionAttendance[] = plan.courts.flatMap((court) =>
        court.players.map((p) => {
          const tag = playerTags[p.memberId] || "normal";
          return {
            id: "",
            siteId: activeBranch,
            sessionId: session.id,
            memberId: p.memberId,
            date: session.date || nowIso,
            rpe: tag === "discomfort" ? 4 : tag === "star" ? 7 : 6,
            effort: tag === "star" ? 5 : tag === "struggle" ? 3 : 4,
            medicalStatus: tag === "discomfort" ? "discomfort" : "healthy",
            note:
              tag === "star"
                ? `⭐ Отличен напредък (${BWF_FUNDAMENTAL_BY_ID[court.fundamentalId].shortTitle})`
                : tag === "struggle"
                  ? `⚠️ Затруднение (${BWF_FUNDAMENTAL_BY_ID[court.fundamentalId].shortTitle})`
                  : tag === "discomfort"
                    ? "🩹 Отбелязан дискомфорт по време на тренировка"
                    : `Фундамент: ${BWF_FUNDAMENTAL_BY_ID[court.fundamentalId].shortTitle}`,
            createdAt: nowIso,
            updatedAt: nowIso,
          };
        })
      );

      if (records.length > 0) {
        await plannerService.saveAttendanceBatch(
          activeBranch,
          session.id,
          records
        );
      }

      await plannerService.updateSession(session.id, {
        status: "completed",
        smartPlan: {
          ...plan,
          publishedToParentPortal: publishParentReport,
        } as unknown as Record<string, unknown>,
      });

      toast.success(
        publishParentReport
          ? "Тренировката е приключена и дневният отчет е достъпен в Родителския портал!"
          : "Тренировката е приключена и записана успешно в досиетата!"
      );
      router.push("/training/planner");
    } catch (err) {
      console.error(err);
      toast.error("Грешка при приключване на тренировката.");
    } finally {
      setIsFinishing(false);
    }
  };

  const shadowHref = plan.shadowBlock
    ? `/training/shadow?scheduleId=${session.eventId || ""}&corners=${plan.shadowBlock.corners.join(",")}&members=${presentPlayerIds.join(",")}`
    : "/training/shadow";

  const tournamentsHref = plan.matchesBlock
    ? `/tournaments?new=true&ranking=${plan.matchesBlock.countsForRanking ? "true" : "false"}&members=${presentPlayerIds.join(",")}`
    : "/tournaments?new=true";

  return (
    <div
      className={cn(
        "mx-auto space-y-5 pb-20",
        gymDisplayMode ? "max-w-none px-4" : "max-w-7xl"
      )}
    >
      {/* Горна лента за треньора (Лаптоп / Екран за залата / Печат / Мостове) */}
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-2xs lg:flex-row lg:items-center lg:justify-between print:hidden dark:border-zinc-800 dark:bg-zinc-900/70">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="rounded-xl"
            aria-label="Обратно към Планировчика"
          >
            <Link href="/training/planner">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-bold text-zinc-950 dark:text-white">
              {session.title}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Табло на кортовете • {presentPlayerIds.length} състезатели •{" "}
              {plan.courtsCount} корта
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={gymDisplayMode ? "default" : "outline"}
            size="sm"
            onClick={() => setGymDisplayMode((v) => !v)}
            className="rounded-xl text-xs font-semibold dark:border-zinc-700"
          >
            {gymDisplayMode ? (
              <Minimize2 className="mr-1.5 size-3.5" />
            ) : (
              <Maximize2 className="mr-1.5 size-3.5" />
            )}
            {gymDisplayMode ? "Нормален изглед" : "Изглед за залата"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl text-xs font-semibold dark:border-zinc-700"
          >
            <Printer className="mr-1.5 size-3.5" />
            Печат (1 лист)
          </Button>
          {plan.shadowBlock && (
            <Button
              asChild
              size="sm"
              className="rounded-xl bg-amber-500 text-xs font-bold text-zinc-950 hover:bg-amber-600"
            >
              <Link href={shadowHref}>
                <Zap className="mr-1.5 size-3.5" />
                Стартирай Shadow ({plan.shadowBlock.durationMinutes}м)
              </Link>
            </Button>
          )}
          {plan.matchesBlock && (
            <Button
              asChild
              size="sm"
              className="rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700"
            >
              <Link href={tournamentsHref}>
                <Trophy className="mr-1.5 size-3.5" />
                Финални срещи (Турнири)
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* ГЛАВЕН ТАЙМЕР СЪС СВИРКА И 3-2-1 ОТБРОЯВАНЕ */}
      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-indigo-200/80 bg-zinc-950 p-4 text-white sm:flex-row print:hidden dark:border-indigo-900/60">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "font-mono font-black tracking-tight tabular-nums",
              gymDisplayMode ? "text-6xl" : "text-4xl",
              secondsLeft <= 10 && timerRunning
                ? "text-rose-400 animate-pulse"
                : "text-emerald-400"
            )}
          >
            {formatClock(secondsLeft)}
          </div>
          <div>
            <p className="text-xs font-bold tracking-wider text-zinc-400 uppercase">
              Активен блок
            </p>
            <p className="text-sm font-bold text-white">{activeTimerLabel}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <Button
            type="button"
            size="sm"
            onClick={() => setTimerRunning((r) => !r)}
            className="rounded-xl bg-emerald-500 font-bold text-zinc-950 hover:bg-emerald-400"
          >
            {timerRunning ? (
              <>
                <Pause className="mr-1.5 size-4" /> Пауза
              </>
            ) : (
              <>
                <Play className="mr-1.5 size-4" /> Старт
              </>
            )}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => playAudioSignal("whistle")}
            className="rounded-xl border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800"
            title="Звукова свирка"
          >
            <Volume2 className="mr-1.5 size-3.5" /> Свирка
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setTimerPreset("Загрявка", plan.warmupMinutes)}
            className="rounded-xl text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            Загрявка ({plan.warmupMinutes}м)
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setTimerPreset("Станция / Ротация", 12)}
            className="rounded-xl text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            Станция (12м)
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setTimerPreset("Заключителна", plan.cooldownMinutes)}
            className="rounded-xl text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            Край ({plan.cooldownMinutes}м)
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => {
              setTimerRunning(false);
              setSecondsLeft(plan.warmupMinutes * 60);
            }}
            className="rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-white"
            aria-label="Нулирай таймера"
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* ЗАГРЯВКА (С ИЗБОР В ДВИЖЕНИЕ) */}
      {!gymDisplayMode && (
        <Card className="rounded-2xl border-emerald-200/80 bg-emerald-50/30 dark:border-emerald-900/50 dark:bg-emerald-950/15">
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
                1. Загрявка ({plan.warmupMinutes} мин.)
              </h2>
              <div className="flex gap-1 print:hidden">
                {(["both", "kids", "older"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() =>
                      setPlan((p) => ({ ...p, selectedWarmupVariant: v }))
                    }
                    className={cn(
                      "rounded-lg px-2 py-0.5 text-[11px] font-semibold cursor-pointer",
                      plan.selectedWarmupVariant === v
                        ? "bg-emerald-600 text-white"
                        : "bg-white text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
                    )}
                  >
                    {v === "both"
                      ? "Двата варианта"
                      : v === "kids"
                        ? "✓ Вариант U9–U11"
                        : "✓ Вариант U13+"}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {plan.warmupCore.map((ex) => (
                <div
                  key={ex.id}
                  className="rounded-xl border border-emerald-200/70 bg-white p-2.5 text-xs dark:border-emerald-900/50 dark:bg-zinc-900/80"
                >
                  <p className="font-bold">{ex.name}</p>
                  <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    {ex.dosageText || `${ex.durationMinutes} мин.`}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ТАБЛО НА КОРТОВЕТЕ (КОРТ 1..6) */}
      <div
        className={cn(
          "grid grid-cols-1 gap-4",
          gymDisplayMode
            ? "md:grid-cols-2 xl:grid-cols-3"
            : "md:grid-cols-2 lg:grid-cols-3"
        )}
      >
        {plan.courts.map((court) => {
          const chapter = BWF_FUNDAMENTAL_BY_ID[court.fundamentalId];
          return (
            <Card
              key={court.id}
              className={cn(
                "rounded-2xl border bg-white shadow-2xs dark:bg-zinc-900/70",
                court.isCoachCourt
                  ? "border-amber-400 ring-1 ring-amber-400/30 dark:border-amber-600"
                  : "border-zinc-200/80 dark:border-zinc-800"
              )}
            >
              <CardContent className="flex h-full flex-col justify-between gap-3 p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge
                        className={cn(
                          "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950",
                          gymDisplayMode && "px-3 py-1 text-base"
                        )}
                      >
                        {court.label}
                      </Badge>
                      <Badge variant="outline" className="text-[11px]">
                        {chapter.shortTitle}
                      </Badge>
                      {court.isCoachCourt && (
                        <Badge className="bg-amber-500 text-zinc-950 hover:bg-amber-500 text-[10px]">
                          <UserCheck className="mr-1 size-2.5" /> Треньор
                        </Badge>
                      )}
                    </div>

                    {!gymDisplayMode && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSwapExercise(court.id)}
                        className="h-7 rounded-lg px-2 text-[11px] font-semibold print:hidden"
                      >
                        <Shuffle className="mr-1 size-3" /> Друг
                      </Button>
                    )}
                  </div>

                  {/* Играчи на корта */}
                  <div className="flex flex-wrap gap-1.5">
                    {court.players.map((p) => (
                      <div
                        key={p.memberId}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-bold dark:border-zinc-700 dark:bg-zinc-800",
                          gymDisplayMode ? "text-base" : "text-xs"
                        )}
                      >
                        <Users className="size-3.5 text-indigo-500" />
                        <span>{p.name}</span>
                        {!gymDisplayMode && plan.courts.length > 1 && (
                          <select
                            aria-label={`Премести ${p.name}`}
                            value={court.id}
                            onChange={(e) =>
                              handleMovePlayer(
                                p.memberId,
                                court.id,
                                e.target.value
                              )
                            }
                            className="ml-1 rounded bg-transparent text-[10px] text-indigo-600 print:hidden dark:text-indigo-400"
                          >
                            {plan.courts.map((t) => (
                              <option key={t.id} value={t.id}>
                                → {t.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Диагностични тестове (1 клик -> QuickTestModal) */}
                  {!gymDisplayMode && court.diagnosticAlerts.length > 0 && (
                    <div className="space-y-1 print:hidden">
                      {court.diagnosticAlerts.map((al, idx) => {
                        const doneKey = `${al.memberId}:${al.testId}`;
                        const doneScore = completedTests[doneKey];
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-2 rounded-xl bg-amber-50 px-2.5 py-1.5 text-[11px] dark:bg-amber-950/40"
                          >
                            <span className="flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-200">
                              {al.kind === "retest_ready" ? (
                                <Flame className="size-3.5 shrink-0 text-orange-500" />
                              ) : (
                                <AlertCircle className="size-3.5 shrink-0 text-amber-600" />
                              )}
                              <span className="truncate">
                                {al.memberName}: {al.testName}
                              </span>
                            </span>
                            {doneScore ? (
                              <Badge className="bg-emerald-600 text-white text-[10px]">
                                ✓ {doneScore}
                              </Badge>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() =>
                                  setQuickTestTarget({
                                    memberId: al.memberId,
                                    memberName: al.memberName,
                                    testId: al.testId,
                                  })
                                }
                                className="h-6 rounded-lg bg-indigo-600 px-2 text-[10px] font-bold text-white hover:bg-indigo-700"
                              >
                                <Target className="mr-1 size-2.5" />
                                Запиши тест
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Упражнение + SVG схема */}
                  <div className="rounded-xl border border-indigo-200/70 bg-indigo-50/30 p-3 dark:border-indigo-900/50 dark:bg-indigo-950/20">
                    <p
                      className={cn(
                        "font-bold text-zinc-950 dark:text-white",
                        gymDisplayMode ? "text-lg" : "text-sm"
                      )}
                    >
                      {court.exercise.name}
                    </p>
                    <p
                      className={cn(
                        "mt-1 font-semibold text-indigo-700 dark:text-indigo-300",
                        gymDisplayMode ? "text-sm" : "text-xs"
                      )}
                    >
                      {court.exercise.dosageText ||
                        `${court.exercise.durationMinutes} мин.`}
                    </p>
                  </div>

                  <DrillCourtDiagram
                    data={getExerciseCourtDiagram(court.exercise)}
                    compact={!gymDisplayMode}
                  />
                </div>

                {!gymDisplayMode && (
                  <div className="flex items-center justify-between border-t border-zinc-100 pt-2.5 print:hidden dark:border-zinc-800">
                    {latecomerCandidates.length > 0 ? (
                      <select
                        aria-label={`Добави закъснял на ${court.label}`}
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddLatecomer(e.target.value, court.id);
                            e.target.value = "";
                          }
                        }}
                        className="max-w-36 rounded-lg border border-zinc-200 bg-transparent px-2 py-1 text-[11px] text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                      >
                        <option value="">+ Закъснял...</option>
                        {latecomerCandidates.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.firstName} {m.lastName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span />
                    )}

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setMethodologyExercise(court.exercise)}
                      className="h-7 rounded-lg text-[11px] font-semibold dark:border-zinc-700"
                    >
                      <BookOpen className="mr-1.5 size-3" />
                      Методика
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 20-СЕКУНДНО ПРИКЛЮЧВАНЕ НА ТРЕНИРОВКАТА */}
      {!gymDisplayMode && (
        <Card className="rounded-2xl border-zinc-200/80 bg-white shadow-2xs print:hidden dark:border-zinc-800 dark:bg-zinc-900/70">
          <CardContent className="space-y-4 p-5">
            <div>
              <h2 className="text-base font-bold text-zinc-950 dark:text-white">
                Бързо приключване (20 секунди)
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                По подразбиране всички присъстващи са отбелязани като „Изпълнено
                нормално“. Цъкнете етикет само за изключенията.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {plan.courts.flatMap((court) =>
                court.players.map((p) => {
                  const tag = playerTags[p.memberId] || "normal";
                  return (
                    <div
                      key={p.memberId}
                      className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50/70 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950/50"
                    >
                      <span className="truncate font-semibold">{p.name}</span>
                      <div className="flex shrink-0 gap-1">
                        {(
                          [
                            { id: "star", label: "⭐", title: "Напредък" },
                            {
                              id: "struggle",
                              label: "⚠️",
                              title: "Затруднение",
                            },
                            {
                              id: "discomfort",
                              label: "🩹",
                              title: "Дискомфорт",
                            },
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            title={opt.title}
                            onClick={() =>
                              setPlayerTags((prev) => ({
                                ...prev,
                                [p.memberId]:
                                  prev[p.memberId] === opt.id
                                    ? "normal"
                                    : opt.id,
                              }))
                            }
                            className={cn(
                              "rounded-lg px-1.5 py-0.5 text-xs transition-all cursor-pointer",
                              tag === opt.id
                                ? "bg-indigo-600 text-white ring-2 ring-indigo-300"
                                : "bg-white hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-zinc-100 pt-3 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <Checkbox
                  checked={publishParentReport}
                  onCheckedChange={(v) => setPublishParentReport(Boolean(v))}
                />
                <Star className="size-3.5 text-amber-500" />
                Опционално: Публикувай кратък дневен отчет + 5-мин. домашно в
                Родителския портал
              </label>

              <Button
                type="button"
                disabled={isFinishing}
                onClick={handleQuickFinish}
                className="rounded-xl bg-emerald-600 px-6 text-xs font-bold text-white hover:bg-emerald-700"
              >
                {isFinishing ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-1.5 size-4" />
                )}
                Приключи и запиши тренировката
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {methodologyExercise && (
        <CoachMethodologyDialog
          open={Boolean(methodologyExercise)}
          onOpenChange={(o) => {
            if (!o) setMethodologyExercise(null);
          }}
          title={methodologyExercise.name}
          subtitle={methodologyExercise.description}
          dosageText={
            methodologyExercise.dosageText ||
            `${methodologyExercise.durationMinutes} мин.`
          }
          methodology={getExerciseMethodology(methodologyExercise)}
          courtDiagram={getExerciseCourtDiagram(methodologyExercise)}
        />
      )}

      {quickTestTarget && (
        <QuickTestModal
          open={Boolean(quickTestTarget)}
          onOpenChange={(o) => {
            if (!o) setQuickTestTarget(null);
          }}
          memberId={quickTestTarget.memberId}
          memberName={quickTestTarget.memberName}
          testId={quickTestTarget.testId}
          onSaved={(mId, tId, scoreDisplay) => {
            setCompletedTests((prev) => ({
              ...prev,
              [`${mId}:${tId}`]: scoreDisplay,
            }));
          }}
        />
      )}
    </div>
  );
}
