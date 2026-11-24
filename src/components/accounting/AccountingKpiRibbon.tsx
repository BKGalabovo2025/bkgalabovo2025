"use client";

import { Bed, Calculator, Car, Pizza, Ticket } from "lucide-react";
import React from "react";

import { BentoCard } from "@/components/ui/bento-card";
import { convertEurToBgn } from "@/types/business-trip.types";

export interface AccountingKpiData {
  totalEur: number;
  totalBgn: number;
  totalFuelAndTransport: number;
  totalKM: number;
  totalAccommodation: number;
  totalPerDiem: number;
  totalEntryFees: number;
}

export function AccountingKpiRibbon({ kpis }: { kpis: AccountingKpiData }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      <BentoCard className="col-span-2 flex flex-col justify-between rounded-xl border border-blue-200/70 bg-linear-to-br from-blue-50/70 to-indigo-50/40 p-2.5 shadow-none dark:border-blue-900/40 dark:from-blue-950/20 dark:to-indigo-950/20 sm:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-blue-700 dark:text-blue-300">
            Общо Разходи
          </span>
          <div className="rounded-md bg-blue-100 p-1 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
            <Calculator className="size-3.5" />
          </div>
        </div>
        <div className="mt-1">
          <p className="text-base font-bold tracking-tight text-blue-950 dark:text-blue-100">
            €{kpis.totalEur.toFixed(2)}
          </p>
          <p className="text-[10px] font-medium text-blue-600/90 dark:text-blue-400">
            {kpis.totalBgn.toFixed(2)} лв.
          </p>
        </div>
      </BentoCard>

      <BentoCard className="flex flex-col justify-between rounded-xl border border-orange-200/70 bg-white p-2.5 shadow-none dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            Транспорт &amp; Гориво
          </span>
          <div className="rounded-md bg-orange-100 p-1 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300">
            <Car className="size-3.5" />
          </div>
        </div>
        <div className="mt-1">
          <p className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
            €{kpis.totalFuelAndTransport.toFixed(2)}
          </p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
            {convertEurToBgn(kpis.totalFuelAndTransport).toFixed(2)} лв. ·{" "}
            <span className="text-orange-600 dark:text-orange-400">
              {kpis.totalKM} км пробег
            </span>
          </p>
        </div>
      </BentoCard>

      <BentoCard className="flex flex-col justify-between rounded-xl border border-purple-200/70 bg-white p-2.5 shadow-none dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            Нощувки
          </span>
          <div className="rounded-md bg-purple-100 p-1 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
            <Bed className="size-3.5" />
          </div>
        </div>
        <div className="mt-1">
          <p className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
            €{kpis.totalAccommodation.toFixed(2)}
          </p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
            {convertEurToBgn(kpis.totalAccommodation).toFixed(2)} лв.
          </p>
        </div>
      </BentoCard>

      <BentoCard className="flex flex-col justify-between rounded-xl border border-emerald-200/70 bg-white p-2.5 shadow-none dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            Дневни &amp; Храна
          </span>
          <div className="rounded-md bg-emerald-100 p-1 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
            <Pizza className="size-3.5" />
          </div>
        </div>
        <div className="mt-1">
          <p className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
            €{kpis.totalPerDiem.toFixed(2)}
          </p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
            {convertEurToBgn(kpis.totalPerDiem).toFixed(2)} лв.
          </p>
        </div>
      </BentoCard>

      <BentoCard className="flex flex-col justify-between rounded-xl border border-pink-200/70 bg-white p-2.5 shadow-none dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            Такси турнир
          </span>
          <div className="rounded-md bg-pink-100 p-1 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300">
            <Ticket className="size-3.5" />
          </div>
        </div>
        <div className="mt-1">
          <p className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
            €{kpis.totalEntryFees.toFixed(2)}
          </p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
            {convertEurToBgn(kpis.totalEntryFees).toFixed(2)} лв.
          </p>
        </div>
      </BentoCard>
    </div>
  );
}
