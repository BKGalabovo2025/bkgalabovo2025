"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
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

// Персонализиран красив Тултип за графиките
const CustomAreaTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-950/90 text-white p-4 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md">
        <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-1">
          {payload[0].payload.date}
        </p>
        <p className="text-sm font-light text-zinc-100">
          Приход:{" "}
          <span className="font-bold text-emerald-400">
            {formatPrice(payload[0].value)}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-950/90 text-white p-4 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md">
        <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-1">
          {payload[0].name}
        </p>
        <p className="text-sm font-light text-zinc-100">
          Общо:{" "}
          <span
            className="font-bold"
            style={{ color: payload[0].payload.color || payload[0].color }}
          >
            {formatPrice(payload[0].value)}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export default function FinancesDashboardCharts({
  data,
}: FinancesDashboardChartsProps) {
  const {
    dailyTrend,
    categories,
    totalRevenue,
    transactionCount,
    averageTransactionValue,
  } = data;

  const totalCategoryVal = useMemo(() => {
    return categories.reduce((sum, item) => sum + item.value, 0);
  }, [categories]);

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

      {/* 2. Интерактивни финансови графики */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Дневен тренд - Area Chart */}
        <BentoCard className="lg:col-span-2 p-8 bg-white border border-zinc-100 shadow-none rounded-5xl flex flex-col justify-between hover:shadow-xl hover:shadow-zinc-100 transition-all duration-300">
          <div>
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-lg font-medium text-zinc-900 uppercase tracking-wider">
                  Дневен Тренд на Приходите
                </h3>
                <p className="text-xs text-zinc-400 font-light mt-1">
                  Дневни постъпления от всички завършени транзакции за
                  последните 30 дни.
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dailyTrend}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop
                        offset="95%"
                        stopColor="#10b981"
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#a1a1aa", fontSize: 10 }}
                    dy={10}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#a1a1aa", fontSize: 10 }}
                    dx={-10}
                  />
                  <Tooltip content={<CustomAreaTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </BentoCard>

        {/* Разпределение - Pie/Donut Chart */}
        <BentoCard className="p-8 bg-white border border-zinc-100 shadow-none rounded-5xl flex flex-col justify-between hover:shadow-xl hover:shadow-zinc-100 transition-all duration-300">
          <div>
            <h3 className="text-lg font-medium text-zinc-900 uppercase tracking-wider mb-2">
              Разпределение по Категории
            </h3>
            <p className="text-xs text-zinc-400 font-light mb-8">
              Приходи, разпределени по пера на дейност.
            </p>

            <div className="h-56 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Текст в центъра на Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest">
                  Общо
                </span>
                <span className="text-xl font-bold tracking-tight text-zinc-950 mt-1">
                  {formatPrice(totalRevenue)}
                </span>
              </div>
            </div>

            {/* Легенда */}
            <div className="mt-6 space-y-2">
              {categories.map((category) => {
                const percentage =
                  totalCategoryVal > 0
                    ? Math.round((category.value / totalCategoryVal) * 100)
                    : 0;

                return (
                  <div
                    key={category.name}
                    className="flex justify-between items-center text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-zinc-600 font-medium">
                        {category.name}
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-zinc-400">{percentage}%</span>
                      <span className="font-semibold text-zinc-900">
                        {formatPrice(category.value)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </BentoCard>
      </div>
    </div>
  );
}
