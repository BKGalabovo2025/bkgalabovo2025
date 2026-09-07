"use client";

import {
  CheckCircle2,
  Dumbbell,
  ExternalLink,
  Info,
  MapPin,
  Sparkles,
  Zap,
} from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Exercise } from "@/types/planner.types";

function getLocationLabel(location?: string[]) {
  if (!location || location.length === 0) return "Бадминтон корт / Зала";
  if (location.includes("beach")) return "Плаж";
  if (location.includes("stadium")) return "Стадион";
  return "Бадминтон корт / Зала";
}

export interface ExerciseDetailModalProps {
  open: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  exercise: Partial<Exercise> | null;
  workoutContext?: {
    sets?: number;
    repsOrDuration?: string;
    restSec?: number;
    techniqueTip?: string;
  };
}

export function ExerciseDetailModal({
  open,
  onClose,
  onOpenChange,
  exercise,
  workoutContext,
}: ExerciseDetailModalProps) {
  if (!exercise) return null;

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange?.(isOpen);
    if (!isOpen) {
      onClose?.();
    }
  };

  const getCategoryColor = (cat?: string) => {
    switch (cat) {
      case "technique":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300";
      case "physical":
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300";
      case "tactics":
        return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300";
      case "warmup":
        return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300";
      case "cooldown":
        return "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300";
      default:
        return "bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300";
    }
  };

  const getCategoryLabel = (cat?: string) => {
    switch (cat) {
      case "technique":
        return "🏸 Техника";
      case "physical":
        return "🏋️ Физическа подготовка";
      case "tactics":
        return "🧠 Тактика";
      case "warmup":
        return "🔥 Загрявка";
      case "cooldown":
        return "🌿 Разпускане";
      case "games":
        return "🎯 Игри и разигравания";
      default:
        return "🏸 Упражнение";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[88vh] w-[95vw] max-w-xl overflow-y-auto rounded-3xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${getCategoryColor(
                exercise.category
              )}`}
            >
              {getCategoryLabel(exercise.category)}
            </Badge>
            {exercise.source && (
              <span className="text-[11px] text-zinc-500 italic">
                {exercise.source}
              </span>
            )}
          </div>
          <DialogTitle className="mt-2 text-lg font-bold text-zinc-950 dark:text-zinc-100">
            {exercise.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Подробно методическо описание от клубната база данни
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4 text-xs">
          {/* Workout Prescribed Context if from active plan */}
          {workoutContext && (
            <div className="rounded-2xl border border-purple-200/80 bg-purple-50/60 p-3.5 dark:border-purple-900/40 dark:bg-purple-950/20">
              <div className="flex items-center gap-1.5 font-bold text-purple-900 dark:text-purple-200">
                <Sparkles size={14} className="text-purple-600" />
                <span>Предписание в текущия тренировъчен план:</span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                {workoutContext.sets !== undefined && (
                  <div className="rounded-xl bg-white/90 p-2 shadow-2xs dark:bg-zinc-900">
                    <span className="block text-[10px] text-zinc-500 uppercase">
                      Серии
                    </span>
                    <strong className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {workoutContext.sets}
                    </strong>
                  </div>
                )}
                {workoutContext.repsOrDuration && (
                  <div className="rounded-xl bg-white/90 p-2 shadow-2xs dark:bg-zinc-900">
                    <span className="block text-[10px] text-zinc-500 uppercase">
                      Повторения / Време
                    </span>
                    <strong className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {workoutContext.repsOrDuration}
                    </strong>
                  </div>
                )}
                {workoutContext.restSec !== undefined && (
                  <div className="rounded-xl bg-white/90 p-2 shadow-2xs dark:bg-zinc-900">
                    <span className="block text-[10px] text-zinc-500 uppercase">
                      Почивка
                    </span>
                    <strong className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {workoutContext.restSec} сек
                    </strong>
                  </div>
                )}
              </div>
              {workoutContext.techniqueTip && (
                <p className="mt-2.5 border-t border-purple-200/50 pt-2 text-[11px] text-purple-950 dark:text-purple-200">
                  <strong className="font-semibold">Технически фокус:</strong>{" "}
                  {workoutContext.techniqueTip}
                </p>
              )}
            </div>
          )}

          {/* Description */}
          {exercise.description && (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <h4 className="mb-1.5 flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100">
                <Info size={14} className="text-zinc-500" />
                Описание на упражнението:
              </h4>
              <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">
                {exercise.description}
              </p>
            </div>
          )}

          {/* Coaching Points */}
          {exercise.coachingPoints && exercise.coachingPoints.length > 0 && (
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
              <h4 className="mb-2 flex items-center gap-1.5 font-bold text-amber-950 dark:text-amber-200">
                <Zap size={14} className="text-amber-600" />
                Методически насоки за треньора:
              </h4>
              <ul className="space-y-1.5">
                {exercise.coachingPoints.map((point, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-zinc-800 dark:text-zinc-200"
                  >
                    <CheckCircle2
                      size={13}
                      className="mt-0.5 shrink-0 text-emerald-600"
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Biomechanics & Kinetic Chain */}
          {exercise.targetKineticChain &&
            exercise.targetKineticChain.length > 0 && (
              <div className="rounded-2xl border border-zinc-200 p-3.5 dark:border-zinc-800">
                <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100">
                  <Dumbbell size={14} className="text-indigo-600" />
                  <span>Целева кинетична верига & Мускулни групи:</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {exercise.targetKineticChain.map((chain, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                    >
                      {chain}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {/* Meta Details */}
          <div className="grid grid-cols-2 gap-3 text-zinc-600 dark:text-zinc-400">
            {exercise.equipment && exercise.equipment.length > 0 && (
              <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-900">
                <span className="block text-[10px] font-bold text-zinc-400 uppercase">
                  Оборудване
                </span>
                <span className="mt-0.5 block font-medium text-zinc-800 dark:text-zinc-200">
                  {exercise.equipment.join(", ")}
                </span>
              </div>
            )}
            {exercise.location && exercise.location.length > 0 && (
              <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-900">
                <span className="block text-[10px] font-bold text-zinc-400 uppercase">
                  Локация
                </span>
                <span className="mt-0.5 flex items-center gap-1 font-medium text-zinc-800 dark:text-zinc-200">
                  <MapPin size={12} />
                  {getLocationLabel(exercise.location)}
                </span>
              </div>
            )}
          </div>

          {/* Video Demonstration Link */}
          {exercise.videoUrl && (
            <div className="pt-1">
              <a
                href={exercise.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                <span>Виж видео демонстрация на упражнението</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button
            onClick={onClose}
            variant="outline"
            className="rounded-xl text-xs"
          >
            Затвори
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
