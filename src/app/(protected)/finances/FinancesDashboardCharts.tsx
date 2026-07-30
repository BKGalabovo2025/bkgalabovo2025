"use client";

import { CircleDollarSign, CreditCard, TrendingUp } from "lucide-react";

import { BentoCard } from "@/components/ui/bento-card";
import { formatPrice } from "@/lib/currency";

interface DailyRevenueTrend {
  date: string;
  amount: number;
}

interface CategoryRevenue {
  name: string;
  value: number;
  color: string;
}

interface FinancesDashboardChartsProps {
  data: {
    dailyTrend: DailyRevenueTrend[];
    categories: CategoryRevenue[];
    totalRevenue: number;
    transactionCount: number;
    averageTransactionValue: number;
  };
}

export default function FinancesDashboardCharts({
  data,
}: FinancesDashboardChartsProps) {
  const { totalRevenue, transactionCount, averageTransactionValue } = data;

  return (
    <div className="space-y-8 duration-500 animate-in fade-in">
      {/* 1. Бързи финансови карти */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <BentoCard className="flex h-44 flex-col justify-between rounded-4xl border border-zinc-100 bg-white p-8 shadow-none transition-all duration-300 hover:shadow-xl hover:shadow-zinc-100">
          <div className="flex items-start justify-between">
            <div className="rounded-2xl bg-emerald-50 p-3">
              <CircleDollarSign
                className="size-6 text-emerald-600"
                strokeWidth={1.5}
              />
            </div>
            <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold tracking-wider text-emerald-600 uppercase">
              <TrendingUp className="size-3" /> +30 дни
            </div>
          </div>
          <div>
            <p className="text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
              Общ приход
            </p>
            <p className="mt-1 text-3xl font-light tracking-tighter text-zinc-950">
              {formatPrice(totalRevenue)}
            </p>
          </div>
        </BentoCard>

        <BentoCard className="flex h-44 flex-col justify-between rounded-4xl border border-zinc-100 bg-white p-8 shadow-none transition-all duration-300 hover:shadow-xl hover:shadow-zinc-100">
          <div className="flex items-start justify-between">
            <div className="rounded-2xl bg-indigo-50 p-3">
              <CreditCard
                className="size-6 text-indigo-600"
                strokeWidth={1.5}
              />
            </div>
            <div className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold tracking-wider text-indigo-600 uppercase">
              Реални плащания
            </div>
          </div>
          <div>
            <p className="text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
              Брой транзакции
            </p>
            <p className="mt-1 text-3xl font-light tracking-tighter text-zinc-950">
              {transactionCount}{" "}
              <span className="text-sm font-normal text-zinc-400">платени</span>
            </p>
          </div>
        </BentoCard>

        <BentoCard className="flex h-44 flex-col justify-between rounded-4xl border border-zinc-100 bg-white p-8 shadow-none transition-all duration-300 hover:shadow-xl hover:shadow-zinc-100">
          <div className="flex items-start justify-between">
            <div className="rounded-2xl bg-amber-50 p-3">
              <TrendingUp className="size-6 text-amber-600" strokeWidth={1.5} />
            </div>
            <div className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold tracking-wider text-amber-600 uppercase">
              Средно на чек
            </div>
          </div>
          <div>
            <p className="text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
              Средна стойност
            </p>
            <p className="mt-1 text-3xl font-light tracking-tighter text-zinc-950">
              {formatPrice(averageTransactionValue)}
            </p>
          </div>
        </BentoCard>
      </div>
    </div>
  );
}
