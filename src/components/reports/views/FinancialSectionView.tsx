"use client";

import React from "react";

import FinancialReport from "@/components/reports/financial-report";
import { BentoCard } from "@/components/ui/bento-card";

import { useReportsContext } from "../ReportsContext";

export function FinancialSectionView() {
  const { initialFinancialData } = useReportsContext();

  return (
    <BentoCard className="overflow-hidden border border-zinc-200/80 bg-white p-3.5 sm:p-5 shadow-xs rounded-2xl dark:border-zinc-800 dark:bg-zinc-950">
      <FinancialReport initialData={initialFinancialData} />
    </BentoCard>
  );
}
