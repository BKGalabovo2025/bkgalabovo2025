"use client";

import { useReportsContext } from "@/components/reports/ReportsContext";
import RestockReport from "@/components/reports/restock-report";
import { BentoCard } from "@/components/ui/bento-card";

export function RestockSectionView() {
  const { initialRestockProducts } = useReportsContext();

  return (
    <BentoCard className="overflow-hidden border border-zinc-200/80 bg-white p-3.5 sm:p-5 shadow-xs rounded-2xl dark:border-zinc-800 dark:bg-zinc-950">
      <RestockReport initialProducts={initialRestockProducts} />
    </BentoCard>
  );
}
