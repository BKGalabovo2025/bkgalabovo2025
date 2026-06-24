"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/store/use-app-store";
import { plannerService } from "@/services/planner-service";
import { Exercise } from "@/types/planner.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Dumbbell, MapPin, Download, Loader2 } from "lucide-react";
import ExerciseFormDialog from "./exercise-form-dialog";
import { INITIAL_BWF_EXERCISES } from "@/lib/badminton-exercises";
import { toast } from "sonner";

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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-950 flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-indigo-600" />
            База с Упражнения
          </h1>
          <p className="text-zinc-500 font-medium mt-1">
            Официални упражнения и твои собствени методики
          </p>
        </div>
        <div className="flex items-center gap-2">
          {exercises.length === 0 && (
            <Button
              onClick={handleInject}
              disabled={isInjecting}
              variant="outline"
              className="rounded-xl border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
            >
              {isInjecting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Инжектирай BWF База
            </Button>
          )}
          {exercises.length > 0 && missingCount > 0 && (
            <Button
              onClick={handleInject}
              disabled={isInjecting}
              variant="outline"
              className="rounded-xl border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 font-bold"
            >
              {isInjecting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Нови упражнения (+{missingCount})
            </Button>
          )}
          <Button
            onClick={handleAdd}
            className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Добави упражнение
          </Button>
        </div>
      </div>

      {exercises.length === 0 ? (
        <div className="text-center py-20 bg-zinc-50 rounded-2xl border border-zinc-200 border-dashed">
          <Dumbbell className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-zinc-900 mb-2">
            Базата е празна
          </h3>
          <p className="text-zinc-500 max-w-md mx-auto mb-6">
            Можеш да започнеш от нулата или да инжектираш стартовия пакет с
            официални упражнения на Световната федерация по бадминтон.
          </p>
          <Button
            onClick={handleInject}
            disabled={isInjecting}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isInjecting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Инжектирай стартов пакет
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((ex) => (
            <Card
              key={ex.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleEdit(ex)}
            >
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <Badge
                    variant="secondary"
                    className="uppercase text-[10px] tracking-wider font-bold"
                  >
                    {ex.category}
                  </Badge>
                  <span className="text-[10px] text-zinc-400 font-medium bg-zinc-100 px-2 py-0.5 rounded">
                    {ex.durationMinutes} мин
                  </span>
                </div>
                <h3 className="font-bold text-zinc-900 text-lg leading-tight mb-2">
                  {ex.name}
                </h3>
                <p className="text-sm text-zinc-600 line-clamp-2 mb-4">
                  {ex.description}
                </p>
                <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
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
