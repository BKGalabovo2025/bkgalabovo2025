"use client";

import { useDashboardData } from "@/hooks/useDashboardData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  AlertCircle,
  Users,
  BarChart,
  TrendingUp,
  TrendingDown,
  Package,
  CreditCard,
  Calendar,
} from "lucide-react";
import { formatPrice } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { RemindersCard } from "@/components/reminders/reminders-card";
import { AssistantPanel } from "@/components/dashboard/assistant-panel";
import { Sale } from "@/types";
import { format } from "date-fns";
import { bg } from "date-fns/locale";

const DashboardPage = () => {
  const { stats, allMembers, recentSales, reminders, loading, error } =
    useDashboardData();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-zinc-100 dark:border-zinc-800 animate-pulse" />
          <Loader2 className="h-16 w-16 animate-spin text-blue-600 absolute top-0 left-0" />
        </div>
        <p className="text-xl text-zinc-400 font-black font-heading mt-6 uppercase tracking-widest">
          Зареждане на системата...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] p-12 bg-white dark:bg-zinc-900 rounded-[3rem] border border-red-100 dark:border-red-900/20 shadow-2xl">
        <div className="h-20 w-20 rounded-3xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-8">
          <AlertCircle className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-3xl font-black font-heading mb-3 uppercase tracking-tight text-zinc-900 dark:text-white">
          Системна грешка
        </h2>
        <p className="font-bold text-zinc-500 max-w-md text-center">{error}</p>
      </div>
    );
  }

  if (!stats || !allMembers || !recentSales || !reminders) {
    return null;
  }

  const getSaleDetails = (sale: Sale) => {
    const firstItem = sale.items?.[0];
    const isSubscription = !!sale.subscriptionId;

    if (!firstItem) {
      return { type: "fee" as const, description: "Корекция на салдо" };
    }

    return {
      type: isSubscription ? ("fee" as const) : ("inventory" as const),
      description: firstItem.name || "Неизвестна продажба",
    };
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">
          <TrendingUp className="h-3.5 w-3.5" />
          Системно табло
        </div>
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-heading tracking-tighter text-zinc-950 dark:text-white uppercase leading-none">
            Общ преглед
          </h1>
          <p className="text-zinc-500 text-sm font-bold">
            Мониторинг на активността в <span className="text-zinc-900 dark:text-white">БК Гълъбово</span>
          </p>
        </div>
      </header>

      <div className="premium-card overflow-hidden">
        <AssistantPanel />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Приходи (30 дни)"
          value={formatPrice(stats.revenueLast30Days || 0)}
          icon={<CreditCard className="h-7 w-7" />}
          change={stats.revenueChange}
          accent="blue"
        />
        <StatCard
          title="Активни членове"
          value={stats.activeMembersCount.toString()}
          icon={<Users className="h-7 w-7" />}
          accent="zinc"
        />
        <StatCard
          title="Нови членове"
          value={stats.newMembersLast30Days.toString()}
          icon={<TrendingUp className="h-7 w-7" />}
          change={stats.newMembersChange}
          accent="blue"
        />
        <StatCard
          title="Продажби (30 дни)"
          value={(stats.salesLast30Days || 0).toString()}
          icon={<BarChart className="h-7 w-7" />}
          change={stats.salesChange}
          accent="zinc"
        />
      </div>

      <div className="grid gap-12 lg:grid-cols-2 items-start">
        <div className="premium-card p-0 overflow-hidden flex flex-col">
          <div className="px-10 py-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm border border-zinc-100 dark:border-zinc-700">
                <Package className="h-6 w-6 text-zinc-400" />
              </div>
              <div>
                <h3 className="text-xl font-black font-heading text-zinc-950 dark:text-white uppercase tracking-tight">Последни продажби</h3>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Мониторинг на транзакциите</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1">
            {recentSales.length > 0 ? (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {recentSales.map((sale) => {
                  const member = sale.memberId
                    ? allMembers.find((m) => m.id === sale.memberId)
                    : null;
                  const memberName = member
                    ? `${member.firstName} ${member.lastName}`.trim()
                    : "Продажба в брой";
                  const saleDetails = getSaleDetails(sale);

                  return (
                    <div key={sale.id} className="flex items-center gap-6 px-10 py-7 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 transition-all cursor-default group">
                      <div className={cn(
                        "h-14 w-14 flex items-center justify-center rounded-2xl shadow-sm border transition-all group-hover:scale-110",
                        saleDetails.type === "inventory" 
                          ? "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30 text-amber-600" 
                          : "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30 text-blue-600"
                      )}>
                        {saleDetails.type === "inventory" ? (
                          <Package className="h-7 w-7" />
                        ) : (
                          <CreditCard className="h-7 w-7" />
                        )}
                      </div>
                      <div className="grid gap-1.5 grow">
                        <p className="text-lg font-black font-heading text-zinc-950 dark:text-zinc-100 leading-none tracking-tight">
                          {memberName}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border",
                            saleDetails.type === "inventory"
                              ? "bg-amber-100/50 border-amber-200 text-amber-700"
                              : "bg-blue-100/50 border-blue-200 text-blue-700"
                          )}>
                            {saleDetails.type === "inventory" ? "Магазин" : "Такса"}
                          </span>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.15em]">
                            {saleDetails.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black font-heading text-zinc-950 dark:text-white leading-none mb-1">
                          {formatPrice(sale.totalAmount)}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em]">
                          {format(new Date(sale.saleDate), "dd.MM.yyyy")}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-24 px-10 text-center">
                <div className="h-20 w-20 bg-zinc-50 dark:bg-zinc-800 rounded-[2rem] flex items-center justify-center mx-auto mb-6 opacity-40">
                  <BarChart className="h-10 w-10 text-zinc-400" />
                </div>
                <h4 className="text-xl font-black font-heading text-zinc-950 dark:text-white uppercase mb-2">Няма данни</h4>
                <p className="font-bold text-zinc-500 uppercase text-xs tracking-widest">Не са открити скорошни продажби</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-12">
           <RemindersCard reminders={reminders} />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({
  title,
  value,
  icon,
  change,
  accent = "zinc"
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  change?: number;
  accent?: "blue" | "zinc";
}) => {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div className="premium-card p-8 group hover:scale-[1.02] transition-all cursor-default">
      <div className="flex items-start justify-between mb-8">
        <div className={cn(
          "h-16 w-16 rounded-[1.5rem] flex items-center justify-center shadow-sm border transition-all duration-500 group-hover:rotate-6",
          accent === "blue" 
            ? "bg-blue-600 text-white border-blue-500 shadow-blue-200 dark:shadow-none" 
            : "bg-zinc-950 text-white border-zinc-800 shadow-zinc-200 dark:shadow-none"
        )}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-black text-[10px] uppercase tracking-widest",
            isPositive ? "bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:border-emerald-900/50" : 
            isNegative ? "bg-red-50 border-red-100 text-red-600 dark:bg-red-950/30 dark:border-red-900/50" : 
            "bg-zinc-50 border-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:border-zinc-700"
          )}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : isNegative ? <TrendingDown className="h-3 w-3" /> : null}
            {isPositive ? "+" : ""}{change.toFixed(1)}%
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-2">
          {title}
        </p>
        <p className="text-4xl font-black font-heading text-zinc-950 dark:text-white tracking-tighter leading-none">
          {value}
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;
