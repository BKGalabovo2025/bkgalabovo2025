"use client";

import { SharedEventHistory } from "@/components/shared/sales/SharedEventHistory";
import { useRecoveryServices } from "@/hooks/useRecoveryServices";

export function RecoveryHistory() {
  const { events, isLoading } = useRecoveryServices();

  return (
    <SharedEventHistory
      events={events}
      isLoading={isLoading}
      description="Проследяване на всички движения и продажби на възстановяване."
    />
  );
}
