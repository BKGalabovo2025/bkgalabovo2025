"use client";

import { doc, updateDoc } from "firebase/firestore";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  Flame,
  Info,
  Loader2,
  RefreshCw,
  Shuffle,
  Sparkles,
  Trophy,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { CoachMethodologyDialog } from "@/components/training/exercises/CoachMethodologyDialog";
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
import { BWF_FUNDAMENTAL_BY_ID } from "@/lib/bwf-fundamentals";
import {
  BWF_TEXTBOOK_EXERCISES,
  getExerciseCourtDiagram,
  getExerciseMethodology,
} from "@/lib/exercises/bwf-textbook";
import { db } from "@/lib/firebase";
import {
  evaluateMemberFundamentals,
  pickNonRepeatingExercise,
} from "@/lib/fundamental-engine";
import {
  DAY_MODE_META,
  type DayMode,
  generateSmartTrainingPlan,
  type MainStructureMode,
  type MatchPairingMode,
  type OverflowMode,
  type SmartAttendee,
  smartPlanToPlannerSessionPayload,
  type SmartTrainingPlan,
} from "@/lib/smart-session-generator";
import { cn } from "@/lib/utils";
import { getAllAssessments } from "@/services/assessment-service";
import { inventoryService } from "@/services/inventory-service";
import { getAllMembers } from "@/services/member-service";
import { plannerService } from "@/services/planner-service";
import { getEventsForPeriod } from "@/services/schedule-service";
import { useAppStore } from "@/store/use-app-store";
import type { ScheduleEvent } from "@/types";
import type { MemberAssessment } from "@/types/assessment.types";
import type { InventoryItem } from "@/types/inventory.types";
import type { Member } from "@/types/member.types";
import type { Exercise, PlannerSession } from "@/types/planner.types";

interface SmartSessionBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recentSessions: PlannerSession[];
  onSaved?: () => void;
}

export function SmartSessionBuilderDialog({
  open,
  onOpenChange,
  recentSessions,
  onSaved,
}: SmartSessionBuilderDialogProps) {
  const router = useRouter();
  const { activeBranch } = useAppStore();

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [assessments, setAssessments] = useState<MemberAssessment[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]);

  // Step 1: Schedule & Attendees
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");

  // Step 2: Parameters
  const [title, setTitle] = useState(
    `Тренировка ${new Date().toLocaleDateString("bg-BG")}`
  );
  const [warmupMinutes, setWarmupMinutes] = useState(15);
  const [mainMinutes, setMainMinutes] = useState(60);
  const [cooldownMinutes, setCooldownMinutes] = useState(15);
  const [courtsCount, setCourtsCount] = useState(5);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([
    "Конуси",
  ]);
  const [dayMode, setDayMode] = useState<DayMode>("standard");
  const [mainStructure, setMainStructure] =
    useState<MainStructureMode>("blocks");
  const [overflowMode, setOverflowMode] = useState<OverflowMode | undefined>(
    undefined
  );
  const [includeShadow, setIncludeShadow] = useState(true);
  const [shadowMinutes, setShadowMinutes] = useState(10);
  const [includeMatches, setIncludeMatches] = useState(true);
  const matchesMinutes = 10;
  const [matchesCountForRanking, setMatchesCountForRanking] = useState(false);
  const [matchPairingMode, setMatchPairingMode] =
    useState<MatchPairingMode>("balanced");
  const [showWeeklyBalance, setShowWeeklyBalance] = useState(false);

  // Step 3: Generated live plan
  const [plan, setPlan] = useState<SmartTrainingPlan | null>(null);
  const [rotationOffset, setRotationOffset] = useState(0);
  const [methodologyExercise, setMethodologyExercise] =
    useState<Exercise | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setIsLoadingData(true);

    const start = new Date();
    start.setDate(start.getDate() - 2);
    const end = new Date();
    end.setDate(end.getDate() + 14);

    Promise.all([
      getAllMembers(),
      getAllAssessments(activeBranch).catch(() => [] as MemberAssessment[]),
      plannerService.getExercises(activeBranch).catch(() => [] as Exercise[]),
      inventoryService
        .getInventory(activeBranch)
        .catch(() => [] as InventoryItem[]),
      getEventsForPeriod(start, end).catch(() => [] as ScheduleEvent[]),
    ])
      .then(([mems, assess, exs, inv, evs]) => {
        if (cancelled) return;
        const activeClubMembers = mems.filter(
          (m) =>
            m.siteId !== "recoveryzone" && m.status !== "inactive" && !m.isGuest
        );
        setMembers(activeClubMembers);
        setAssessments(assess);

        // Обединяваме BWF учебника с упражненията от Firestore
        const byName = new Map<string, Exercise>();
        BWF_TEXTBOOK_EXERCISES.forEach((seed, idx) => {
          byName.set(seed.name, {
            ...seed,
            id: `tb-${idx}`,
            siteId: activeBranch,
            createdAt: "",
            updatedAt: "",
          });
        });
        exs.forEach((e) => {
          const prev = byName.get(e.name);
          byName.set(e.name, prev ? { ...prev, ...e } : e);
        });
        setExercises(Array.from(byName.values()));

        setInventory(inv);
        const trainingEvents = evs.filter(
          (ev) => ev.type === "training" && !ev.isCancelled
        );
        setScheduleEvents(trainingEvents);

        // Автоматично избираме днешната тренировка от Графика, ако има такава
        const todayStr = new Date().toISOString().slice(0, 10);
        const todayEv =
          trainingEvents.find((e) => e.startDate.startsWith(todayStr)) ||
          trainingEvents[0];
        if (todayEv) {
          setSelectedEventId(todayEv.id);
          const attendedIds = (todayEv.attendees || [])
            .filter((a) => a.attended)
            .map((a) => a.memberId);
          if (attendedIds.length > 0) {
            setSelectedMemberIds(attendedIds);
          }
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingData(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, activeBranch]);

  const handleSelectScheduleEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    const ev = scheduleEvents.find((e) => e.id === eventId);
    if (!ev) return;
    setTitle(
      `${ev.title} (${new Date(ev.startDate).toLocaleDateString("bg-BG")})`
    );
    const attendedIds = (ev.attendees || [])
      .filter((a) => a.attended)
      .map((a) => a.memberId);
    if (attendedIds.length > 0) {
      setSelectedMemberIds(attendedIds);
      toast.info(`Заредени са ${attendedIds.length} присъстващи от Графика.`);
    }
  };

  const equipmentOptions = useMemo(() => {
    const names = new Set<string>([
      "Конуси",
      "Координационна стълбичка",
      "Кош с пера",
      "Обръчи",
      "Въжета",
    ]);
    inventory.forEach((item) => {
      if (item.name) names.add(item.name);
    });
    return Array.from(names);
  }, [inventory]);

  const smartAttendees: SmartAttendee[] = useMemo(() => {
    return selectedMemberIds
      .map((id) => members.find((m) => m.id === id))
      .filter((m): m is Member => Boolean(m))
      .map((member) => {
        const memberAssessments = assessments.filter(
          (a) => a.memberId === member.id
        );
        // Събираме имената на упражненията от последните 5 сесии, в които е участвало детето
        const recentUsed: string[] = [];
        recentSessions.slice(0, 5).forEach((s) => {
          const inSession = (s.sessionGroups || []).some((g) =>
            g.memberIds.includes(member.id)
          );
          if (!inSession) return;
          (s.blocks || []).forEach((b) => {
            b.items.forEach((it) => {
              if (it.exercise?.name) recentUsed.push(it.exercise.name);
            });
          });
        });

        const profile = evaluateMemberFundamentals({
          memberId: member.id,
          birthDate: member.dateOfBirth,
          assessments: memberAssessments,
        });

        return {
          member,
          profile,
          recentlyUsedExerciseNames: recentUsed,
        };
      });
  }, [selectedMemberIds, members, assessments, recentSessions]);

  const handleGenerate = (nextRotation = rotationOffset) => {
    if (smartAttendees.length === 0) {
      toast.error("Изберете поне 1 присъстващ състезател.");
      return;
    }
    const generated = generateSmartTrainingPlan({
      attendees: smartAttendees,
      exercises,
      courtsCount,
      totalMinutes: warmupMinutes + mainMinutes + cooldownMinutes,
      warmupMinutes,
      mainMinutes,
      cooldownMinutes,
      selectedEquipment,
      dayMode,
      mainStructure,
      overflowMode,
      includeShadow,
      shadowMinutes,
      includeMatches,
      matchesMinutes,
      matchesCountForRanking,
      matchPairingMode,
      recentSessions,
      rotationOffset: nextRotation,
    });
    setPlan(generated);
  };

  const handleSwapCourtExercise = (courtId: string) => {
    if (!plan) return;
    setPlan({
      ...plan,
      courts: plan.courts.map((c) => {
        if (c.id !== courtId) return c;
        const nextSeed = c.rotationSeed + 1;
        const nextEx = pickNonRepeatingExercise({
          fundamentalId: c.fundamentalId,
          stage: c.stage,
          exercises,
          recentlyUsedNames: [c.exercise.name],
          availableEquipment: plan.selectedEquipment,
          allowCoachFeed: c.isCoachCourt,
          preferGamesOnly: plan.dayMode === "games_recovery",
          rotationSeed: nextSeed,
        });
        return nextEx ? { ...c, exercise: nextEx, rotationSeed: nextSeed } : c;
      }),
    });
  };

  const handleMovePlayer = (
    memberId: string,
    fromCourtId: string,
    toCourtId: string
  ) => {
    if (!plan || fromCourtId === toCourtId) return;
    const fromCourt = plan.courts.find((c) => c.id === fromCourtId);
    const player = fromCourt?.players.find((p) => p.memberId === memberId);
    if (!player) return;

    setPlan({
      ...plan,
      courts: plan.courts.map((c) => {
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
    });
  };

  const handleSaveAndLaunch = async () => {
    if (!plan) return;
    setIsSaving(true);
    try {
      const selectedEv = scheduleEvents.find((e) => e.id === selectedEventId);
      const sessionDate = selectedEv?.startDate || new Date().toISOString();
      const payload = smartPlanToPlannerSessionPayload(plan, {
        siteId: activeBranch,
        date: sessionDate,
        title: title.trim() || "Интелигентна BWF тренировка",
        eventId: selectedEventId || undefined,
      });

      const sessionId = await plannerService.addSession(activeBranch, payload);

      // Двупосочна синхронизация на присъствията обратно в Графика (/schedule)
      if (selectedEv && db) {
        try {
          const existingMap = new Map(
            (selectedEv.attendees || []).map((a) => [a.memberId, a])
          );
          selectedMemberIds.forEach((mId) => {
            const m = members.find((x) => x.id === mId);
            if (!m) return;
            const prev = existingMap.get(mId);
            existingMap.set(mId, {
              ...(prev || {}),
              memberId: mId,
              name: `${m.firstName} ${m.lastName}`.trim(),
              attended: true,
            });
          });
          await updateDoc(doc(db, "events", selectedEv.id), {
            attendees: Array.from(existingMap.values()),
            attendeeMemberIds: Array.from(existingMap.keys()),
          });
        } catch (syncErr) {
          console.warn("Schedule attendance sync skipped:", syncErr);
        }
      }

      toast.success(
        "Тренировката е запазена и присъствията са синхронизирани с Графика!"
      );
      onSaved?.();
      onOpenChange(false);
      router.push(`/training/planner/${sessionId}/active`);
    } catch (err) {
      console.error(err);
      toast.error("Грешка при запазване на тренировката.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredMembers = members.filter((m) =>
    `${m.firstName} ${m.lastName}`
      .toLowerCase()
      .includes(memberSearch.toLowerCase().trim())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100%-1.5rem)] max-w-5xl flex-col gap-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-0 dark:border-zinc-800 dark:bg-zinc-950">
        <DialogHeader className="shrink-0 border-b border-zinc-200/80 bg-zinc-50/80 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/60">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-zinc-950 dark:text-white">
            <Sparkles className="size-5 text-indigo-600 dark:text-indigo-400" />
            Умен BWF Генератор на Дневна Тренировка
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-600 dark:text-zinc-400">
            100% детерминистичен по официалния BWF Учебник (без AI квоти) •
            Свързан с Графика, Досиетата, Тестовете и Инвентара.
          </DialogDescription>
        </DialogHeader>

        {isLoadingData ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
            {/* Стъпка 1: График & Присъстващи */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="space-y-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4 lg:col-span-5 dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5 text-xs font-bold uppercase text-zinc-700 dark:text-zinc-200">
                    <Calendar className="size-3.5 text-indigo-500" />
                    1. Тренировка от Графика & Присъстващи (
                    {selectedMemberIds.length})
                  </Label>
                </div>

                {scheduleEvents.length > 0 && (
                  <select
                    aria-label="Избери тренировка от Графика"
                    value={selectedEventId}
                    onChange={(e) => handleSelectScheduleEvent(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  >
                    <option value="">
                      — Свободна тренировка (без събитие) —
                    </option>
                    {scheduleEvents.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {new Date(ev.startDate).toLocaleDateString("bg-BG")} —{" "}
                        {ev.title} (
                        {(ev.attendees || []).filter((a) => a.attended).length}{" "}
                        прис.)
                      </option>
                    ))}
                  </select>
                )}

                <Input
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Търси състезател..."
                  className="h-8 rounded-xl text-xs dark:border-zinc-700 dark:bg-zinc-950"
                />

                <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
                  {filteredMembers.map((m) => {
                    const checked = selectedMemberIds.includes(m.id);
                    const fullName = `${m.firstName} ${m.lastName}`.trim();
                    return (
                      <label
                        key={m.id}
                        className={cn(
                          "flex cursor-pointer items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition-colors",
                          checked
                            ? "bg-indigo-50 font-semibold text-indigo-950 dark:bg-indigo-950/50 dark:text-indigo-200"
                            : "hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => {
                              setSelectedMemberIds((prev) =>
                                v
                                  ? [...prev, m.id]
                                  : prev.filter((id) => id !== m.id)
                              );
                            }}
                          />
                          <span>{fullName}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Стъпка 2: Параметри, Инвентар и 4 Режима на деня */}
              <div className="space-y-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4 lg:col-span-7 dark:border-zinc-800 dark:bg-zinc-900/50">
                <Label className="text-xs font-bold uppercase text-zinc-700 dark:text-zinc-200">
                  2. Време, Кортове, Инвентар и Режим на деня
                </Label>

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <div>
                    <Label className="text-[11px]">Загрявка (мин)</Label>
                    <Input
                      type="number"
                      min={5}
                      max={30}
                      value={warmupMinutes}
                      onChange={(e) =>
                        setWarmupMinutes(Number(e.target.value) || 15)
                      }
                      className="mt-1 h-8 rounded-xl text-xs dark:border-zinc-700 dark:bg-zinc-950"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Основна (мин)</Label>
                    <Input
                      type="number"
                      min={15}
                      max={120}
                      value={mainMinutes}
                      onChange={(e) =>
                        setMainMinutes(Number(e.target.value) || 60)
                      }
                      className="mt-1 h-8 rounded-xl text-xs dark:border-zinc-700 dark:bg-zinc-950"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Край (мин)</Label>
                    <Input
                      type="number"
                      min={5}
                      max={30}
                      value={cooldownMinutes}
                      onChange={(e) =>
                        setCooldownMinutes(Number(e.target.value) || 15)
                      }
                      className="mt-1 h-8 rounded-xl text-xs dark:border-zinc-700 dark:bg-zinc-950"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Кортове (от 6)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={6}
                      value={courtsCount}
                      onChange={(e) =>
                        setCourtsCount(
                          Math.max(1, Math.min(6, Number(e.target.value) || 5))
                        )
                      }
                      className="mt-1 h-8 rounded-xl text-xs dark:border-zinc-700 dark:bg-zinc-950"
                    />
                  </div>
                </div>

                {/* 4 Режима на деня с обяснение */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold">
                    Режим на деня
                  </Label>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                    {(Object.keys(DAY_MODE_META) as DayMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setDayMode(mode)}
                        className={cn(
                          "rounded-xl border px-2.5 py-2 text-left text-[11px] font-bold transition-all cursor-pointer",
                          dayMode === mode
                            ? "border-indigo-500 bg-indigo-600 text-white"
                            : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
                        )}
                      >
                        {DAY_MODE_META[mode].shortLabel}
                      </button>
                    ))}
                  </div>
                  <p className="flex items-start gap-1.5 rounded-xl bg-blue-50/70 p-2.5 text-[11px] leading-relaxed text-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
                    <Info className="mt-0.5 size-3.5 shrink-0" />
                    <span>{DAY_MODE_META[dayMode].whenToUse}</span>
                  </p>
                </div>

                {/* Режим на основната част + Инвентар + Shadow & Срещи */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-zinc-600 dark:text-zinc-400">
                    Структура:
                  </span>
                  <button
                    type="button"
                    onClick={() => setMainStructure("blocks")}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer",
                      mainStructure === "blocks"
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
                        : "bg-zinc-200/70 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    )}
                  >
                    Класически блокове
                  </button>
                  <button
                    type="button"
                    onClick={() => setMainStructure("stations")}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer",
                      mainStructure === "stations"
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
                        : "bg-zinc-200/70 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    )}
                  >
                    Станции с ротация
                  </button>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold">
                    Инвентар за днес (от модул Инвентар):
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {equipmentOptions.map((eq) => {
                      const active = selectedEquipment.includes(eq);
                      return (
                        <button
                          key={eq}
                          type="button"
                          onClick={() =>
                            setSelectedEquipment((prev) =>
                              active
                                ? prev.filter((x) => x !== eq)
                                : [...prev, eq]
                            )
                          }
                          className={cn(
                            "rounded-lg border px-2 py-1 text-[11px] font-semibold transition-all cursor-pointer",
                            active
                              ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                              : "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400"
                          )}
                        >
                          {eq}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                  <label className="flex cursor-pointer items-center gap-2 font-semibold">
                    <Checkbox
                      checked={includeShadow}
                      onCheckedChange={(v) => setIncludeShadow(Boolean(v))}
                    />
                    <Zap className="size-3.5 text-amber-500" />
                    Shadow ({shadowMinutes} мин)
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 font-semibold">
                    <Checkbox
                      checked={includeMatches}
                      onCheckedChange={(v) => setIncludeMatches(Boolean(v))}
                    />
                    <Trophy className="size-3.5 text-indigo-500" />
                    Финални срещи ({matchesMinutes} мин)
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-zinc-600 dark:text-zinc-400">
                    <Checkbox
                      checked={showWeeklyBalance}
                      onCheckedChange={(v) => setShowWeeklyBalance(Boolean(v))}
                    />
                    Покажи седмичен баланс
                  </label>
                </div>

                {includeMatches && (
                  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-indigo-200/70 bg-indigo-50/40 p-2.5 text-xs dark:border-indigo-900/50 dark:bg-indigo-950/20">
                    <label className="flex cursor-pointer items-center gap-1.5">
                      <Checkbox
                        checked={matchesCountForRanking}
                        onCheckedChange={(v) =>
                          setMatchesCountForRanking(Boolean(v))
                        }
                      />
                      Брой за официална ранглиста
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setMatchPairingMode("balanced")}
                        className={cn(
                          "rounded-lg px-2 py-0.5 text-[11px] font-semibold cursor-pointer",
                          matchPairingMode === "balanced"
                            ? "bg-indigo-600 text-white"
                            : "bg-white text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                        )}
                      >
                        Равностойни
                      </button>
                      <button
                        type="button"
                        onClick={() => setMatchPairingMode("handicap")}
                        className={cn(
                          "rounded-lg px-2 py-0.5 text-[11px] font-semibold cursor-pointer",
                          matchPairingMode === "handicap"
                            ? "bg-indigo-600 text-white"
                            : "bg-white text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                        )}
                      >
                        С хендикап
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    type="button"
                    onClick={() => handleGenerate(rotationOffset)}
                    className="rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700"
                  >
                    <Sparkles className="mr-1.5 size-4" />
                    {plan
                      ? "Преизчисли кортовете спрямо дошлите"
                      : "Генерирай интелигентен план"}
                  </Button>
                  {plan && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const next = rotationOffset + 1;
                        setRotationOffset(next);
                        handleGenerate(next);
                      }}
                      className="rounded-xl text-xs font-semibold dark:border-zinc-700"
                    >
                      <RefreshCw className="mr-1.5 size-3.5" />
                      Нови вариации
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Генериран План (Загрявка -> Кортове -> Shadow/Срещи -> Край) */}
            {plan && (
              <div className="space-y-4">
                {/* Опционален Седмичен баланс */}
                {showWeeklyBalance && plan.weeklyBalance && (
                  <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-3.5 text-xs dark:border-amber-900/50 dark:bg-amber-950/20">
                    <p className="font-bold text-amber-900 dark:text-amber-200">
                      Седмичен баланс (последните 14 дни —{" "}
                      {plan.weeklyBalance.totalSessionsAnalyzed} тренировки):
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {plan.weeklyBalance.distribution
                        .filter((d) => d.count > 0)
                        .slice(0, 5)
                        .map((d) => (
                          <Badge key={d.fundamentalId} variant="secondary">
                            {d.shortTitle}: {d.percent}%
                          </Badge>
                        ))}
                      {plan.weeklyBalance.neglected.length > 0 && (
                        <span className="text-amber-800 dark:text-amber-300">
                          • Пропуснати:{" "}
                          <strong>
                            {plan.weeklyBalance.neglected
                              .map((n) => n.shortTitle)
                              .join(", ")}
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Препоръка за нечетен брой / overflow */}
                <div className="flex flex-col gap-2 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900/50">
                  <p className="text-xs text-zinc-700 dark:text-zinc-300">
                    <strong>Разпределение:</strong>{" "}
                    {plan.overflowRecommendation.reason}
                  </p>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setOverflowMode("triples");
                        setShadowMinutes((x) => x);
                      }}
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-[11px] font-semibold cursor-pointer",
                        plan.overflowMode === "triples"
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
                          : "bg-white text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                      )}
                    >
                      Тройки (2v1)
                    </button>
                    <button
                      type="button"
                      onClick={() => setOverflowMode("off_court_station")}
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-[11px] font-semibold cursor-pointer",
                        plan.overflowMode === "off_court_station"
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
                          : "bg-white text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                      )}
                    >
                      Станция извън корта
                    </button>
                  </div>
                </div>

                {/* ЗАГРЯВКА */}
                <div className="space-y-2 rounded-2xl border border-emerald-200/80 bg-emerald-50/30 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/15">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
                      Част 1: Загрявка ({plan.warmupMinutes} мин.) — Обща за
                      групата
                    </h3>
                    <div className="flex gap-1 text-[11px]">
                      {(["both", "kids", "older"] as const).map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() =>
                            setPlan({ ...plan, selectedWarmupVariant: v })
                          }
                          className={cn(
                            "rounded-lg px-2 py-0.5 font-semibold cursor-pointer",
                            plan.selectedWarmupVariant === v
                              ? "bg-emerald-600 text-white"
                              : "bg-white text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
                          )}
                        >
                          {v === "both"
                            ? "И двата варианта"
                            : v === "kids"
                              ? "Избран: U9–U11 Игра"
                              : "Избран: U13+ Динамика"}
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
                        <p className="font-bold text-zinc-900 dark:text-white">
                          {ex.name}
                        </p>
                        <p className="mt-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                          {ex.dosageText || `${ex.durationMinutes} мин.`}
                        </p>
                      </div>
                    ))}
                  </div>
                  {(plan.warmupVariantKids || plan.warmupVariantOlder) && (
                    <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
                      {plan.warmupVariantKids && (
                        <div
                          className={cn(
                            "rounded-xl border p-2.5 text-xs",
                            plan.selectedWarmupVariant === "kids"
                              ? "border-emerald-500 bg-emerald-100/60 dark:bg-emerald-950/50"
                              : "border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-900/60"
                          )}
                        >
                          <p className="font-bold">
                            Вариант А (U9–U11): {plan.warmupVariantKids.name}
                          </p>
                          <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                            {plan.warmupVariantKids.dosageText}
                          </p>
                        </div>
                      )}
                      {plan.warmupVariantOlder && (
                        <div
                          className={cn(
                            "rounded-xl border p-2.5 text-xs",
                            plan.selectedWarmupVariant === "older"
                              ? "border-emerald-500 bg-emerald-100/60 dark:bg-emerald-950/50"
                              : "border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-900/60"
                          )}
                        >
                          <p className="font-bold">
                            Вариант Б (U13+): {plan.warmupVariantOlder.name}
                          </p>
                          <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                            {plan.warmupVariantOlder.dosageText}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ОСНОВНА ЧАСТ — КОРТОВЕ */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                    Част 2: Основна част ({plan.mainMinutes} мин.) —{" "}
                    {plan.mainStructure === "stations"
                      ? "Станции с ротация"
                      : "Класически блокове"}
                  </h3>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {plan.courts.map((court) => {
                      const chapter =
                        BWF_FUNDAMENTAL_BY_ID[court.fundamentalId];
                      return (
                        <div
                          key={court.id}
                          className="flex flex-col justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/60"
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <Badge className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950">
                                  {court.label}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="text-[10px]"
                                >
                                  {chapter.shortTitle}
                                </Badge>
                                {court.isCoachCourt && (
                                  <Badge className="bg-amber-500 text-zinc-950 hover:bg-amber-500 text-[10px]">
                                    <UserCheck className="mr-1 size-2.5" />
                                    Треньорски корт
                                  </Badge>
                                )}
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleSwapCourtExercise(court.id)
                                }
                                className="h-7 rounded-lg px-2 text-[11px] font-semibold"
                              >
                                <Shuffle className="mr-1 size-3" />
                                Друг вариант
                              </Button>
                            </div>

                            {/* Играчи на корта с опция за преместване */}
                            <div className="flex flex-wrap gap-1.5">
                              {court.players.map((p) => (
                                <div
                                  key={p.memberId}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold dark:border-zinc-700 dark:bg-zinc-800"
                                >
                                  <Users className="size-3 text-indigo-500" />
                                  <span>{p.name}</span>
                                  <span className="text-[10px] text-zinc-500">
                                    ({p.ageGroup})
                                  </span>
                                  {plan.courts.length > 1 && (
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
                                      className="ml-1 rounded bg-transparent text-[10px] text-indigo-600 dark:text-indigo-400"
                                    >
                                      {plan.courts.map((target) => (
                                        <option
                                          key={target.id}
                                          value={target.id}
                                        >
                                          → {target.label}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Диагностични сигнали */}
                            {court.diagnosticAlerts.length > 0 && (
                              <div className="space-y-1">
                                {court.diagnosticAlerts.map((al, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                                  >
                                    {al.kind === "retest_ready" ? (
                                      <Flame className="size-3.5 text-orange-500" />
                                    ) : (
                                      <AlertCircle className="size-3.5 text-amber-600" />
                                    )}
                                    <span>
                                      {al.memberName}:{" "}
                                      {al.kind === "missing_baseline"
                                        ? `Проведете входен тест „${al.testName}“`
                                        : al.testName}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Упражнение */}
                            <div className="rounded-xl border border-indigo-200/60 bg-indigo-50/30 p-3 dark:border-indigo-900/50 dark:bg-indigo-950/20">
                              <p className="text-xs font-bold text-zinc-950 dark:text-white">
                                {court.exercise.name}
                              </p>
                              <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                                {court.exercise.dosageText ||
                                  `${court.exercise.durationMinutes} мин.`}
                              </p>
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setMethodologyExercise(court.exercise)
                              }
                              className="h-7 rounded-lg text-[11px] font-semibold dark:border-zinc-700"
                            >
                              <BookOpen className="mr-1.5 size-3" />
                              Методика & Схема
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SHADOW & ФИНАЛНИ СРЕЩИ */}
                {(plan.shadowBlock || plan.matchesBlock) && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {plan.shadowBlock && (
                      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-3.5 text-xs dark:border-amber-900/50 dark:bg-amber-950/20">
                        <p className="font-bold text-amber-900 dark:text-amber-300">
                          ⚡ Shadow Training ({plan.shadowBlock.durationMinutes}{" "}
                          мин.)
                        </p>
                        <p className="mt-1 text-zinc-700 dark:text-zinc-300">
                          {plan.shadowBlock.reason}
                        </p>
                      </div>
                    )}
                    {plan.matchesBlock && (
                      <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/40 p-3.5 text-xs dark:border-indigo-900/50 dark:bg-indigo-950/20">
                        <p className="font-bold text-indigo-900 dark:text-indigo-300">
                          🏆 Финални срещи ({plan.matchesBlock.durationMinutes}{" "}
                          мин. •{" "}
                          {plan.matchesBlock.pairingMode === "handicap"
                            ? "С хендикап"
                            : "Равностойни"}
                          )
                        </p>
                        <div className="mt-1.5 space-y-1">
                          {(plan.matchesBlock.pairingMode === "handicap"
                            ? plan.matchesBlock.handicapPairings
                            : plan.matchesBlock.balancedPairings
                          ).map((pair, idx) => (
                            <p
                              key={idx}
                              className="text-[11px] text-zinc-700 dark:text-zinc-300"
                            >
                              {pair.playerA.name} vs {pair.playerB.name}
                              {pair.handicapSuggestion && (
                                <span className="ml-1 font-semibold text-indigo-700 dark:text-indigo-300">
                                  ({pair.handicapSuggestion})
                                </span>
                              )}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-zinc-200/80 bg-zinc-50/80 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs"
          >
            Затвори
          </Button>
          <Button
            type="button"
            disabled={!plan || isSaving}
            onClick={handleSaveAndLaunch}
            className="rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
          >
            {isSaving ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 size-4" />
            )}
            Запази и стартирай „Табло на кортовете“
          </Button>
        </div>

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
      </DialogContent>
    </Dialog>
  );
}
