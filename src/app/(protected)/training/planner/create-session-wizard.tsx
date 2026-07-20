/* eslint-disable sonarjs/cognitive-complexity, sonarjs/no-duplicated-branches */
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Exercise,
  TrainingMode,
  LocationType,
  PlannerSession,
} from "@/types/planner.types";
import { plannerService } from "@/services/planner-service";
import { useAppStore } from "@/store/use-app-store";
import { getEventsForPeriod } from "@/services/schedule-service";
import { getAllMembers } from "@/services/member-service";
import { ScheduleEvent, Member } from "@/types";
import { getAgeGroup } from "@/lib/utils";
import { getSkillLevel, getBWFIntervals } from "@/lib/planner-utils";
import {
  Loader2,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Clock,
  AlertTriangle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveSuccess: () => void;
}

const AGE_GROUPS = ["U9", "U11", "U13", "U15", "U17", "U19", "Мъже и Жени"];

export default function CreateSessionWizard({
  open,
  onOpenChange,
  onSaveSuccess,
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

  // Calendar Import State
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("none");
  const [eventDuration, setEventDuration] = useState<number>(90);
  const [attendees, setAttendees] = useState<
    { member: Member; ageGroup: string; skillLevel: string }[]
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
      setGroupedExercises([]);
      setSelectedEventId("none");
      setAttendees([]);
      setEventDuration(90);
      setCompetitionWarning(null);
      setFallbackWarning(false);

      // Load upcoming events
      const fetchEvents = async () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const future = new Date();
        future.setDate(future.getDate() + 21); // Look 3 weeks ahead for comps
        try {
          const fetched = await getEventsForPeriod(now, future);
          const upcomingComps = fetched.filter((e) => e.type === "competition");
          if (upcomingComps.length > 0) {
            setCompetitionWarning(
              `Внимание: В следващите 3 седмици има състезание (${upcomingComps[0].title}). Препоръчва се 'Състезателен' период с намалена физическа интензивност.`
            );
            setPeriod("competition");
          }

          setEvents(
            fetched.filter(
              (e) =>
                e.type === "training" ||
                e.type === "camp" ||
                e.type === "competition"
            )
          );

          const dbFocuses = await plannerService.getFocusTags(activeBranch);
          setFocusOptions(dbFocuses);
        } catch (error) {
          console.error("Failed to load events", error);
        }
      };
      fetchEvents();
    }
  }, [open, activeBranch]);

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
      const allExercises = await plannerService.getExercises(activeBranch);

      let targetCombinations: { ageGroup: string; skillLevel: string }[] = [];

      if (attendees.length > 0) {
        const uniqueComboMap = new Map<
          string,
          { ageGroup: string; skillLevel: string }
        >();
        attendees.forEach((a) => {
          uniqueComboMap.set(`${a.ageGroup}-${a.skillLevel}`, {
            ageGroup: a.ageGroup,
            skillLevel: a.skillLevel,
          });
        });
        targetCombinations = Array.from(uniqueComboMap.values());
      } else {
        targetCombinations = [{ ageGroup, skillLevel: "Начинаещи" }]; // Fallback
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
        const baseFiltered = allExercises.filter(
          (ex) =>
            ex.ageGroups.includes(group.ageGroup) &&
            (ex.location.includes(location) || ex.location.includes("both"))
        );

        const selected: Exercise[] = [];
        const usedIds = new Set<string>();

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
          const shuffled = [...phasePool].sort(() => 0.5 - Math.random());
          let currentDur = 0;

          for (const ex of shuffled) {
            if (currentDur + ex.durationMinutes <= timeLimit + 5) {
              // Apply BWF dynamic intervals if it's a technical/tactical drill
              if (targetPhase.includes("main")) {
                const bwf = getBWFIntervals(group.ageGroup);
                ex.defaultSets = bwf.sets;
                ex.defaultWorkSec = bwf.workSec;
                ex.defaultRestSec = bwf.restSec;
              }
              selected.push(ex);
              usedIds.add(ex.id);
              currentDur += ex.durationMinutes;
            }
            if (currentDur >= timeLimit - 5) break;
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

      await plannerService.addSession(activeBranch, payload);

      onSaveSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
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

            {/* Calendar Import Section */}
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
                    {events.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {new Date(e.startDate).toLocaleDateString("bg-BG")} -{" "}
                        {e.title}
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
                      <Clock size={12} className="mr-1" /> {eventDuration} мин
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    Системата автоматично разделя децата по възраст и ниво на
                    умения (Skill Level).
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
                              updateAttendeeGroup(a.member.id, a.ageGroup, val)
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
                              <SelectItem value="Експерти">Експерти</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Methodological Settings */}
            <div className="space-y-4 rounded-xl border border-zinc-200 p-4">
              <h4 className="flex items-center gap-2 font-bold text-zinc-900">
                <Info className="size-4 text-zinc-400" />
                Методически Параметри
              </h4>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        v as "preparation" | "competition" | "transition"
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
                  Системата ще избере упражнения, които отговарят на тази
                  интензивност.
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
                        pedagogicalAction === "consolidation" && "bg-indigo-600"
                      )}
                      onClick={() => setPedagogicalAction("consolidation")}
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
                        pedagogicalAction === "progression" && "bg-indigo-600"
                      )}
                      onClick={() => setPedagogicalAction("progression")}
                    >
                      Надграждане
                    </Button>
                    <Button
                      variant={
                        pedagogicalAction === "new" ? "default" : "outline"
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
            </div>

            {selectedEventId === "none" && (
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
                </div>
                <div className="space-y-2">
                  <Label>Продължителност (мин)</Label>
                  <Input
                    type="number"
                    value={eventDuration}
                    onChange={(e) =>
                      setEventDuration(Number(e.target.value) || 90)
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
                Генерирай Тренировка
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 py-4 duration-300 animate-in fade-in slide-in-from-right-4">
            {fallbackWarning && (
              <Alert className="border-red-200 bg-red-50 text-red-800">
                <AlertTriangle className="size-4" />
                <AlertTitle>Липсващи упражнения!</AlertTitle>
                <AlertDescription className="text-xs">
                  В базата данни няма достатъчно упражнения за избрания фокус (
                  {focus}) и фаза. Системата автоматично допълни тренировката с
                  общи упражнения.
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
                                <div className="text-sm font-bold text-zinc-900">
                                  {ex.name}
                                </div>
                                <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-zinc-500">
                                  <span>{ex.durationMinutes} мин</span>
                                  <span>• {ex.category.toUpperCase()}</span>
                                  {ex.defaultSets && (
                                    <span className="font-medium text-indigo-600">
                                      • {ex.defaultSets} серии x{" "}
                                      {ex.defaultWorkSec}с /{ex.defaultRestSec}с
                                      почивка
                                    </span>
                                  )}
                                </div>
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
  );
}
