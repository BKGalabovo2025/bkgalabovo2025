"use client";

import { Download, Dumbbell, Home, Loader2, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  exerciseMatchesSection,
  type ExerciseSectionId,
  getExerciseSectionHref,
} from "@/components/training/exercises/exercise-sections";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INITIAL_BWF_EXERCISES } from "@/lib/badminton-exercises";
import { plannerService } from "@/services/planner-service";
import { useAppStore } from "@/store/use-app-store";
import { Exercise } from "@/types/planner.types";

import ExerciseFormDialog from "./exercise-form-dialog";

export default function ExercisesClient({
  section = "all",
}: {
  section?: ExerciseSectionId;
}) {
  const { activeBranch } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const exerciseParam =
    searchParams.get("exercise") ?? searchParams.get("edit");
  const isNewParam = searchParams.get("new") === "true";
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInjecting, setIsInjecting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [ageGroupFilter, setAgeGroupFilter] = useState("all");

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

  const selectedExercise = exerciseParam
    ? (exercises.find((e) => e.id === exerciseParam) ?? null)
    : null;
  const isDialogOpen =
    isNewParam || (Boolean(exerciseParam) && selectedExercise !== null);

  const closeDialog = () => router.replace(pathname, { scroll: false });

  const handleSaveSuccess = () => {
    closeDialog();
    loadExercises();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const sectionExercises = exercises.filter((ex) =>
    exerciseMatchesSection(ex, section)
  );

  const filteredExercises = sectionExercises.filter((ex) => {
    // 1. Age group filter
    if (ageGroupFilter !== "all" && !ex.ageGroups.includes(ageGroupFilter))
      return false;

    // 2. Category filter
    if (categoryFilter === "beach" && !ex.location?.includes("beach"))
      return false;
    if (
      categoryFilter === "circuit" &&
      !ex.name.toLowerCase().includes("станция")
    )
      return false;
    if (
      categoryFilter === "tactical" &&
      ex.category !== "tactics" &&
      !ex.name.toLowerCase().includes("мулти-шатъл")
    )
      return false;
    if (
      categoryFilter !== "all" &&
      !["beach", "circuit", "tactical"].includes(categoryFilter) &&
      ex.category !== categoryFilter
    )
      return false;

    // 3. Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = ex.name.toLowerCase().includes(q);
      const matchDesc = ex.description?.toLowerCase().includes(q);
      const matchTags = ex.focusTags?.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchTags) return false;
    }

    return true;
  });

  const getCategoryCount = (cat: string) => {
    if (cat === "all") return exercises.length;
    if (cat === "beach")
      return exercises.filter((ex) => ex.location?.includes("beach")).length;
    if (cat === "circuit")
      return exercises.filter((ex) => ex.name.toLowerCase().includes("станция"))
        .length;
    if (cat === "tactical")
      return exercises.filter(
        (ex) =>
          ex.category === "tactics" ||
          ex.name.toLowerCase().includes("мулти-шатъл")
      ).length;
    return exercises.filter((ex) => ex.category === cat).length;
  };

  const getAgeGroupCount = (ag: string) => {
    if (ag === "all") return exercises.length;
    return exercises.filter((ex) => ex.ageGroups.includes(ag)).length;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="font-medium text-zinc-500 dark:text-zinc-400">
          Показани: {filteredExercises.length}
          {filteredExercises.length !== exercises.length
            ? ` от общо ${exercises.length}`
            : ""}
        </p>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {exercises.length === 0 && (
            <Button
              onClick={handleInject}
              disabled={isInjecting}
              variant="outline"
              className="w-full sm:w-auto rounded-xl border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-300"
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
              className="w-full sm:w-auto rounded-xl border-amber-200 bg-amber-50 font-bold text-amber-700 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300"
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
            asChild
            className="w-full sm:w-auto rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            <Link href={`${getExerciseSectionHref(section)}?new=true`}>
              <Plus className="mr-2 size-4" />
              Добави упражнение
            </Link>
          </Button>
        </div>
      </div>

      {exercises.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            placeholder="Търсене по име или етикет..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
              <SelectValue placeholder="Всички категории" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                Всички категории ({getCategoryCount("all")})
              </SelectItem>
              <SelectItem value="warmup">
                Загрявка ({getCategoryCount("warmup")})
              </SelectItem>
              <SelectItem value="technique">
                Техника ({getCategoryCount("technique")})
              </SelectItem>
              <SelectItem value="tactics">
                Тактика ({getCategoryCount("tactics")})
              </SelectItem>
              <SelectItem value="physical">
                Физически ({getCategoryCount("physical")})
              </SelectItem>
              <SelectItem value="games">
                Игри и Забава ({getCategoryCount("games")})
              </SelectItem>
              <SelectItem value="cooldown">
                Разпускане ({getCategoryCount("cooldown")})
              </SelectItem>
              <SelectItem value="beach">
                Плажни Блокове (Лагер) ({getCategoryCount("beach")})
              </SelectItem>
              <SelectItem value="circuit">
                Станционни Ротации (Лагер) ({getCategoryCount("circuit")})
              </SelectItem>
              <SelectItem value="tactical">
                Мулти-Шатъл (Лагер) ({getCategoryCount("tactical")})
              </SelectItem>
            </SelectContent>
          </Select>
          <Select value={ageGroupFilter} onValueChange={setAgeGroupFilter}>
            <SelectTrigger className="dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
              <SelectValue placeholder="Всички възрасти" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                Всички възрасти ({getAgeGroupCount("all")})
              </SelectItem>
              <SelectItem value="U9">U9 ({getAgeGroupCount("U9")})</SelectItem>
              <SelectItem value="U11">
                U11 ({getAgeGroupCount("U11")})
              </SelectItem>
              <SelectItem value="U13">
                U13 ({getAgeGroupCount("U13")})
              </SelectItem>
              <SelectItem value="U15">
                U15 ({getAgeGroupCount("U15")})
              </SelectItem>
              <SelectItem value="U17">
                U17 ({getAgeGroupCount("U17")})
              </SelectItem>
              <SelectItem value="U19">
                U19 ({getAgeGroupCount("U19")})
              </SelectItem>
              <SelectItem value="Мъже и Жени">
                Мъже и Жени ({getAgeGroupCount("Мъже и Жени")})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {exercises.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 py-20 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
          <Dumbbell className="mx-auto mb-4 size-12 text-zinc-300 dark:text-zinc-700" />
          <h3 className="mb-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Базата е празна
          </h3>
          <p className="mx-auto mb-6 max-w-md text-zinc-500 dark:text-zinc-400">
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
          {filteredExercises.map((ex) => (
            <Link
              key={ex.id}
              id={`exercise-${ex.id}`}
              href={`${getExerciseSectionHref(section)}?exercise=${ex.id}`}
              className="block rounded-xl focus-visible:outline-2 focus-visible:outline-indigo-500"
            >
              <Card className="h-full cursor-pointer transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-bold tracking-wider uppercase"
                    >
                      {(() => {
                        switch (ex.category) {
                          case "physical":
                            return "Физическо";
                          case "technique":
                            return "Техника";
                          case "tactics":
                            return "Тактика";
                          case "games":
                            return "Игри";
                          case "warmup":
                            return "Загрявка";
                          case "cooldown":
                            return "Разпускане";
                          default:
                            return ex.category;
                        }
                      })()}
                    </Badge>
                    <span className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-400 dark:bg-zinc-800 dark:text-zinc-400">
                      {ex.durationMinutes} мин
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg leading-tight font-bold text-zinc-900 dark:text-zinc-100">
                    {ex.name}
                  </h3>
                  <p className="mb-4 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {ex.description}
                  </p>
                  {ex.coachingPoints && ex.coachingPoints.length > 0 && (
                    <div className="mb-4 line-clamp-2 rounded-lg border border-amber-100 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                      <span className="font-bold">Насоки:</span>{" "}
                      {ex.coachingPoints[0]}
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    <div className="flex items-center gap-1">
                      <MapPin className="size-3" />
                      {(() => {
                        if (ex.location.includes("beach")) return "Плаж";
                        if (ex.location.includes("stadium")) return "Стадион";
                        return "В зала";
                      })()}
                    </div>
                    {ex.isHomeFriendly && (
                      <div
                        className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"
                        title="Подходящо за дома"
                      >
                        <Home className="size-3" />
                        <span>Вкъщи</span>
                      </div>
                    )}
                  </div>
                  {ex.targetKineticChain &&
                    ex.targetKineticChain.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-1">
                        {ex.targetKineticChain.map((chain) => (
                          <span
                            key={chain}
                            className="rounded-sm bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-indigo-600 uppercase dark:bg-indigo-950/50 dark:text-indigo-300"
                          >
                            {chain}
                          </span>
                        ))}
                      </div>
                    )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <ExerciseFormDialog
        exercise={selectedExercise}
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        onSaveSuccess={handleSaveSuccess}
      />
    </div>
  );
}
