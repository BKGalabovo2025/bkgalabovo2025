"use client";

import React from "react";

import AnnualReport from "@/components/reports/annual-report";
import { BentoCard } from "@/components/ui/bento-card";

import { useReportsContext } from "../ReportsContext";

export function AnnualSectionView() {
  const { activeBranch } = useReportsContext();

  return (
    <BentoCard className="overflow-hidden border border-zinc-200/80 bg-white p-3.5 sm:p-5 shadow-xs rounded-2xl dark:border-zinc-800 dark:bg-zinc-950">
      <AnnualReport siteId={activeBranch || "bkgalabovo"} />
    </BentoCard>
  );
}
