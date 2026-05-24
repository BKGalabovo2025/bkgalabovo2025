"use client";

import { formatPrice } from "@/lib/currency";
import { BentoCard } from "@/components/ui/bento-card";
import { TrendingUp, CreditCard, CircleDollarSign } from "lucide-react";

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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. Бързи финансови карти */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BentoCard className="p-8 bg-white border border-zinc-100 shadow-none rounded-4xl flex flex-col justify-between h-44 hover:shadow-xl hover:shadow-zinc-100 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-emerald-50 rounded-2xl">
              <CircleDollarSign
                className="h-6 w-6 text-emerald-600"
                strokeWidth={1.5}
              />
            </div>
            <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full">
              <TrendingUp className="h-3 w-3" /> +30 дни
            </div>
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] font-medium">
              Общ приход
            </p>
            <p className="text-3xl font-light tracking-tighter text-zinc-950 mt-1">
              {formatPrice(totalRevenue)}
            </p>
          </div>
        </BentoCard>

        <BentoCard className="p-8 bg-white border border-zinc-100 shadow-none rounded-4xl flex flex-col justify-between h-44 hover:shadow-xl hover:shadow-zinc-100 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-indigo-50 rounded-2xl">
              <CreditCard
                className="h-6 w-6 text-indigo-600"
                strokeWidth={1.5}
              />
            </div>
            <div className="text-indigo-600 text-[10px] font-bold uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-full">
              Реални плащания
            </div>
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] font-medium">
              Брой транзакции
            </p>
            <p className="text-3xl font-light tracking-tighter text-zinc-950 mt-1">
              {transactionCount}{" "}
              <span className="text-sm font-normal text-zinc-400">платени</span>
            </p>
          </div>
        </BentoCard>

        <BentoCard className="p-8 bg-white border border-zinc-100 shadow-none rounded-4xl flex flex-col justify-between h-44 hover:shadow-xl hover:shadow-zinc-100 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-amber-50 rounded-2xl">
              <TrendingUp
                className="h-6 w-6 text-amber-600"
                strokeWidth={1.5}
              />
            </div>
            <div className="text-amber-600 text-[10px] font-bold uppercase tracking-wider bg-amber-50 px-2.5 py-1 rounded-full">
              Средно на чек
            </div>
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] font-medium">
              Средна стойност
            </p>
            <p className="text-3xl font-light tracking-tighter text-zinc-950 mt-1">
              {formatPrice(averageTransactionValue)}
            </p>
          </div>
        </BentoCard>
      </div>
    </div>
  );
}
