/* eslint-disable sonarjs/cognitive-complexity, sonarjs/no-nested-conditional */
"use client";

import {
  Calendar,
  CheckCircle2,
  Clock,
  Dumbbell,
  Layers,
  MapPin,
  Pencil,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import Link from "next/link";

import { CoachNotesCard } from "@/components/training/CoachNotesCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Exercise, PlannerSession, SessionBlock } from "@/types/planner.types";

interface SessionDetailsDialogProps {
  session: PlannerSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendeeCount?: number;
  onEdit?: (session: PlannerSession) => void;
  onRevertToPlanned?: (sessionId: string) => void;
}

const formatLocationLabel = (loc: string) => {
  if (loc === "court") return "В зала";
  if (loc === "stadium") return "Стадион";
  if (loc === "beach") return "Плаж";
  return loc || "На открито";
};

const getCategoryLabel = (category?: string) => {
  switch (category) {
    case "warmup":
      return "Загрявка";
    case "technique":
      return "Техника";
    case "tactics":
      return "Тактика";
    case "physical":
      return "ОФП / Физическа";
    case "games":
      return "Игри";
    case "cooldown":
      return "Разпускане";
    case "quiz":
      return "Теория / Викторина";
    default:
      return category || "Общо";
  }
};

const getPhaseTitle = (phase: string) => {
  if (phase === "warmup") return "1. Загрявка";
  if (phase === "main") return "2. Основна част";
  if (phase === "cooldown") return "3. Разпускане и стречинг";
  return phase;
};

export function SessionDetailsDialog({
  session,
  open,
  onOpenChange,
  attendeeCount = 0,
  onEdit,
  onRevertToPlanned,
}: SessionDetailsDialogProps) {
  if (!session) return null;

  const isCompleted = session.status === "completed";

  // Gather all blocks or legacy exercises
  const hasBlocks = session.blocks && session.blocks.length > 0;
  const hasGrouped =
    session.groupedExercises && session.groupedExercises.length > 0;
  const hasLegacyExercises = session.exercises && session.exercises.length > 0;

  const totalExercisesCount =
    session.blocks?.reduce((acc, b) => acc + b.items.length, 0) ||
    session.groupedExercises?.reduce((acc, g) => acc + g.exercises.length, 0) ||
    session.exercises?.length ||
    0;

  const formattedDate = new Date(session.date).toLocaleDateString("bg-BG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden p-0 sm:rounded-3xl">
        {/* Header Banner */}
        <div className="border-b border-zinc-100 bg-gradient-to-br from-indigo-50/80 via-white to-zinc-50/80 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {isCompleted ? (
                <Badge className="border-emerald-200 bg-emerald-100 font-bold text-emerald-800 uppercase shadow-xs">
                  <CheckCircle2 className="mr-1 size-3.5" />
                  Проведена тренировка
                </Badge>
              ) : (
                <Badge
                  variant={session.mode === "camp" ? "destructive" : "default"}
                  className="font-bold tracking-wider uppercase"
                >
                  {session.mode === "camp" ? "Лагер" : "Целогодишна"}
                </Badge>
              )}

              {session.targetGroups && session.targetGroups.length > 0 ? (
                session.targetGroups.map((g, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="border-indigo-200 bg-indigo-50 font-bold text-indigo-700 uppercase"
                  >
                    {g}
                  </Badge>
                ))
              ) : session.ageGroup ? (
                <Badge
                  variant="outline"
                  className="bg-zinc-100 font-bold uppercase"
                >
                  {session.ageGroup}
                </Badge>
              ) : null}

              {isCompleted && attendeeCount > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-indigo-100/70 font-bold text-indigo-900"
                >
                  <Users className="mr-1 size-3 text-indigo-600" />
                  {attendeeCount} присъствали
                </Badge>
              )}
            </div>
          </div>

          <DialogTitle className="mt-3 text-2xl font-black tracking-tight text-zinc-900">
            {session.title}
          </DialogTitle>

          {/* Metadata chips */}
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-zinc-600">
            <div className="flex items-center gap-1.5">
              <Calendar className="size-4 text-indigo-600" />
              <span className="capitalize">{formattedDate}</span>
            </div>

            {(session.startTime || session.endTime) && (
              <div className="flex items-center gap-1.5">
                <Clock className="size-4 text-indigo-600" />
                <span>
                  {session.startTime || "--:--"} - {session.endTime || "--:--"}
                </span>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <MapPin className="size-4 text-indigo-600" />
              <span>{formatLocationLabel(session.location)}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Dumbbell className="size-4 text-indigo-600" />
              <span>{totalExercisesCount} упражнения / игри</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="max-h-[calc(90vh-180px)] p-6">
          <div className="space-y-6">
            {/* Coach Notes & Methodological instructions */}
            {session.coachNotes && (
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wider text-zinc-400 uppercase">
                  <Sparkles className="size-3.5 text-amber-500" />
                  Треньорски бележки & Организация
                </h4>
                <CoachNotesCard
                  notes={session.coachNotes}
                  className="border-amber-200 bg-amber-50/40 text-sm"
                />
              </div>
            )}

            {/* Target Groups Detail if present */}
            {session.sessionGroups && session.sessionGroups.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wider text-zinc-400 uppercase">
                  <Users className="size-3.5 text-indigo-500" />
                  Разпределение по групи
                </h4>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {session.sessionGroups.map((grp) => (
                    <div
                      key={grp.id}
                      className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-xs"
                    >
                      <span className="font-bold text-zinc-900">
                        {grp.name}
                      </span>
                      <span className="font-medium text-zinc-500">
                        {grp.memberIds?.length || 0} състезатели
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Structured Blocks (Warmup, Main, Cooldown) */}
            {hasBlocks && (
              <div className="space-y-6">
                <h4 className="flex items-center gap-2 text-xs font-bold tracking-wider text-zinc-400 uppercase">
                  <Layers className="size-3.5 text-indigo-500" />
                  План на тренировката по части
                </h4>

                {session.blocks!.map((block: SessionBlock) => (
                  <div
                    key={block.id}
                    className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/80 px-4 py-2.5">
                      <span className="text-xs font-bold tracking-wide text-zinc-800 uppercase">
                        {getPhaseTitle(block.phase)}
                      </span>
                      {block.targetDuration > 0 && (
                        <Badge
                          variant="secondary"
                          className="bg-white text-[11px] font-semibold text-zinc-600 shadow-2xs"
                        >
                          {block.targetDuration} мин.
                        </Badge>
                      )}
                    </div>

                    <div className="divide-y divide-zinc-100 p-2">
                      {block.items.length === 0 ? (
                        <div className="p-4 text-center text-xs text-zinc-400">
                          Няма добавени упражнения в тази фаза.
                        </div>
                      ) : (
                        block.items.map((item, idx) => (
                          <div key={item.id || idx} className="p-3">
                            {item.type === "station" ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Badge className="bg-amber-100 text-[10px] font-bold text-amber-800 hover:bg-amber-100">
                                      🔄 Станционна Ротация
                                    </Badge>
                                    <span className="text-xs font-bold text-zinc-900">
                                      {item.durationMinutes} мин. на станция
                                    </span>
                                  </div>
                                </div>

                                {item.rotations &&
                                  item.rotations.length > 0 && (
                                    <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
                                      {item.rotations.map((r, rIdx) => (
                                        <div
                                          key={rIdx}
                                          className="rounded-xl border border-amber-200/80 bg-amber-50/30 p-2.5 text-xs"
                                        >
                                          <div className="flex items-center gap-1.5 font-bold text-amber-900">
                                            <Target className="size-3 text-amber-600" />
                                            {r.exercise?.name || "Упражнение"}
                                          </div>
                                          {r.exercise?.description && (
                                            <p className="mt-1 text-[11px] leading-relaxed text-zinc-600">
                                              {r.exercise.description}
                                            </p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-zinc-900">
                                      {item.exercise?.name || "Упражнение"}
                                    </span>
                                    {item.exercise?.category && (
                                      <Badge
                                        variant="outline"
                                        className="border-zinc-200 bg-zinc-50 text-[10px] text-zinc-600"
                                      >
                                        {getCategoryLabel(
                                          item.exercise.category
                                        )}
                                      </Badge>
                                    )}
                                  </div>

                                  <span className="text-xs font-semibold text-indigo-600">
                                    {item.durationMinutes ||
                                      item.exercise?.durationMinutes ||
                                      5}{" "}
                                    мин.
                                  </span>
                                </div>

                                {item.exercise?.description && (
                                  <p className="text-xs leading-relaxed text-zinc-600">
                                    {item.exercise.description}
                                  </p>
                                )}

                                {item.exercise?.coachingPoints &&
                                  item.exercise.coachingPoints.length > 0 && (
                                    <div className="mt-2 rounded-lg bg-zinc-50 p-2 text-[11px] text-zinc-600">
                                      <span className="font-bold text-zinc-700">
                                        Акценти:{" "}
                                      </span>
                                      {item.exercise.coachingPoints.join(" • ")}
                                    </div>
                                  )}

                                {item.exercise?.equipment &&
                                  item.exercise.equipment.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1 pt-1">
                                      <span className="text-[10px] font-medium text-zinc-400">
                                        Екипировка:
                                      </span>
                                      {item.exercise.equipment.map(
                                        (eq, eqIdx) => (
                                          <Badge
                                            key={eqIdx}
                                            variant="secondary"
                                            className="text-[10px] font-normal"
                                          >
                                            {eq}
                                          </Badge>
                                        )
                                      )}
                                    </div>
                                  )}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Grouped Exercises if present without blocks */}
            {!hasBlocks && hasGrouped && (
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-xs font-bold tracking-wider text-zinc-400 uppercase">
                  <Layers className="size-3.5 text-indigo-500" />
                  Упражнения по възрастови групи
                </h4>

                {session.groupedExercises!.map((grp, gIdx) => (
                  <div
                    key={gIdx}
                    className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <Badge className="bg-indigo-600 font-bold text-white">
                        {grp.ageGroup}{" "}
                        {grp.skillLevel ? `(${grp.skillLevel})` : ""}
                      </Badge>
                      <span className="text-xs font-medium text-zinc-500">
                        {grp.exercises.length} упражнения
                      </span>
                    </div>

                    <div className="space-y-3">
                      {grp.exercises.map((ex, eIdx) => (
                        <div
                          key={ex.id || eIdx}
                          className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 text-xs"
                        >
                          <div className="flex items-center justify-between font-bold text-zinc-900">
                            <span>{ex.name}</span>
                            <span className="text-indigo-600">
                              {ex.durationMinutes} мин.
                            </span>
                          </div>
                          {ex.description && (
                            <p className="mt-1 leading-relaxed text-zinc-600">
                              {ex.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Legacy Flat Exercises list if present */}
            {!hasBlocks && !hasGrouped && hasLegacyExercises && (
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-xs font-bold tracking-wider text-zinc-400 uppercase">
                  <Layers className="size-3.5 text-indigo-500" />
                  Списък с упражнения
                </h4>

                <div className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white p-2">
                  {session.exercises!.map((ex: Exercise, idx: number) => (
                    <div key={ex.id || idx} className="p-3 text-xs">
                      <div className="flex items-center justify-between font-bold text-zinc-900">
                        <span>{ex.name}</span>
                        <span className="text-indigo-600">
                          {ex.durationMinutes} мин.
                        </span>
                      </div>
                      {ex.description && (
                        <p className="mt-1 leading-relaxed text-zinc-600">
                          {ex.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* If no exercises attached */}
            {!hasBlocks && !hasGrouped && !hasLegacyExercises && (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center text-xs text-zinc-500">
                Няма въведени структурирани упражнения за тази тренировка.
                {session.coachNotes && (
                  <p className="mt-1 font-medium text-zinc-700">
                    Вижте треньорските бележки по-горе за указанията.
                  </p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer actions */}
        <DialogFooter className="flex flex-wrap items-center justify-between border-t border-zinc-100 bg-zinc-50 p-4 sm:justify-between">
          <div className="flex items-center gap-2">
            {isCompleted && onRevertToPlanned && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs text-zinc-600 hover:bg-zinc-100"
                onClick={() => {
                  onRevertToPlanned(session.id);
                  onOpenChange(false);
                }}
              >
                <RotateCcw className="mr-1.5 size-3.5" />
                Върни в предстоящи
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-semibold"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(session);
                }}
              >
                <Pencil className="mr-1.5 size-3.5" />
                Редактирай
              </Button>
            )}

            <Button
              asChild
              size="sm"
              className={
                isCompleted
                  ? "rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
                  : "rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700"
              }
            >
              <Link href={`/training/planner/${session.id}/active`}>
                {isCompleted ? (
                  <>
                    <Users className="mr-1.5 size-3.5" />
                    Присъствия
                  </>
                ) : (
                  <>
                    <Play className="mr-1.5 size-3.5" />
                    Старт
                  </>
                )}
              </Link>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
