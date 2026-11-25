"use client";

import { useEffect, useState } from "react";

import { BwfTextbookView } from "@/components/training/exercises/BwfTextbookView";
import { plannerService } from "@/services/planner-service";
import { useAppStore } from "@/store/use-app-store";
import type { Exercise } from "@/types/planner.types";

export default function ExercisesTextbookPage() {
  const { activeBranch } = useAppStore();
  const [savedExercises, setSavedExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    plannerService
      .getExercises(activeBranch)
      .then(setSavedExercises)
      .catch(() => setSavedExercises([]));
  }, [activeBranch]);

  return <BwfTextbookView savedExercises={savedExercises} />;
}
