"use client";

import { addWeeks, format } from "date-fns";
import { bg } from "date-fns/locale";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Info,
  Trophy,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { plannerService } from "@/services/planner-service";
import { useAppStore } from "@/store/use-app-store";
import {
  AnnualPlan,
  AnnualPlanPhase,
  AnnualPlanSession,
  AnnualPlanWeek,
  Exercise,
  TrainingTemplate,
} from "@/types/planner.types";
export default function AnnualPlansClient() {
  const router = useRouter();
  const { activeBranch: siteId } = useAppStore();
  const [plans, setPlans] = useState<AnnualPlan[]>([]);
  const [templates, setTemplates] = useState<TrainingTemplate[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Modals / Dialogs
  const [sessionPreview, setSessionPreview] = useState<{
    session: AnnualPlanSession;
    week: AnnualPlanWeek;
    phase: AnnualPlanPhase;
  } | null>(null);

  const [exercisePreview, setExercisePreview] = useState<Exercise | null>(null);

  useEffect(() => {
    if (!siteId) return;
    Promise.all([
      plannerService.getAnnualPlans(siteId),
      plannerService.getTrainingTemplates(siteId),
      plannerService.getExercises(siteId),
    ]).then(([fetchedPlans, fetchedTemplates, fetchedExercises]) => {
      setPlans(fetchedPlans);
      setTemplates(fetchedTemplates);
      setAllExercises(fetchedExercises);
      if (fetchedPlans.length > 0) setSelectedPlanId(fetchedPlans[0].id);
      setLoading(false);
    });
  }, [siteId]);

  const activePlan = plans.find((p) => p.id === selectedPlanId);

  // Dynamic Date calculation
  const handleStartDateChange = async (dateStr: string) => {
    if (!activePlan) return;
    try {
      await plannerService.updateAnnualPlan(activePlan.id, {
        seasonStartDate: dateStr,
      });
      setPlans(
        plans.map((p) =>
          p.id === activePlan.id ? { ...p, seasonStartDate: dateStr } : p
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const getTemplate = (id?: string) => templates.find((t) => t.id === id);

  if (loading)
    return (
      <div className="animate-pulse p-8 text-center text-muted-foreground">
        Зареждане на планове...
      </div>
    );
  if (!plans.length)
    return (
      <div className="p-8 text-center">
        Няма намерени годишни планове. Изпълнете seed скрипта.
      </div>
    );

  return (
    <div className="container max-w-6xl space-y-6 py-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Едногодишни Планове
          </h1>
          <p className="mt-1 text-muted-foreground">
            BWF Периодизация и тренировъчни програми (Macrocycles).
          </p>
        </div>
      </div>

      <Tabs
        value={selectedPlanId || ""}
        onValueChange={setSelectedPlanId}
        className="w-full"
      >
        <TabsList className="mb-4 flex h-auto flex-wrap gap-2">
          {plans.map((plan) => (
            <TabsTrigger
              key={plan.id}
              value={plan.id}
              className="px-4 py-2 text-sm"
            >
              {plan.targetAgeGroups.join("/")}
            </TabsTrigger>
          ))}
        </TabsList>

        {plans.map((plan) => (
          <TabsContent key={plan.id} value={plan.id}>
            <Card className="border-primary/20 shadow-sm">
              <CardHeader className="bg-primary/5 pb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="mt-2 text-base">
                      {plan.description}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2 rounded-lg border bg-background p-3 shadow-sm">
                    <Label className="text-xs text-muted-foreground">
                      Начало на Сезона (Динамично)
                    </Label>
                    <Input
                      type="date"
                      value={plan.seasonStartDate || ""}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="h-8 w-40 text-sm"
                    />
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  {plan.targetAgeGroups.map((ag) => (
                    <Badge key={ag} variant="secondary">
                      {ag}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {plan.phases.map((phase) => (
                    <PhaseView
                      key={phase.id}
                      phase={phase}
                      planStartDate={plan.seasonStartDate}
                      onPreviewSession={(session, week) =>
                        setSessionPreview({ session, week, phase })
                      }
                      getTemplate={getTemplate}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* SESSION PREVIEW DIALOG */}
      <Dialog
        open={!!sessionPreview}
        onOpenChange={(open) => {
          if (!open) {
            setSessionPreview(null);
          }
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          {sessionPreview &&
            (() => {
              const tmpl = getTemplate(sessionPreview.session.templateId);
              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                      Ден {sessionPreview.session.dayOfWeek}
                      <span className="text-sm font-normal text-muted-foreground">
                        | Седмица {sessionPreview.week.weekNumber}
                      </span>
                    </DialogTitle>
                    <DialogDescription>
                      Фаза: {sessionPreview.phase.name} • Фокус:{" "}
                      {sessionPreview.session.focus}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="mt-4 space-y-4">
                    {sessionPreview.week.isMatchWeek && (
                      <div className="flex items-center gap-2 rounded-md bg-amber-100 p-3 text-sm font-medium text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
                        <Trophy className="size-5" />
                        Състезателна седмица (Match Week) - Tapering & Peaking
                        включени.
                      </div>
                    )}

                    {!tmpl ? (
                      <div className="rounded-lg bg-muted/50 p-8 text-center">
                        Шаблонът не е намерен.
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between border-b pb-2">
                          <h3 className="text-lg font-bold text-primary">
                            {tmpl.name}
                          </h3>
                          <Badge>{tmpl.totalDurationMinutes} мин</Badge>
                        </div>

                        <div className="space-y-4">
                          {tmpl.blocks.map((block) => (
                            <div
                              key={block.id}
                              className="rounded-lg border bg-muted/30 p-4"
                            >
                              <div className="mb-2 flex items-center justify-between">
                                <h4 className="font-semibold">{block.title}</h4>
                                <span className="rounded border bg-background px-2 py-1 font-mono text-xs">
                                  {block.durationMinutes} мин
                                </span>
                              </div>

                              {block.description && (
                                <p className="mb-4 rounded-md border-l-2 border-primary/50 bg-background p-3 text-sm whitespace-pre-wrap text-muted-foreground">
                                  {block.description}
                                </p>
                              )}

                              <div className="space-y-2">
                                {block.exercises.map((ex, i) => (
                                  <div
                                    key={i}
                                    className="flex flex-col gap-1 rounded border bg-background p-2 text-sm"
                                  >
                                    <div className="flex items-center justify-between font-medium">
                                      <button
                                        className="text-left font-semibold text-primary hover:underline"
                                        onClick={() => {
                                          const foundEx = allExercises.find(
                                            (e) => e.id === ex.exerciseId
                                          );
                                          if (foundEx)
                                            setExercisePreview(foundEx);
                                          else
                                            alert(
                                              "Упражнението не е намерено в базата данни."
                                            );
                                        }}
                                      >
                                        {ex.exerciseName}
                                      </button>
                                      <span>{ex.durationMinutes} мин</span>
                                    </div>
                                    {ex.customInstructions && (
                                      <span className="text-xs text-muted-foreground italic">
                                        Забележка: {ex.customInstructions}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <DialogFooter className="mt-6 flex items-center gap-4 sm:justify-between">
                    <p className="text-xs text-muted-foreground">
                      <Info className="mr-1 inline size-4" />
                      Щракнете върху упражнение за видео и детайли.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setSessionPreview(null)}
                      >
                        Затвори
                      </Button>
                      {tmpl && (
                        <Button
                          onClick={() =>
                            router.push(
                              `/training/planner?importTemplate=${tmpl.id}`
                            )
                          }
                        >
                          Импортирай в Планировчика
                        </Button>
                      )}
                    </div>
                  </DialogFooter>
                </>
              );
            })()}
        </DialogContent>
      </Dialog>

      {/* EXERCISE PREVIEW DIALOG */}
      <Dialog
        open={!!exercisePreview}
        onOpenChange={(open) => !open && setExercisePreview(null)}
      >
        <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
          {exercisePreview && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl text-primary">
                  {exercisePreview.name}
                </DialogTitle>
                <DialogDescription>
                  Категория: {exercisePreview.category} | Възраст:{" "}
                  {exercisePreview.ageGroups.join(", ")}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-4 text-sm">
                {exercisePreview.videoUrl && (
                  <div className="flex items-center justify-between rounded border bg-muted/30 p-3">
                    <span className="font-semibold">Видео Демонстрация:</span>
                    <a
                      href={exercisePreview.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      Гледай в YouTube
                    </a>
                  </div>
                )}

                {exercisePreview.description && (
                  <div>
                    <h4 className="mb-1 border-b pb-1 font-bold">
                      Инструкции (BWF)
                    </h4>
                    <p className="whitespace-pre-wrap text-muted-foreground">
                      {exercisePreview.description}
                    </p>
                  </div>
                )}

                {exercisePreview.coachingPoints &&
                  exercisePreview.coachingPoints.length > 0 && (
                    <div>
                      <h4 className="mb-1 border-b pb-1 font-bold">
                        Треньорски насоки
                      </h4>
                      <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                        {exercisePreview.coachingPoints.map((pt, idx) => (
                          <li key={idx}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                <div className="grid grid-cols-2 gap-4 rounded border bg-muted/20 p-3">
                  <div>
                    <span className="mb-1 block font-bold">
                      Необходими уреди:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {exercisePreview.equipment.length > 0 ? (
                        exercisePreview.equipment.map((e) => (
                          <Badge key={e} variant="outline" className="text-xs">
                            {e}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Няма
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="mb-1 block font-bold">Базови умения:</span>
                    <div className="flex flex-wrap gap-1">
                      {exercisePreview.prerequisites &&
                      exercisePreview.prerequisites.length > 0 ? (
                        exercisePreview.prerequisites.map((p) => (
                          <Badge
                            key={p}
                            variant="secondary"
                            className="text-xs"
                          >
                            {p}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Няма
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setExercisePreview(null)}>
                  Затвори
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------
// Subcomponents
// ---------------------------------

function PhaseView({
  phase,
  planStartDate,
  onPreviewSession,
  getTemplate,
}: {
  phase: AnnualPlanPhase;
  planStartDate?: string;
  onPreviewSession: (s: AnnualPlanSession, w: AnnualPlanWeek) => void;
  getTemplate: (id?: string) => TrainingTemplate | undefined;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full">
      <div
        className="flex cursor-pointer items-center justify-between bg-card p-4 transition-colors hover:bg-muted/50"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            {open ? (
              <ChevronDown className="size-5" />
            ) : (
              <ChevronRight className="size-5" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold">{phase.name} Фаза</h3>
            <p className="text-sm text-muted-foreground">
              Седмици {phase.startWeek} - {phase.endWeek} • {phase.description}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="bg-background">
          {phase.weeks.length} седмици
        </Badge>
      </div>

      {open && (
        <div className="bg-muted/10 p-4 pt-0">
          <div className="mt-4 space-y-3">
            {phase.weeks.map((week) => (
              <WeekView
                key={week.weekNumber}
                week={week}
                planStartDate={planStartDate}
                onPreviewSession={(s) => onPreviewSession(s, week)}
                getTemplate={getTemplate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WeekView({
  week,
  planStartDate,
  onPreviewSession,
  getTemplate,
}: {
  week: AnnualPlanWeek;
  planStartDate?: string;
  onPreviewSession: (s: AnnualPlanSession) => void;
  getTemplate: (id?: string) => TrainingTemplate | undefined;
}) {
  const [open, setOpen] = useState(false);

  let dateRangeStr = "";
  if (planStartDate) {
    const startObj = new Date(planStartDate);
    const weekStart = addWeeks(startObj, week.weekNumber - 1);
    const weekEnd = addWeeks(weekStart, 1);
    dateRangeStr = `${format(weekStart, "d MMM", { locale: bg })} - ${format(weekEnd, "d MMM", { locale: bg })}`;
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-background shadow-sm">
      <div
        className={`flex cursor-pointer items-center justify-between p-3 hover:bg-muted/50 ${week.isMatchWeek ? "bg-amber-50/50 dark:bg-amber-900/10" : ""}`}
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <div className="flex w-4 justify-center text-muted-foreground">
            {open ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </div>
          <span className="min-w-[90px] font-medium">
            Седмица {week.weekNumber}
          </span>
          <span className="hidden text-sm text-muted-foreground sm:inline-block">
            {week.focus}
          </span>
          {week.isMatchWeek && (
            <Badge
              variant="secondary"
              className="flex gap-1 bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-100"
            >
              <Trophy className="size-3" /> Match Week
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {dateRangeStr && (
            <span className="flex items-center gap-1">
              <Calendar className="size-3" /> {dateRangeStr}
            </span>
          )}
          <span className="rounded bg-muted px-2 py-1 text-xs">
            {week.sessions.length} сесии
          </span>
        </div>
      </div>

      {open && (
        <div className="flex flex-wrap gap-2 border-t bg-muted/5 p-3">
          {week.sessions.map((session, idx) => {
            const tmpl = getTemplate(session.templateId);
            return (
              <div
                key={idx}
                onClick={() => onPreviewSession(session)}
                className="group min-w-50 flex-1 cursor-pointer rounded-md border bg-card p-3 shadow-sm transition-colors hover:border-primary/50"
              >
                <div className="mb-1 flex items-start justify-between">
                  <Badge variant="outline" className="mb-2">
                    Ден {session.dayOfWeek}
                  </Badge>
                  {session.isCampSession && (
                    <Badge variant="secondary" className="text-[10px]">
                      Лагер
                    </Badge>
                  )}
                </div>
                <div className="line-clamp-1 text-sm font-medium transition-colors group-hover:text-primary">
                  {tmpl?.name || "Неизвестен шаблон"}
                </div>
                <div className="mt-1 truncate text-xs text-muted-foreground">
                  Фокус: {session.focus}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
