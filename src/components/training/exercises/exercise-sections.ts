import { Dumbbell, Flame, Layers, Tent } from "lucide-react";

import type { Exercise } from "@/types/planner.types";

export type ExerciseSectionId = "all" | "court" | "physical" | "camp";

export interface ExerciseSectionConfig {
  id: ExerciseSectionId;
  label: string;
  /** Празен низ = индексна секция (/training/exercises). */
  pathSuffix: string;
  tooltip: string;
  description: string;
  icon: typeof Dumbbell;
}

export const EXERCISE_SECTIONS: readonly ExerciseSectionConfig[] = [
  {
    id: "all",
    label: "Всички",
    pathSuffix: "",
    tooltip: "Цялата база с упражнения",
    description: "Официални упражнения на BWF и собствени методики.",
    icon: Layers,
  },
  {
    id: "court",
    label: "В зала",
    pathSuffix: "court",
    tooltip: "Загрявка, техника, тактика, игри и разпускане",
    description: "Упражнения за тренировка в залата: техника, тактика, игри.",
    icon: Dumbbell,
  },
  {
    id: "physical",
    label: "Физическа подготовка",
    pathSuffix: "physical",
    tooltip: "Силови, скоростни и кондиционни упражнения",
    description: "Физическа подготовка: сила, скорост, издръжливост.",
    icon: Flame,
  },
  {
    id: "camp",
    label: "Лагер",
    pathSuffix: "camp",
    tooltip: "Плажни блокове, станционни ротации и мулти-шатъл",
    description: "Упражнения за лагери: плаж, станции и мулти-шатъл.",
    icon: Tent,
  },
] as const;

export function getExerciseSectionHref(id: ExerciseSectionId): string {
  const section = EXERCISE_SECTIONS.find((s) => s.id === id);
  return section?.pathSuffix
    ? `/training/exercises/${section.pathSuffix}`
    : "/training/exercises";
}

export function getActiveExerciseSectionId(
  pathname: string
): ExerciseSectionId | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/training/exercises") return "all";
  if (!normalized.startsWith("/training/exercises/")) return null;
  const segment = normalized.slice("/training/exercises/".length).split("/")[0];
  const match = EXERCISE_SECTIONS.find((s) => s.pathSuffix === segment);
  return match ? match.id : null;
}

export function isCampExercise(
  ex: Pick<Exercise, "name" | "category" | "location">
) {
  const name = ex.name.toLowerCase();
  return (
    Boolean(ex.location?.includes("beach")) ||
    name.includes("станция") ||
    name.includes("мулти-шатъл")
  );
}

export function exerciseMatchesSection(
  ex: Pick<Exercise, "name" | "category" | "location">,
  section: ExerciseSectionId
): boolean {
  switch (section) {
    case "all":
      return true;
    case "camp":
      return isCampExercise(ex);
    case "physical":
      return ex.category === "physical" && !isCampExercise(ex);
    case "court":
      return ex.category !== "physical" && !isCampExercise(ex);
  }
}
