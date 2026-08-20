/* eslint-disable sonarjs/cognitive-complexity, sonarjs/no-duplicated-branches */
"use client";

import {
  Activity,
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Clock,
  Heart,
  Info,
  Loader2,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getBWFIntervals, getSkillLevel } from "@/lib/planner-utils";
import { cn, getAgeGroup } from "@/lib/utils";
import { getAllMembers } from "@/services/member-service";
import { plannerService } from "@/services/planner-service";
import { getEventsForPeriod } from "@/services/schedule-service";
import { useAppStore } from "@/store/use-app-store";
import { Member, ScheduleEvent } from "@/types";
import {
  Exercise,
  LocationType,
  PlannerSession,
  TrainingMode,
} from "@/types/planner.types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveSuccess: () => void;
  initialCampId?: string;
  initialDate?: string;
}

const AGE_GROUPS = ["U9", "U11", "U13", "U15", "U17", "U19", "Мъже и Жени"];

export default function CreateSessionWizard({
  open,
  onOpenChange,
  onSaveSuccess,
  initialCampId,
  initialDate,
}: Props) {
  const { activeBranch } = useAppStore();

  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [mode, setMode] = useState<TrainingMode>("season");
  const [location, setLocation] = useState<LocationType>("indoor");
  const [ageGroup, setAgeGroup] = useState<string>("U13");
  const [addToSchedule, setAddToSchedule] = useState(false);
  const [creationMode, setCreationMode] = useState<"auto" | "manual">("auto");
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isHomeFriendlyOnly, setIsHomeFriendlyOnly] = useState(false);
  const [availableCourts, setAvailableCourts] = useState<number>(4);

  // Pedagogical State
  const [focus, setFocus] = useState<string>("Обща Подготовка");
  const [focusOptions, setFocusOptions] = useState<string[]>([
    "Обща Подготовка",
  ]);
  const [targetIntensity, setTargetIntensity] = useState<number>(3);
  const [period, setPeriod] = useState<
    "preparation" | "competition" | "transition"
  >("preparation");
  const [pedagogicalAction, setPedagogicalAction] = useState<
    "consolidation" | "progression" | "new"
  >("new");
  const [competitionWarning, setCompetitionWarning] = useState<string | null>(
    null
  );
  const [fallbackWarning, setFallbackWarning] = useState<boolean>(false);
  const [campFatigueWarning, setCampFatigueWarning] = useState<boolean>(false);
  const [campDayRecoveryWarning, setCampDayRecoveryWarning] =
    useState<boolean>(false);

  // RPE Dialog state
  const [showRpeDialog, setShowRpeDialog] = useState<boolean>(false);
  const [rpeData, setRpeData] = useState<
    Record<string, { rpe: number; effort: number }>
  >({});
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);

  // Health warnings from attendees
  const [healthWarnings, setHealthWarnings] = useState<
    { name: string; note: string }[]
  >([]);

  // Calendar Import State
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("none");
  const [eventDuration, setEventDuration] = useState<number>(90);
  const [attendees, setAttendees] = useState<
    {
      member: Member;
      ageGroup: string;
      skillLevel: string;
      isExcluded?: boolean;
    }[]
  >([]);

  // Generated Data
  const [groupedExercises, setGroupedExercises] = useState<
    { ageGroup: string; skillLevel: string; exercises: Exercise[] }[]
  >([]);

  useEffect(() => {
    if (open) {
      setStep(1);
      setTitle("");
      setDate(new Date().toISOString().slice(0, 10));
      setMode("season");
      setLocation("indoor");
      setAgeGroup("U13");
      setFocus("Обща Подготовка");
      setTargetIntensity(3);
      setPeriod("preparation");
      setPedagogicalAction("new");
      setAddToSchedule(false);
      setCreationMode("auto");
      setGroupedExercises([]);
      setIsHomeFriendlyOnly(false);

      if (initialCampId) {
        setMode("camp");
        setLocation("outdoor");
        setSelectedEventId(initialCampId);
      } else {
        setSelectedEventId("none");
        setMode("season");
      }

      if (initialDate) {
        setDate(initialDate);
      }

      setAttendees([]);
      setEventDuration(90);
      setCompetitionWarning(null);
      setFallbackWarning(false);

      // Load upcoming events
      const fetchEvents = async () => {
        try {
          // get current week
          const today = new Date();
          const p = new Date(today);
          p.setDate(p.getDate() + 90);
          const res = await getEventsForPeriod(today, p);

          if (initialCampId) {
            const { getCamps } = await import("@/services/schedule-service");
            const camps = await getCamps();
            const camp = camps.find((c) => c.id === initialCampId);
            if (camp && !res.some((e) => e.id === camp.id)) {
              res.unshift(camp as unknown as ScheduleEvent);
            }
            if (camp) {
              const allMembers = await getAllMembers();
              const evtMembers = allMembers.filter((m) =>
                camp.attendeeMemberIds.includes(m.id)
              );
              const mapped = evtMembers.map((m) => {
                let group = m.dateOfBirth ? getAgeGroup(m.dateOfBirth) : "U13";
                if (group === "Мъже/Жени") group = "Мъже и Жени";
                if (group === "Неопределена") group = "U13";
                const skill = getSkillLevel(m);
                return { member: m, ageGroup: group, skillLevel: skill };
              });
              setAttendees(mapped);
              setAgeGroup("Смесено (спрямо присъствия)");
            }
          }

          const upcomingComps = res.filter((e) => e.type === "competition");
          if (upcomingComps.length > 0) {
            setCompetitionWarning(
              `Внимание: В следващите 3 седмици има състезание (${upcomingComps[0].title}). Препоръчва се 'Състезателен' период с намалена физическа интензивност.`
            );
            setPeriod("competition");
          }

          setEvents(
            res.filter(
              (e) =>
                e.type === "training" ||
                e.type === "camp" ||
                e.type === "competition"
            )
          );

          const dbFocuses = await plannerService.getFocusTags(activeBranch);
          setFocusOptions(dbFocuses);

          const ex = await plannerService.getExercises(activeBranch);
          setAllExercises(ex);
        } catch (error) {
          console.error("Failed to load events", error);
        }
      };
      fetchEvents();
    }
  }, [open, activeBranch, initialCampId, initialDate]);

  const handleEventSelect = async (eventId: string) => {
    setSelectedEventId(eventId);
    if (eventId === "none") {
      setAttendees([]);
      setEventDuration(90);
      return;
    }

    const evt = events.find((e) => e.id === eventId);
    if (!evt) return;

    const start = new Date(evt.startDate).getTime();
    const end = new Date(evt.endDate).getTime();
    const durationMins = Math.round((end - start) / 60000);
    setEventDuration(durationMins > 0 ? durationMins : 90);
    setDate(evt.startDate.slice(0, 10));
    setMode(evt.type === "camp" ? "camp" : "season");
    setTitle(evt.title);

    setIsFetching(true);
    try {
      const allMembers = await getAllMembers();
      const evtMembers = allMembers.filter((m) =>
        evt.attendeeMemberIds.includes(m.id)
      );

      const mapped = evtMembers.map((m) => {
        let group = m.dateOfBirth ? getAgeGroup(m.dateOfBirth) : "U13";
        if (group === "Мъже/Жени") group = "Мъже и Жени";
        if (group === "Неопределена") group = "U13";
        const skill = getSkillLevel(m);
        return { member: m, ageGroup: group, skillLevel: skill };
      });
      setAttendees(mapped);
      setAgeGroup("Смесено (спрямо присъствия)");

      // Compute health warnings
      const warnings = mapped
        .filter(
          (a) =>
            a.member.healthConditionNotes &&
            a.member.healthConditionNotes.trim() !== ""
        )
        .map((a) => ({
          name: `${a.member.firstName} ${a.member.lastName}`,
          note: a.member.healthConditionNotes!,
        }));
      setHealthWarnings(warnings);
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setIsFetching(false);
    }
  };

  const updateAttendeeGroup = (
    memberId: string,
    newGroup: string,
    newSkill: string
  ) => {
    setAttendees((prev) =>
      prev.map((a) =>
        a.member.id === memberId
          ? { ...a, ageGroup: newGroup, skillLevel: newSkill }
          : a
      )
    );
  };

  const generatePlan = async () => {
    setIsFetching(true);
    setFallbackWarning(false);
    try {
      if (creationMode === "manual") {
        setGroupedExercises([
          { ageGroup, skillLevel: "Смесено", exercises: [] },
        ]);
        setStep(2);
        return;
      }

      let effectiveIntensity = targetIntensity;
      let isFatigued = false;
      setCampFatigueWarning(false);
      setCampDayRecoveryWarning(false);

      // --- RPE-based intensity adjustment ---
      // If the last 2 sessions had avg RPE > 8 for active attendees, reduce intensity
      if (attendees.length > 0) {
        try {
          const allSessions = await plannerService.getSessions(activeBranch);
          const recentTwo = allSessions.slice(0, 2);
          if (recentTwo.length > 0) {
            // We store calculatedIntensity, use it as a proxy for RPE heaviness
            const avgCalcIntensity =
              recentTwo.reduce(
                (s, sess) =>
                  s + (sess.calculatedIntensity ?? sess.targetIntensity ?? 3),
                0
              ) / recentTwo.length;
            if (avgCalcIntensity >= 4.5) {
              effectiveIntensity = Math.max(1, effectiveIntensity - 1);
            }
          }
        } catch (e) {
          console.error("Failed to check RPE-based intensity", e);
        }
      }

      if (mode === "camp" && selectedEventId !== "none") {
        try {
          const allSessions = await plannerService.getSessions(activeBranch);
          const campSessions = allSessions.filter(
            (s) => s.eventId === selectedEventId
          );

          const now = new Date();
          const fortyEightHoursAgo = new Date();
          fortyEightHoursAgo.setHours(now.getHours() - 48);

          const recentSessions = campSessions.filter((s) => {
            const sDate = new Date(s.date);
            return sDate >= fortyEightHoursAgo && sDate <= now;
          });

          if (recentSessions.length >= 3) {
            isFatigued = true;
            effectiveIntensity = Math.min(effectiveIntensity, 3);
            setCampFatigueWarning(true);
          }

          // --- Camp Day Awareness ---
          // Find the camp start date to compute day index
          const campEvt = events.find((e) => e.id === selectedEventId);
          if (campEvt) {
            const campStart = new Date(campEvt.startDate);
            campStart.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const campDayIndex =
              Math.floor(
                (today.getTime() - campStart.getTime()) / (1000 * 60 * 60 * 24)
              ) + 1; // day 1-based

            // Count sessions already done today
            const todayStr = today.toISOString().slice(0, 10);
            const todaySessions = campSessions.filter(
              (s) => s.date.slice(0, 10) === todayStr
            );

            if (campDayIndex >= 4 && todaySessions.length >= 2) {
              isFatigued = true;
              effectiveIntensity = Math.min(effectiveIntensity, 3);
              setCampDayRecoveryWarning(true);
            }
          }
        } catch (e) {
          console.error("Failed to check camp fatigue", e);
        }
      }

      const pastExerciseIds = new Set<string>();
      if (pedagogicalAction === "consolidation") {
        try {
          const allSessions = await plannerService.getSessions(activeBranch);
          const twoWeeksAgo = new Date();
          twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

          allSessions.forEach((s) => {
            const sDate = new Date(s.date);
            if (sDate >= twoWeeksAgo && sDate <= new Date()) {
              s.groupedExercises?.forEach((g) => {
                g.exercises?.forEach((ex) => pastExerciseIds.add(ex.id));
              });
            }
          });
        } catch (e) {
          console.error("Failed to fetch past sessions for consolidation", e);
        }
      }

      let targetCombinations: {
        ageGroup: string;
        skillLevel: string;
        clusterSize: number;
        isRehab?: boolean;
        injuries?: string[];
      }[] = [];

      if (ageGroup === "Смесено (спрямо присъствия)" && attendees.length > 0) {
        const activeAttendees = attendees.filter(
          (a) => !(a as Record<string, unknown>).isExcluded
        );
        const clusterMap = new Map<
          string,
          { count: number; isRehab: boolean; injuries: Set<string> }
        >();
        for (const a of activeAttendees) {
          const hasInjuries =
            Array.isArray(a.member?.injuries) && a.member.injuries.length > 0;
          const key = hasInjuries
            ? `${a.ageGroup}|${a.skillLevel}|REHAB`
            : `${a.ageGroup}|${a.skillLevel}`;

          if (!clusterMap.has(key)) {
            clusterMap.set(key, {
              count: 0,
              isRehab: hasInjuries,
              injuries: new Set(),
            });
          }

          const cluster = clusterMap.get(key)!;
          cluster.count += 1;
          if (hasInjuries) {
            a.member.injuries?.forEach((i: string) => cluster.injuries.add(i));
          }
        }
        for (const [key, data] of clusterMap.entries()) {
          const [ag, sk] = key.split("|");
          targetCombinations.push({
            ageGroup: ag,
            skillLevel: sk,
            clusterSize: data.count,
            isRehab: data.isRehab,
            injuries: data.isRehab ? Array.from(data.injuries) : [],
          });
        }
      } else if (attendees.length > 0) {
        const uniqueComboMap = new Map<
          string,
          {
            ageGroup: string;
            skillLevel: string;
            count: number;
            isRehab: boolean;
            injuries: Set<string>;
          }
        >();
        attendees.forEach((a) => {
          const hasInjuries =
            Array.isArray(a.member?.injuries) && a.member.injuries.length > 0;
          const key = hasInjuries
            ? `${a.ageGroup}-${a.skillLevel}-REHAB`
            : `${a.ageGroup}-${a.skillLevel}`;

          if (!uniqueComboMap.has(key)) {
            uniqueComboMap.set(key, {
              ageGroup: a.ageGroup,
              skillLevel: a.skillLevel,
              count: 1,
              isRehab: hasInjuries,
              injuries: new Set(),
            });
          } else {
            uniqueComboMap.get(key)!.count += 1;
          }
          if (hasInjuries) {
            a.member.injuries?.forEach((i: string) =>
              uniqueComboMap.get(key)!.injuries.add(i)
            );
          }
        });
        targetCombinations = Array.from(uniqueComboMap.values()).map((v) => ({
          ageGroup: v.ageGroup,
          skillLevel: v.skillLevel,
          clusterSize: v.count,
          isRehab: v.isRehab,
          injuries: v.isRehab ? Array.from(v.injuries) : [],
        }));
      } else {
        targetCombinations = [
          { ageGroup, skillLevel: "Начинаещи", clusterSize: 4 },
        ]; // Fallback
      }

      const newGrouped: {
        ageGroup: string;
        skillLevel: string;
        exercises: Exercise[];
      }[] = [];
      let missingExercises = false;

      // Methodological Time Distribution
      let warmupTime = Math.round(eventDuration * 0.15);
      let techTime = Math.round(eventDuration * 0.35);
      let tactTime = Math.round(eventDuration * 0.4);
      let cooldownTime = Math.round(eventDuration * 0.1);

      if (focus === "Обща Подготовка" || period === "preparation") {
        warmupTime = Math.round(eventDuration * 0.2);
        techTime = Math.round(eventDuration * 0.7); // Use tech phase to hold main physical exercises
        tactTime = 0;
        cooldownTime = Math.round(eventDuration * 0.1);
      }

      for (const group of targetCombinations) {
        let baseFiltered = allExercises.filter((ex) =>
          ex.ageGroups?.includes(group.ageGroup)
        );

        if (isHomeFriendlyOnly) {
          baseFiltered = baseFiltered.filter((ex) => ex.isHomeFriendly);
        } else {
          baseFiltered = baseFiltered.filter(
            (ex) =>
              ex.location?.includes(location) || ex.location?.includes("both")
          );
        }

        // Intensity filtering (±1 rule) with effective intensity
        baseFiltered = baseFiltered.filter((ex) => {
          if (!ex.intensity) return true; // allow if unset
          return Math.abs(ex.intensity - effectiveIntensity) <= 1;
        });

        // --- Complexity Level filter based on Skill Level ---
        const complexityMap: Record<string, number[]> = {
          Начинаещи: [1, 2, 3],
          Напреднали: [2, 3, 4],
          Експерти: [3, 4, 5],
          Професионалисти: [4, 5],
        };
        const allowedComplexity = complexityMap[group.skillLevel] ?? [
          1, 2, 3, 4, 5,
        ];
        baseFiltered = baseFiltered.filter((ex) => {
          if (!ex.complexityLevel) return true;
          return allowedComplexity.includes(ex.complexityLevel);
        });

        // Space/Court constraint for indoor exercises
        baseFiltered = baseFiltered.filter((ex) => {
          if (
            ex.location?.includes("indoor") ||
            ex.location?.includes("both")
          ) {
            if (ex.maxPlayers) {
              const capacity = ex.maxPlayers * availableCourts;
              if (capacity < group.clusterSize) {
                return false; // Cannot fit everyone!
              }
            }
          }
          return true;
        });

        // Rehab Safety Filters
        if (group.isRehab) {
          baseFiltered = baseFiltered.filter((ex) => {
            // Exclude intense tactical matches for injured players
            if (ex.category === "tactical" && ex.intensity && ex.intensity >= 4)
              return false;

            // Knee / Achilles / Ankle injuries
            if (
              group.injuries?.some((i) =>
                ["knee", "achilles", "ankle"].includes(i)
              )
            ) {
              if (
                ex.biomechanicsType === "squat" ||
                ex.biomechanicsType === "jump"
              )
                return false;
            }

            // Shoulder / Wrist injuries
            if (
              group.injuries?.some((i) => ["shoulder", "wrist"].includes(i))
            ) {
              if (
                ex.biomechanicsType === "pull" ||
                ex.targetKineticChain?.includes("shoulder") ||
                ex.targetKineticChain?.includes("shoulder-deceleration")
              )
                return false;
            }

            return true;
          });
        }

        // Fatigue Penalty filter
        if (isFatigued) {
          baseFiltered = baseFiltered.filter(
            (ex) => ex.biomechanicsType !== "jump"
          );
        }

        if (baseFiltered.length === 0) {
          baseFiltered = allExercises;
        }

        const selected: Exercise[] = [];
        const usedIds = new Set<string>();
        const usedKineticChains = new Set<string>();
        const usedBiomechanics = new Set<string>();

        // Helper to select exercises for a phase
        const selectForPhase = (
          timeLimit: number,
          targetPhase: string,
          useFocus: boolean = false
        ) => {
          let pool = baseFiltered.filter((ex) => !usedIds.has(ex.id));

          // Apply Focus filtering for main phases
          if (useFocus && focus) {
            const focusedPool = pool.filter(
              (ex) =>
                ex.focusTags?.includes(focus) ||
                (focus === "Обща Подготовка" && ex.focusTags?.includes("ОФП"))
            );
            if (focusedPool.length > 0) pool = focusedPool;
            else missingExercises = true; // Not enough focused exercises
          }

          // Apply Phase filter if present in DB, otherwise use Category approximations
          let phasePool = pool.filter((ex) => ex.phase === targetPhase);
          if (phasePool.length === 0) {
            // Fallback to category if phase is not set
            if (targetPhase === "warmup")
              phasePool = pool.filter(
                (ex) => ex.category === "warmup" || ex.category === "physical"
              );
            else if (targetPhase === "main-tech") {
              if (focus === "Обща Подготовка" || period === "preparation") {
                phasePool = pool.filter((ex) => ex.category === "physical");
              } else {
                phasePool = pool.filter((ex) => ex.category === "technical");
              }
            } else if (targetPhase === "main-tact")
              phasePool = pool.filter((ex) => ex.category === "tactical");
            else
              phasePool = pool.filter(
                (ex) => ex.category === "warmup" || ex.category === "physical"
              );
          }

          if (phasePool.length === 0) {
            phasePool = pool; // Ultimate fallback
            missingExercises = true;
          }

          // Shuffle
          let shuffled = [...phasePool].sort(() => 0.5 - Math.random());

          if (
            pedagogicalAction === "consolidation" &&
            pastExerciseIds.size > 0
          ) {
            shuffled = [
              ...shuffled.filter((ex) => pastExerciseIds.has(ex.id)),
              ...shuffled.filter((ex) => !pastExerciseIds.has(ex.id)),
            ];
          }

          // If Rehab, prioritize prevention focus
          if (group.isRehab && group.injuries && group.injuries.length > 0) {
            shuffled.sort((a, b) => {
              const aMatch = group.injuries!.includes(
                a.injuryPreventionFocus || ""
              )
                ? 1
                : 0;
              const bMatch = group.injuries!.includes(
                b.injuryPreventionFocus || ""
              )
                ? 1
                : 0;
              return bMatch - aMatch;
            });
          }

          let currentDur = 0;

          let consecutiveMisses = 0;

          while (currentDur < timeLimit - 5 && shuffled.length > 0) {
            // Find best next exercise (Load Balancing)
            let bestIdx = 0;
            if (consecutiveMisses < 3) {
              // Try to find one that doesn't overlap with recent kinetic chains or biomechanics
              const idx = shuffled.findIndex((ex) => {
                const hasChainOverlap = ex.targetKineticChain?.some((c) =>
                  usedKineticChains.has(c)
                );
                const hasBioOverlap =
                  ex.biomechanicsType &&
                  usedBiomechanics.has(ex.biomechanicsType);
                return !hasChainOverlap && !hasBioOverlap;
              });
              if (idx !== -1) bestIdx = idx;
            }

            const ex = shuffled.splice(bestIdx, 1)[0];

            if (currentDur + ex.durationMinutes <= timeLimit + 10) {
              // allow slightly over
              if (targetPhase.includes("main")) {
                const bwf = getBWFIntervals(group.ageGroup);
                ex.defaultSets = bwf.sets;
                ex.defaultWorkSec = bwf.workSec;
                ex.defaultRestSec = bwf.restSec;
              }
              selected.push(ex);
              usedIds.add(ex.id);
              currentDur += ex.durationMinutes;

              // Update used chains (keep history short by clearing sometimes, or just tracking last 1-2)
              usedKineticChains.clear();
              ex.targetKineticChain?.forEach((c) => usedKineticChains.add(c));

              usedBiomechanics.clear();
              if (ex.biomechanicsType)
                usedBiomechanics.add(ex.biomechanicsType);

              consecutiveMisses = 0;
            } else {
              consecutiveMisses++;
            }
          }
        };

        selectForPhase(warmupTime, "warmup");
        selectForPhase(techTime, "main-tech", true);
        selectForPhase(tactTime, "main-tact", true);
        selectForPhase(cooldownTime, "cooldown");

        newGrouped.push({
          ageGroup: group.ageGroup,
          skillLevel: group.skillLevel,
          exercises: selected,
        });
      }

      if (missingExercises) setFallbackWarning(true);
      setGroupedExercises(newGrouped);
      setStep(2);
    } catch (error) {
      console.error(error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const targetGroupsStrings = Array.from(
        new Set(groupedExercises.map((g) => g.ageGroup))
      );
      const structuredTargetGroups = groupedExercises.map((g) => ({
        ageGroup: g.ageGroup,
        skillLevel: g.skillLevel,
      }));

      // Calculate average intensity
      let totalInt = 0;
      let count = 0;
      groupedExercises.forEach((g) => {
        g.exercises.forEach((ex) => {
          if (ex.intensity) {
            totalInt += ex.intensity;
            count++;
          }
        });
      });
      const avgIntensity =
        count > 0 ? Math.round(totalInt / count) : targetIntensity;

      const payload: Omit<
        PlannerSession,
        "id" | "siteId" | "createdAt" | "updatedAt"
      > = {
        title: title || `Тренировка ${targetGroupsStrings.join(", ")}`,
        date,
        mode,
        location,
        targetGroups: targetGroupsStrings,
        structuredTargetGroups,
        groupedExercises,
        focus,
        period,
        pedagogicalAction,
        targetIntensity,
        calculatedIntensity: avgIntensity,
        status: "planned",
      };

      const sessionId = await plannerService.addSession(activeBranch, payload);

      // If there are attendees, open the RPE Dialog before closing
      if (
        attendees.filter((a) => !(a as Record<string, unknown>).isExcluded)
          .length > 0
      ) {
        setSavedSessionId(sessionId);
        // Initialize RPE data with defaults
        const defaultRpe: Record<string, { rpe: number; effort: number }> = {};
        attendees
          .filter((a) => !(a as Record<string, unknown>).isExcluded)
          .forEach((a) => {
            defaultRpe[a.member.id] = { rpe: 5, effort: 3 };
          });
        setRpeData(defaultRpe);
        setShowRpeDialog(true);
      } else {
        onSaveSuccess();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRpeSave = async () => {
    if (!savedSessionId) {
      onSaveSuccess();
      return;
    }
    try {
      const activeAttendees = attendees.filter(
        (a) => !(a as Record<string, unknown>).isExcluded
      );
      const attendanceData = activeAttendees.map((a) => ({
        memberId: a.member.id,
        date,
        rpe: rpeData[a.member.id]?.rpe ?? 5,
        effort: rpeData[a.member.id]?.effort ?? 3,
        medicalStatus: "healthy" as const,
      }));
      await plannerService.saveAttendanceBatch(
        activeBranch,
        savedSessionId,
        attendanceData
      );
    } catch (err) {
      console.error("Failed to save attendance RPE:", err);
    } finally {
      setShowRpeDialog(false);
      onSaveSuccess();
    }
  };

  const uniqueEquipment = Array.from(
    new Set(
      groupedExercises
        .flatMap((g) => g.exercises)
        .map((ex) => ex.equipment)
        .filter((e) => e && e.trim() !== "Няма" && e.trim() !== "Няма.")
    )
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CalendarRange className="size-5 text-indigo-600" />
              Универсален Планировчик
            </DialogTitle>
            <DialogDescription>
              Методологичен съветник за генериране на тренировъчни сесии.
            </DialogDescription>
          </DialogHeader>

          {step === 1 && (
            <div className="space-y-6 py-4 duration-300 animate-in fade-in slide-in-from-right-4">
              {competitionWarning && (
                <Alert className="border-amber-200 bg-amber-50 text-amber-800">
                  <AlertTriangle className="size-4" />
                  <AlertTitle>Периодизация</AlertTitle>
                  <AlertDescription className="text-xs">
                    {competitionWarning}
                  </AlertDescription>
                </Alert>
              )}

              {/* Health Warnings */}
              {healthWarnings.length > 0 && (
                <Alert className="border-red-200 bg-red-50 text-red-800">
                  <Heart className="size-4 text-red-600" />
                  <AlertTitle className="flex items-center gap-1">
                    ⚤️ Медицински Бележки
                  </AlertTitle>
                  <AlertDescription className="mt-1 space-y-1 text-xs">
                    {healthWarnings.map((w, i) => (
                      <div key={i} className="rounded bg-red-100 px-2 py-1">
                        <span className="font-bold">{w.name}:</span> {w.note}
                      </div>
                    ))}
                  </AlertDescription>
                </Alert>
              )}

              {campFatigueWarning && (
                <Alert className="border-orange-200 bg-orange-50 text-orange-800">
                  <Activity className="size-4" />
                  <AlertTitle>Умора от Лагер (48ч)</AlertTitle>
                  <AlertDescription className="text-xs">
                    Има ≥ 3 сесии в последните 48ч. Интензивността е ограничена
                    до 3.
                  </AlertDescription>
                </Alert>
              )}

              {campDayRecoveryWarning && (
                <Alert className="border-purple-200 bg-purple-50 text-purple-800">
                  <Activity className="size-4" />
                  <AlertTitle>
                    Лагер: Ден ≥ 4, Сесия ≥ 3 — Режим Възстановяване
                  </AlertTitle>
                  <AlertDescription className="text-xs">
                    Автоматично наложен Recovery режим: макс интензивност 3, без
                    плиометрични упражнения.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  variant={creationMode === "auto" ? "default" : "outline"}
                  className={cn(
                    "flex-1",
                    creationMode === "auto" && "bg-indigo-600"
                  )}
                  onClick={() => setCreationMode("auto")}
                >
                  Автоматично (Съветник)
                </Button>
                <Button
                  variant={creationMode === "manual" ? "default" : "outline"}
                  className={cn(
                    "flex-1",
                    creationMode === "manual" && "bg-indigo-600"
                  )}
                  onClick={() => setCreationMode("manual")}
                >
                  Ръчно планиране
                </Button>
              </div>

              {creationMode === "auto" && (
                <div className="space-y-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-indigo-900">
                      Импорт от График
                    </Label>
                    <Select
                      value={selectedEventId}
                      onValueChange={handleEventSelect}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Изберете предстоящо събитие..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          Без импорт (ръчно планиране)
                        </SelectItem>
                        {events
                          .filter((e) =>
                            mode === "camp"
                              ? e.type === "camp"
                              : e.type === "training" || e.type === "camp"
                          )
                          .map((e) => (
                            <SelectItem key={e.id} value={e.id}>
                              {new Date(e.startDate).toLocaleDateString(
                                "bg-BG"
                              )}{" "}
                              - {e.title}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {attendees.length > 0 && (
                    <div className="space-y-3 rounded-xl border border-indigo-100 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-zinc-900">
                          Смесени Групи ({attendees.length} участници)
                        </h4>
                        <span className="flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-600">
                          <Clock size={12} className="mr-1" /> {eventDuration}{" "}
                          мин
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500">
                        Системата автоматично разделя децата по възраст и ниво
                        на умения (Skill Level).
                      </p>
                      <div className="max-h-48 space-y-2 overflow-y-auto pr-2">
                        {attendees.map((a) => (
                          <div
                            key={a.member.id}
                            className="flex flex-col justify-between gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2 transition-colors hover:bg-zinc-100 sm:flex-row sm:items-center"
                          >
                            <span className="text-sm font-medium text-zinc-700">
                              {a.member.firstName} {a.member.lastName}
                            </span>
                            <div className="flex gap-2">
                              <Select
                                value={a.ageGroup}
                                onValueChange={(val) =>
                                  updateAttendeeGroup(
                                    a.member.id,
                                    val,
                                    a.skillLevel
                                  )
                                }
                              >
                                <SelectTrigger className="h-8 w-24 bg-white text-xs font-bold">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {AGE_GROUPS.map((ag) => (
                                    <SelectItem key={ag} value={ag}>
                                      {ag}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select
                                value={a.skillLevel}
                                onValueChange={(val) =>
                                  updateAttendeeGroup(
                                    a.member.id,
                                    a.ageGroup,
                                    val
                                  )
                                }
                              >
                                <SelectTrigger className="h-8 w-28 bg-white text-xs font-bold">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Начинаещи">
                                    Начинаещи
                                  </SelectItem>
                                  <SelectItem value="Напреднали">
                                    Напреднали
                                  </SelectItem>
                                  <SelectItem value="Експерти">
                                    Експерти
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Methodological Settings */}
              {creationMode === "auto" && (
                <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
                  <div
                    className="flex cursor-pointer items-center justify-between font-bold text-zinc-900 transition-colors hover:text-indigo-600"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    <div className="flex items-center gap-2">
                      <Info className="size-4 text-zinc-400" />
                      Разширени Методически Настройки
                    </div>
                    <ChevronRight
                      className={cn(
                        "size-4 text-zinc-400 transition-transform",
                        showAdvanced && "rotate-90"
                      )}
                    />
                  </div>
                  {showAdvanced && (
                    <div className="mt-4 space-y-4 border-t border-zinc-100 pt-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Налични Кортове</Label>
                          <Select
                            value={availableCourts.toString()}
                            onValueChange={(val) =>
                              setAvailableCourts(parseInt(val))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 Корт</SelectItem>
                              <SelectItem value="2">2 Корта</SelectItem>
                              <SelectItem value="3">3 Корта</SelectItem>
                              <SelectItem value="4">4 Корта</SelectItem>
                              <SelectItem value="5">5+ Корта</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Тема / Фокус</Label>
                          <Select value={focus} onValueChange={setFocus}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-75 overflow-y-auto">
                              {focusOptions.map((f) => (
                                <SelectItem key={f} value={f}>
                                  {f}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Периодизация</Label>
                          <Select
                            value={period}
                            onValueChange={(v) =>
                              setPeriod(
                                v as
                                  "preparation" | "competition" | "transition"
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="preparation">
                                Подготвителен (ОФП)
                              </SelectItem>
                              <SelectItem value="competition">
                                Състезателен (Tapering)
                              </SelectItem>
                              <SelectItem value="transition">
                                Преходен (Възстановяване)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-4 pt-2">
                        <div className="mb-2 flex items-center justify-between">
                          <Label>Целева Интензивност (1-5)</Label>
                          <span className="rounded bg-indigo-50 px-2 font-black text-indigo-600">
                            {targetIntensity}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                          {[
                            { val: 1, label: "Много лесна" },
                            { val: 2, label: "Лесна" },
                            { val: 3, label: "Средна" },
                            { val: 4, label: "Трудна" },
                            { val: 5, label: "Много трудна" },
                          ].map((lvl) => (
                            <div
                              key={lvl.val}
                              onClick={() => setTargetIntensity(lvl.val)}
                              className={cn(
                                "flex min-h-15 cursor-pointer flex-col items-center justify-center rounded-xl border p-2 text-center transition-all",
                                targetIntensity === lvl.val
                                  ? "border-indigo-600 bg-indigo-600 text-white shadow-md"
                                  : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100"
                              )}
                            >
                              <span className="mb-0.5 text-xs font-bold">
                                {lvl.val}
                              </span>
                              <span className="text-[10px] leading-tight opacity-90">
                                {lvl.label}
                              </span>
                            </div>
                          ))}
                        </div>
                        <p className="mt-2 text-[10px] text-zinc-500">
                          Системата ще избере упражнения, които отговарят на
                          тази интензивност.
                        </p>
                      </div>

                      {attendees.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <Label>
                            Педагогическо Действие (Спрямо минали тренировки)
                          </Label>
                          <div className="flex gap-2">
                            <Button
                              variant={
                                pedagogicalAction === "consolidation"
                                  ? "default"
                                  : "outline"
                              }
                              className={cn(
                                "h-8 flex-1 text-xs",
                                pedagogicalAction === "consolidation" &&
                                  "bg-indigo-600"
                              )}
                              onClick={() =>
                                setPedagogicalAction("consolidation")
                              }
                            >
                              Затвърждаване
                            </Button>
                            <Button
                              variant={
                                pedagogicalAction === "progression"
                                  ? "default"
                                  : "outline"
                              }
                              className={cn(
                                "h-8 flex-1 text-xs",
                                pedagogicalAction === "progression" &&
                                  "bg-indigo-600"
                              )}
                              onClick={() =>
                                setPedagogicalAction("progression")
                              }
                            >
                              Надграждане
                            </Button>
                            <Button
                              variant={
                                pedagogicalAction === "new"
                                  ? "default"
                                  : "outline"
                              }
                              className={cn(
                                "h-8 flex-1 text-xs",
                                pedagogicalAction === "new" && "bg-indigo-600"
                              )}
                              onClick={() => setPedagogicalAction("new")}
                            >
                              Нова Тема
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                          id="home-friendly"
                          checked={isHomeFriendlyOnly}
                          onCheckedChange={(val) =>
                            setIsHomeFriendlyOnly(!!val)
                          }
                        />
                        <Label
                          htmlFor="home-friendly"
                          className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Генерирай само за домашни условия (Без зала)
                        </Label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(selectedEventId === "none" || creationMode === "manual") && (
                <div className="grid grid-cols-1 gap-4 rounded-xl border border-zinc-200 p-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Възрастова група</Label>
                    <Select
                      value={ageGroup}
                      onValueChange={(val) => setAgeGroup(val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AGE_GROUPS.map((ag) => (
                          <SelectItem key={ag} value={ag}>
                            {ag}
                          </SelectItem>
                        ))}
                        <SelectItem value="Смесено (спрямо присъствия)">
                          Смесено (спрямо присъствия)
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {ageGroup === "Смесено (спрямо присъствия)" &&
                      attendees.length > 0 && (
                        <div className="mt-3 max-h-40 overflow-y-auto rounded-md border border-indigo-100 bg-indigo-50/50 p-3">
                          <Label className="mb-2 block text-[10px] font-bold text-indigo-800 uppercase">
                            Присъстващи участници:
                          </Label>
                          <div className="space-y-1">
                            {attendees.map((a) => {
                              const isExcluded = (a as Record<string, unknown>)
                                .isExcluded;
                              return (
                                <label
                                  key={a.member.id}
                                  className="flex cursor-pointer items-center gap-2 rounded p-1 text-sm transition-colors hover:bg-indigo-50"
                                >
                                  <Checkbox
                                    checked={!isExcluded}
                                    onCheckedChange={(c) => {
                                      setAttendees((prev) =>
                                        prev.map((pa) =>
                                          pa.member.id === a.member.id
                                            ? { ...pa, isExcluded: !c }
                                            : pa
                                        )
                                      );
                                    }}
                                  />
                                  <span
                                    className={cn(
                                      Boolean(isExcluded) &&
                                        "text-zinc-400 line-through"
                                    )}
                                  >
                                    {a.member.firstName} {a.member.lastName}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                  </div>
                  <div className="space-y-2">
                    <Label>Продължителност (мин)</Label>
                    <Input
                      type="number"
                      value={eventDuration || ""}
                      onChange={(e) =>
                        setEventDuration(
                          e.target.value === "" ? 0 : Number(e.target.value)
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Режим</Label>
                    <Select
                      value={mode}
                      onValueChange={(v) => setMode(v as TrainingMode)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="season">Целогодишна</SelectItem>
                        <SelectItem value="camp">Интензивен Лагер</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Локация</Label>
                    <Select
                      value={location}
                      onValueChange={(v) => setLocation(v as LocationType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="indoor">В зала</SelectItem>
                        <SelectItem value="outdoor">На открито</SelectItem>
                        <SelectItem value="both">Зала + Открито</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <DialogFooter className="border-t pt-4">
                <Button
                  onClick={generatePlan}
                  disabled={isFetching}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 sm:w-auto"
                >
                  {isFetching ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <ChevronRight className="mr-2 size-4" />
                  )}
                  {creationMode === "manual"
                    ? "Продължи"
                    : "Генерирай Тренировка"}
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 py-4 duration-300 animate-in fade-in slide-in-from-right-4">
              {campFatigueWarning && (
                <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800">
                  <AlertTriangle className="size-4" />
                  <AlertTitle>Засечена е натрупана умора!</AlertTitle>
                  <AlertDescription className="text-xs">
                    Проведени са над 3 тренировки в последните 48 часа.
                    Алгоритъмът автоматично ограничи интензивността до Ниво 3 и
                    изключи плиометричните упражнения.
                  </AlertDescription>
                </Alert>
              )}

              {fallbackWarning && (
                <Alert className="border-red-200 bg-red-50 text-red-800">
                  <AlertTriangle className="size-4" />
                  <AlertTitle>Липсващи упражнения!</AlertTitle>
                  <AlertDescription className="text-xs">
                    В базата данни няма достатъчно упражнения за избрания фокус
                    ({focus}) и фаза. Системата автоматично допълни тренировката
                    с общи упражнения.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Име на сесията</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Име на тренировката"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Дата на тренировката</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-bold text-zinc-900">
                  <CheckCircle2 className="size-5 text-indigo-600" />
                  Генериран План ({eventDuration} мин)
                </h3>

                {groupedExercises.length === 0 ? (
                  <p className="text-sm text-zinc-500">
                    Няма генерирани упражнения.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {groupedExercises.map((group, gIdx) => (
                      <div key={gIdx} className="space-y-3">
                        <h4 className="inline-block rounded-md bg-indigo-100 px-3 py-1 text-sm font-black text-indigo-900">
                          Група: {group.ageGroup} | {group.skillLevel}
                        </h4>
                        {group.exercises.length === 0 ? (
                          <p className="text-sm text-zinc-500 italic">
                            Няма подходящи упражнения.
                          </p>
                        ) : (
                          group.exercises.map((ex, idx) => (
                            <details
                              key={ex.id + idx}
                              className="group relative flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white p-3 shadow-sm"
                            >
                              <summary className="flex cursor-pointer list-none gap-3 outline-none [&::-webkit-details-marker]:hidden">
                                <div className="absolute inset-y-0 left-0 w-1 bg-indigo-500"></div>
                                <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 font-black text-indigo-700">
                                  {idx + 1}
                                </div>
                                <div className="relative flex-1 pr-6">
                                  <div className="pr-8 text-sm font-bold text-zinc-900">
                                    {ex.name}
                                  </div>
                                  <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-zinc-500">
                                    <span>{ex.durationMinutes} мин</span>
                                    <span>• {ex.category.toUpperCase()}</span>
                                    {ex.defaultSets && (
                                      <span className="font-medium text-indigo-600">
                                        • {ex.defaultSets} серии x{" "}
                                        {ex.defaultWorkSec}с /
                                        {ex.defaultRestSec}с почивка
                                      </span>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-1/2 right-6 size-6 -translate-y-1/2 text-zinc-400 hover:text-red-500"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      const newGroups = [...groupedExercises];
                                      newGroups[gIdx].exercises = newGroups[
                                        gIdx
                                      ].exercises.filter(
                                        (_, idx2) => idx2 !== idx
                                      );
                                      setGroupedExercises(newGroups);
                                    }}
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                  <ChevronRight className="absolute top-1/2 right-0 size-4 -translate-y-1/2 text-zinc-400 transition-transform group-open:rotate-90" />
                                </div>
                              </summary>
                              <div className="mt-4 space-y-2 border-t border-zinc-100 pt-3 pl-11 text-sm text-zinc-600">
                                {ex.description && (
                                  <p>
                                    <strong>Описание:</strong> {ex.description}
                                  </p>
                                )}
                                {ex.coachingPoints &&
                                  ex.coachingPoints.length > 0 && (
                                    <div>
                                      <strong className="mb-1 block">
                                        Ключови точки:
                                      </strong>
                                      <ul className="list-disc space-y-1 pl-4">
                                        {ex.coachingPoints.map(
                                          (cp: string, i: number) => (
                                            <li key={i}>{cp}</li>
                                          )
                                        )}
                                      </ul>
                                    </div>
                                  )}
                                {ex.focusTags && ex.focusTags.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {ex.focusTags.map(
                                      (tag: string, i: number) => (
                                        <span
                                          key={i}
                                          className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500"
                                        >
                                          {tag}
                                        </span>
                                      )
                                    )}
                                  </div>
                                )}
                              </div>
                            </details>
                          ))
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {creationMode === "manual" && groupedExercises.length > 0 && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="font-bold text-indigo-900">
                      Добавяне на упражнения (Ръчен режим)
                    </h4>
                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
                      {allExercises.length} налични
                    </span>
                  </div>
                  <div className="h-100 overflow-y-auto rounded-xl border border-indigo-100 bg-white p-4 shadow-inner">
                    {Object.entries(
                      allExercises.reduce(
                        (acc, ex) => {
                          const cat = ex.category || "other";
                          if (!acc[cat]) acc[cat] = [];
                          acc[cat].push(ex);
                          return acc;
                        },
                        {} as Record<string, typeof allExercises>
                      )
                    ).map(([category, exercises]) => (
                      <div key={category} className="mb-6 last:mb-0">
                        <div className="mb-3 flex items-center gap-2">
                          <div className="h-4 w-1 rounded-full bg-indigo-500"></div>
                          <h5 className="text-xs font-black tracking-wider text-indigo-800 uppercase">
                            {category === "mental" && "Ментачни"}
                            {category === "physical" && "Физически"}
                            {category === "technical" && "Технически"}
                            {category === "tactical" && "Тактически"}
                            {category === "mixed" && "Смесени"}
                            {category === "other" && "Други"}
                            {category !== "mental" &&
                              category !== "physical" &&
                              category !== "technical" &&
                              category !== "tactical" &&
                              category !== "mixed" &&
                              category !== "other" &&
                              category}
                          </h5>
                          <span className="text-[10px] font-bold text-zinc-400">
                            ({exercises.length})
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {exercises.map((ex) => {
                            const isSelected =
                              groupedExercises[0]?.exercises.some(
                                (e) => e.id === ex.id
                              );
                            return (
                              <label
                                key={ex.id}
                                htmlFor={`manual-ex-${ex.id}`}
                                className={cn(
                                  "relative flex cursor-pointer flex-col justify-between rounded-xl border p-3 transition-all hover:shadow-md",
                                  isSelected
                                    ? "border-indigo-600 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-600"
                                    : "border-zinc-200 bg-white hover:border-indigo-300"
                                )}
                              >
                                <div className="flex items-start gap-3">
                                  <Checkbox
                                    id={`manual-ex-${ex.id}`}
                                    checked={isSelected}
                                    onCheckedChange={(c) => {
                                      const newGroups = [...groupedExercises];
                                      if (newGroups.length === 0) {
                                        // If no group exists, create a default one
                                        newGroups.push({
                                          ageGroup: ageGroup,
                                          skillLevel: "Смесено",
                                          exercises: [],
                                        });
                                      }
                                      if (c) {
                                        newGroups[0].exercises.push({
                                          ...ex,
                                          durationMinutes: 10,
                                        });
                                      } else {
                                        newGroups[0].exercises =
                                          newGroups[0].exercises.filter(
                                            (e) => e.id !== ex.id
                                          );
                                      }
                                      setGroupedExercises(newGroups);
                                    }}
                                    className="mt-0.5"
                                  />
                                  <div className="flex-1 space-y-1">
                                    <div className="text-sm leading-tight font-bold text-zinc-900">
                                      {ex.name}
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {ex.durationMinutes && (
                                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-bold text-zinc-500">
                                          {ex.durationMinutes} мин
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uniqueEquipment.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <h4 className="mb-2 text-sm font-bold text-amber-900">
                    Чеклист Екипировка
                  </h4>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-amber-800">
                    {uniqueEquipment.map((eq, i) => (
                      <li key={i}>{eq}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="schedule"
                  checked={addToSchedule}
                  onCheckedChange={(c) => setAddToSchedule(c as boolean)}
                />
                <label
                  htmlFor="schedule"
                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Покажи в публичния График на клуба
                </label>
              </div>

              <DialogFooter className="flex w-full justify-between border-t pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Назад
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || groupedExercises.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Запази Тренировката
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* RPE Input Dialog */}
      <Dialog
        open={showRpeDialog}
        onOpenChange={(o) => {
          if (!o) {
            setShowRpeDialog(false);
            onSaveSuccess();
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="size-5 text-indigo-600" />
              Оценка на натоварването (RPE)
            </DialogTitle>
            <DialogDescription>
              Въведете оценка на натоварването (1–10) и усилието (1–5) за всеки
              участник. Това помага на алгоритъма да адаптира следващата
              тренировка.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* RPE Labels */}
            <div className="grid grid-cols-5 gap-1 text-center text-[9px] text-zinc-500">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
                let colorClass = "bg-red-100 text-red-700";
                if (n <= 3) colorClass = "bg-green-100 text-green-700";
                else if (n <= 6) colorClass = "bg-yellow-100 text-yellow-700";
                else if (n <= 8) colorClass = "bg-orange-100 text-orange-700";

                return (
                  <span
                    key={n}
                    className={cn("rounded px-1 py-0.5 font-bold", colorClass)}
                  >
                    {n}
                  </span>
                );
              })}
            </div>

            {attendees
              .filter((a) => !(a as Record<string, unknown>).isExcluded)
              .map((a) => {
                const d = rpeData[a.member.id] ?? { rpe: 5, effort: 3 };
                return (
                  <div
                    key={a.member.id}
                    className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-zinc-900">
                        {a.member.firstName} {a.member.lastName}
                      </span>
                      {a.member.injuries && a.member.injuries.length > 0 && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700">
                          ⚤️ {a.member.injuries.join(", ")}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">
                          Натоварване (RPE):{" "}
                          <span
                            className={cn(
                              "font-black",
                              (() => {
                                if (d.rpe <= 3) return "text-green-600";
                                if (d.rpe <= 6) return "text-yellow-600";
                                if (d.rpe <= 8) return "text-orange-600";
                                return "text-red-600";
                              })()
                            )}
                          >
                            {d.rpe}/10
                          </span>
                        </Label>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          step={1}
                          value={d.rpe}
                          onChange={(e) =>
                            setRpeData((prev) => ({
                              ...prev,
                              [a.member.id]: {
                                ...d,
                                rpe: Number(e.target.value),
                              },
                            }))
                          }
                          className="w-full accent-indigo-600"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">
                          Усилие:{" "}
                          <span className="font-black text-indigo-600">
                            {d.effort}/5
                          </span>
                        </Label>
                        <input
                          type="range"
                          min={1}
                          max={5}
                          step={1}
                          value={d.effort}
                          onChange={(e) =>
                            setRpeData((prev) => ({
                              ...prev,
                              [a.member.id]: {
                                ...d,
                                effort: Number(e.target.value),
                              },
                            }))
                          }
                          className="w-full accent-indigo-600"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          <DialogFooter className="gap-2 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowRpeDialog(false);
                onSaveSuccess();
              }}
            >
              Пропусни
            </Button>
            <Button
              onClick={handleRpeSave}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <CheckCircle2 className="mr-2 size-4" />
              Запази Оценките
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
