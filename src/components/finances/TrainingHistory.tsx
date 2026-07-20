"use client";

import { useTrainingServices } from "@/hooks/useTrainingServices";
import { SharedEventHistory } from "@/components/shared/sales/SharedEventHistory";

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
