"use client";

import { SharedEventHistory } from "@/components/shared/sales/SharedEventHistory";
import { useTrainingServices } from "@/hooks/useTrainingServices";

export function TrainingHistory() {
  const { events, isLoading } = useTrainingServices();

  return (
    <SharedEventHistory
      events={events}
      isLoading={isLoading}
      description="Проследяване на всички движения и продажби на тренировки."
    />
  );
}
