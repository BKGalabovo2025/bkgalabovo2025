"use client";

import { Calculator } from "lucide-react";
import Link from "next/link";
import React from "react";

import FinancialReport from "@/components/reports/financial-report";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";

import { useReportsContext } from "../ReportsContext";

export function FinancialSectionView() {
  const { initialFinancialData } = useReportsContext();

  return (
    <BentoCard className="overflow-hidden border border-zinc-200/80 bg-white p-3.5 sm:p-5 shadow-xs rounded-2xl dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-4 flex items-center justify-end border-b border-zinc-100 pb-3 dark:border-zinc-800/80">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-8 rounded-lg px-3 text-xs font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <Link href="/accounting">
            <Calculator className="mr-1.5 size-3.5" strokeWidth={1.5} />
            Преглед на разходите за командировки в Счетоводство
          </Link>
        </Button>
      </div>
      <FinancialReport initialData={initialFinancialData} />
    </BentoCard>
  );
}
