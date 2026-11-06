"use client";

import React from "react";

import LiabilitiesReport from "@/components/reports/liabilities-report";
import { BentoCard } from "@/components/ui/bento-card";

import { useReportsContext } from "../ReportsContext";

export function LiabilitiesSectionView() {
  const { initialLiabilities, initialLiabilitiesPeriod } = useReportsContext();

  return (
    <BentoCard className="overflow-hidden border border-zinc-200/80 bg-white p-3.5 sm:p-5 shadow-xs rounded-2xl dark:border-zinc-800 dark:bg-zinc-950">
      <LiabilitiesReport
        initialUnpaidMembers={initialLiabilities}
        initialYear={initialLiabilitiesPeriod.year}
        initialMonth={initialLiabilitiesPeriod.month}
      />
    </BentoCard>
  );
}
