"use client";

import { Activity, Plus, Tag, Wrench } from "lucide-react";
import Link from "next/link";
import React, { useMemo } from "react";

import { GeneralServiceList } from "@/components/finances/GeneralServiceList";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { useGeneralServices } from "@/hooks/useGeneralServices";
import { formatPrice } from "@/lib/currency";

export function ClubServicesCatalogView() {
  const { services } = useGeneralServices();

  const kpiStats = useMemo(() => {
    const total = services.length;
    const active = services.filter((s) => s.price >= 0).length;
    const prices = services
      .map((s) => Number(s.price) || 0)
      .filter((p) => p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const avgPrice =
      prices.length > 0
        ? prices.reduce((acc, p) => acc + p, 0) / prices.length
        : 0;
    return { total, active, minPrice, avgPrice };
  }, [services]);

  return (
    <div className="space-y-6">
      {/* Compact KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <BentoCard className="flex items-center justify-between rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950">
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase text-zinc-400">
              Общо позиции
            </p>
            <p className="mt-0.5 text-lg font-bold text-zinc-900 dark:text-white">
              {kpiStats.total}
            </p>
          </div>
          <div className="rounded-xl bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
            <Wrench className="size-4" />
          </div>
        </BentoCard>

        <BentoCard className="flex items-center justify-between rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950">
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase text-zinc-400">
              Активни
            </p>
            <p className="mt-0.5 text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {kpiStats.active}
            </p>
          </div>
          <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
            <Activity className="size-4" />
          </div>
        </BentoCard>

        <BentoCard className="col-span-2 flex items-center justify-between rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-2xs sm:col-span-1 dark:border-zinc-800 dark:bg-zinc-950">
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase text-zinc-400">
              Мин / Средна цена
            </p>
            <p className="mt-0.5 text-sm font-bold text-zinc-900 dark:text-white">
              {formatPrice(kpiStats.minPrice)} /{" "}
              {formatPrice(kpiStats.avgPrice)}
            </p>
          </div>
          <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
            <Tag className="size-4" />
          </div>
        </BentoCard>
      </div>

      {/* Top Header / Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
            Клубни услуги &amp; Наеми
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Каталог на допълнителни клубни услуги — шкафчета, наем на ракети,
            наплитане и консумативи.
          </p>
        </div>

        <Button
          size="sm"
          asChild
          className="h-9 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-xs hover:bg-blue-500 shrink-0"
        >
          <Link href="/catalogs/club-services/new">
            <Plus className="mr-1.5 size-4" />
            <span>Добави клубна услуга</span>
          </Link>
        </Button>
      </div>

      {/* Services List with search, edit, sale and delete actions */}
      <GeneralServiceList />
    </div>
  );
}
