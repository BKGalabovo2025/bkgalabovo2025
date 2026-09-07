/* eslint-disable sonarjs/no-nested-conditional */
"use client";

import { Clock, Info, ShieldAlert, Sparkles, Trophy } from "lucide-react";
import React, { useState } from "react";

import { ExerciseDetailModal } from "@/components/training/ExerciseDetailModal";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ActiveWorkoutScheduleDay } from "@/lib/actions/trainings";
import { findExerciseDetails } from "@/services/exercise-lookup-service";
import { Exercise } from "@/types/planner.types";

export interface WorkoutDayPreviewModalProps {
  open: boolean;
  onClose: () => void;
  data: { memberName: string; workout: ActiveWorkoutScheduleDay } | null;
}

export function WorkoutDayPreviewModal({
  open,
  onClose,
  data,
}: WorkoutDayPreviewModalProps) {
  const [selectedExerciseData, setSelectedExerciseData] = useState<{
    exercise: Partial<Exercise>;
    workoutContext: {
      sets?: number;
      repsOrDuration?: string;
      restSec?: number;
      techniqueTip?: string;
    };
  } | null>(null);

  if (!data) return null;
  const { memberName, workout } = data;
  const isDeload = workout.safetyAudit?.fatigueDeloadActive;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] w-[95vw] max-w-2xl overflow-y-auto rounded-3xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-300">
              <Sparkles className="size-4.5" />
            </span>
            <div>
              <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                AI Тренировъчен План за {memberName}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                {workout.programTitle}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-4 text-xs">
          {workout.isCompetitionDay && (
            <div className="flex items-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              <Trophy className="size-5 shrink-0 text-amber-600" />
              <div>
                <strong className="font-bold">
                  ВАЖНО СЪСТЕЗАНИЕ ОТ КЛУБНИЯ ГРАФИК:
                </strong>
                <p className="text-[11px]">
                  {workout.competitionTitle || "Официален турнир"} —
                  състезателят следва предсъстезателна активация и запазване на
                  нервния тонус!
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col justify-between gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-3.5 sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-900">
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {workout.dayName}
                {workout.calendarDate && (
                  <span className="ml-2 font-normal text-purple-700 dark:text-purple-300">
                    ({workout.calendarDate})
                  </span>
                )}
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {workout.focus}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-zinc-500">
                <Clock className="size-3.5" />
                <span>{workout.durationMinutes} мин</span>
              </span>
              <Badge
                className={
                  workout.intensity === "high"
                    ? "bg-rose-500 text-[10px] text-white uppercase"
                    : workout.intensity === "medium"
                      ? "bg-amber-500 text-[10px] text-white uppercase"
                      : "bg-emerald-500 text-[10px] text-white uppercase"
                }
              >
                {workout.intensity === "high"
                  ? "Висока"
                  : workout.intensity === "medium"
                    ? "Умерена"
                    : "Ниска"}
              </Badge>
            </div>
          </div>

          {workout.warmup && workout.warmup.length > 0 && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3 text-blue-950 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-200">
              <strong className="mr-1.5 font-semibold">Загрявка:</strong>
              {workout.warmup.join(" • ")}
            </div>
          )}

          {workout.exercises && workout.exercises.length > 0 && (
            <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100 text-[10px] text-zinc-600 uppercase dark:bg-zinc-900 dark:text-zinc-400">
                  <tr>
                    <th className="p-2.5">Упражнение</th>
                    <th className="p-2.5 text-center">Серии</th>
                    <th className="p-2.5 text-center">Повторения</th>
                    <th className="p-2.5 text-center">Почивка</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {workout.exercises.map((ex, i) => (
                    <tr
                      key={i}
                      onClick={async () => {
                        const details = await findExerciseDetails(
                          ex.name,
                          ex.techniqueTip
                        );
                        setSelectedExerciseData({
                          exercise: details,
                          workoutContext: {
                            sets: ex.sets,
                            repsOrDuration: ex.repsOrDuration,
                            restSec: ex.restSec,
                            techniqueTip: ex.techniqueTip,
                          },
                        });
                      }}
                      className="group cursor-pointer transition-colors hover:bg-purple-50/70 dark:hover:bg-purple-950/30"
                      title="Кликнете за пълно методическо описание и насоки"
                    >
                      <td className="p-2.5 font-medium text-zinc-900 dark:text-zinc-100">
                        <div className="flex items-center gap-1.5 transition-colors group-hover:text-purple-700 dark:group-hover:text-purple-300">
                          <span>{ex.name}</span>
                          <Info
                            size={12}
                            className="shrink-0 text-purple-400 opacity-60 transition-opacity group-hover:opacity-100"
                          />
                        </div>
                        {ex.techniqueTip && (
                          <div className="text-[10px] text-zinc-500 italic">
                            {ex.techniqueTip}
                          </div>
                        )}
                      </td>
                      <td className="p-2.5 text-center">{ex.sets}</td>
                      <td className="p-2.5 text-center">{ex.repsOrDuration}</td>
                      <td className="p-2.5 text-center">{ex.restSec}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {workout.safetyAudit && (
            <div
              className={`rounded-2xl border p-3 ${
                isDeload
                  ? "border-amber-300 bg-amber-50/70 text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200"
                  : "border-purple-200 bg-purple-50/50 text-purple-950 dark:border-purple-900/30 dark:bg-purple-950/20 dark:text-purple-200"
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold">
                <ShieldAlert className="size-4 text-purple-600 dark:text-purple-400" />
                <span>Мерки за безопасност & Адаптация:</span>
              </div>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-[11px]">
                {workout.safetyAudit.activeRestrictions?.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
              {workout.safetyAudit.coachSafetyNotes && (
                <p className="mt-1.5 border-t border-zinc-200/50 pt-1 text-[10px] text-zinc-600 italic dark:text-zinc-400">
                  {workout.safetyAudit.coachSafetyNotes}
                </p>
              )}
            </div>
          )}

          {workout.cooldown && workout.cooldown.length > 0 && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3 text-emerald-950 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200">
              <strong className="mr-1.5 font-semibold">
                Разгрявка / Стречинг:
              </strong>
              {workout.cooldown.join(" • ")}
            </div>
          )}

          {workout.recoveryRecommendations &&
            workout.recoveryRecommendations.length > 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
                <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Възстановяване след тренировката:
                </strong>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {workout.recoveryRecommendations.map((rec, i) => (
                    <span
                      key={i}
                      className="rounded-lg bg-zinc-200/80 px-2 py-0.5 text-[11px] dark:bg-zinc-800"
                    >
                      {rec}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {workout.theoryAssignment && (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3 text-indigo-950 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-indigo-200">
              <strong className="font-semibold">
                Теоретична задача за състезателя:
              </strong>
              <p className="mt-0.5 text-[11px]">{workout.theoryAssignment}</p>
            </div>
          )}
        </div>
      </DialogContent>

      <ExerciseDetailModal
        open={!!selectedExerciseData}
        onClose={() => setSelectedExerciseData(null)}
        exercise={selectedExerciseData?.exercise || null}
        workoutContext={selectedExerciseData?.workoutContext}
      />
    </Dialog>
  );
}
