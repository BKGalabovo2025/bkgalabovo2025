"use client";

import { useRecoveryServices } from "@/hooks/useRecoveryServices";
import { SharedEventHistory } from "@/components/shared/sales/SharedEventHistory";

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
