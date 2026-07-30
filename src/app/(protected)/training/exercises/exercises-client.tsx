"use client";

import { Download, Dumbbell, Loader2, MapPin, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { INITIAL_BWF_EXERCISES } from "@/lib/badminton-exercises";
import { plannerService } from "@/services/planner-service";
import { useAppStore } from "@/store/use-app-store";
import { Exercise } from "@/types/planner.types";

import ExerciseFormDialog from "./exercise-form-dialog";

export default function ExercisesClient() {
  const { activeBranch } = useAppStore();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInjecting, setIsInjecting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null
  );

  useEffect(() => {
    loadExercises();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBranch]);

  const loadExercises = async () => {
    setIsLoading(true);
    try {
      const data = await plannerService.getExercises(activeBranch);
      setExercises(data);
    } catch (error) {
      console.error("Error loading exercises:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const missingCount = INITIAL_BWF_EXERCISES.filter(
    (seed) => !exercises.some((e) => e.name === seed.name)
  ).length;

  const handleInject = async () => {
    setIsInjecting(true);
    try {
      const added = await plannerService.injectSeedExercises(activeBranch);
      if (added > 0) {
        toast.success(`Успешно синхронизирани ${added} нови упражнения`);
      }
      await loadExercises();
    } catch (error) {
      console.error("Error injecting exercises:", error);
      toast.error("Възникна грешка при синхронизирането");
    } finally {
      setIsInjecting(false);
    }
  };

  const handleEdit = (ex: Exercise) => {
    setSelectedExercise(ex);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedExercise(null);
    setIsDialogOpen(true);
  };

  const handleSaveSuccess = () => {
    setIsDialogOpen(false);
    loadExercises();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-zinc-950 uppercase">
            <Dumbbell className="size-6 text-indigo-600" />
            База с Упражнения
          </h1>
          <p className="mt-1 font-medium text-zinc-500">
            Официални упражнения и твои собствени методики
          </p>
        </div>
        <div className="flex items-center gap-2">
          {exercises.length === 0 && (
            <Button
              onClick={handleInject}
              disabled={isInjecting}
              variant="outline"
              className="rounded-xl border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            >
              {isInjecting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Download className="mr-2 size-4" />
              )}
              Инжектирай BWF База
            </Button>
          )}
          {exercises.length > 0 && missingCount > 0 && (
            <Button
              onClick={handleInject}
              disabled={isInjecting}
              variant="outline"
              className="rounded-xl border-amber-200 bg-amber-50 font-bold text-amber-700 hover:bg-amber-100"
            >
              {isInjecting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Download className="mr-2 size-4" />
              )}
              Нови упражнения (+{missingCount})
            </Button>
          )}
          <Button
            onClick={handleAdd}
            className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-800"
          >
            <Plus className="mr-2 size-4" />
            Добави упражнение
          </Button>
        </div>
      </div>

      {exercises.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 py-20 text-center">
          <Dumbbell className="mx-auto mb-4 size-12 text-zinc-300" />
          <h3 className="mb-2 text-lg font-bold text-zinc-900">
            Базата е празна
          </h3>
          <p className="mx-auto mb-6 max-w-md text-zinc-500">
            Можеш да започнеш от нулата или да инжектираш стартовия пакет с
            официални упражнения на Световната федерация по бадминтон.
          </p>
          <Button
            onClick={handleInject}
            disabled={isInjecting}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isInjecting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Инжектирай стартов пакет
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exercises.map((ex) => (
            <Card
              key={ex.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => handleEdit(ex)}
            >
              <CardContent className="p-5">
                <div className="mb-3 flex items-start justify-between">
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-bold tracking-wider uppercase"
                  >
                    {ex.category}
                  </Badge>
                  <span className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                    {ex.durationMinutes} мин
                  </span>
                </div>
                <h3 className="mb-2 text-lg leading-tight font-bold text-zinc-900">
                  {ex.name}
                </h3>
                <p className="mb-4 line-clamp-2 text-sm text-zinc-600">
                  {ex.description}
                </p>
                <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="size-3" />
                    {(() => {
                      if (
                        ex.location.includes("indoor") &&
                        ex.location.includes("outdoor")
                      )
                        return "Навсякъде";
                      if (ex.location.includes("indoor")) return "В зала";
                      return "На открито";
                    })()}
                  </div>
                  <div>{ex.ageGroups.length} групи</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ExerciseFormDialog
        exercise={selectedExercise}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSaveSuccess={handleSaveSuccess}
      />
    </div>
  );
}
