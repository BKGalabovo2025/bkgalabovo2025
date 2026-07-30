"use client";

import { SharedEventHistory } from "@/components/shared/sales/SharedEventHistory";
import { useGeneralServices } from "@/hooks/useGeneralServices";

export function GeneralServiceHistory() {
  const { events, isLoading } = useGeneralServices();

  return (
    <SharedEventHistory
      events={events}
      isLoading={isLoading}
      description="Проследяване на всички движения и промени по услугите."
      showExtendedColumns={true}
    />
  );
}
