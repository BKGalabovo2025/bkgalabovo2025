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
  Trophy,
} from "lucide-react";
import { formatPrice } from "@/lib/currency";
import { RemindersCard } from "@/components/reminders/reminders-card";
import { AssistantPanel } from "@/components/dashboard/assistant-panel";
import { Sale } from "@/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ReactNode, cloneElement, isValidElement } from "react";

const DashboardPage = () => {
  const { stats, allMembers, recentSales, reminders, loading, error } =
    useDashboardData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">
          Зареждане на таблото...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-destructive">
        <AlertCircle className="h-12 w-12 mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          Грешка при зареждане на таблото
        </h2>
        <p>{String(error)}</p>
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
      description: String(firstItem.name || "Неизвестна продажба"),
    };
  };

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold font-heading tracking-tight text-slate-900">
          Табло за управление
        </h1>
        <p className="text-slate-500 text-sm">
          Добре дошли в административния панел на Бадминтон клуб Гълъбово.
        </p>
      </header>

      <AssistantPanel />

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Row 1: Quick Stats */}
        <div className="md:col-span-12 lg:col-span-3">
          <StatCard
            title="Приходи (30 дни)"
            value={formatPrice(stats.revenueLast30Days || 0)}
            icon={TrendingUp}
            change={stats.revenueChange}
            color="blue"
          />
        </div>
        <div className="md:col-span-12 lg:col-span-3">
          <StatCard
            title="Активни членове"
            value={String(stats.activeMembersCount)}
            icon={Users}
            color="emerald"
          />
        </div>
        <div className="md:col-span-12 lg:col-span-3">
          <StatCard
            title="Нови членове"
            value={String(stats.newMembersLast30Days)}
            icon={Trophy}
            change={stats.newMembersChange}
            color="amber"
          />
        </div>
        <div className="md:col-span-12 lg:col-span-3">
          <StatCard
            title="Продажби"
            value={String(stats.salesLast30Days || 0)}
            icon={BarChart}
            change={stats.salesChange}
            color="purple"
          />
        </div>

        {/* Row 2: Recent Sales & Reminders */}
        <div className="md:col-span-12 lg:col-span-8">
          <Card className="h-full shadow-sm border-slate-100 overflow-hidden">
            <CardHeader className="border-b bg-slate-50/50 py-4 px-6">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-slate-400" />
                Последни продажби
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {recentSales.length > 0 ? (
                  recentSales.map((sale) => {
                    const member = sale.memberId
                      ? allMembers.find((m) => m.id === sale.memberId)
                      : null;
                    const memberName = member
                      ? `${member.firstName} ${member.lastName}`.trim()
                      : "Продажба в брой";
                    const saleDetails = getSaleDetails(sale);

                    return (
                      <div
                        key={sale.id}
                        className="flex items-center gap-4 p-4 hover:bg-slate-50/50 transition-colors"
                      >
                        <div
                          className={cn(
                            "h-10 w-10 flex items-center justify-center rounded-xl",
                            saleDetails.type === "inventory"
                              ? "bg-amber-100"
                              : "bg-blue-100"
                          )}
                        >
                          {saleDetails.type === "inventory" ? (
                            <Package
                              className={cn("h-5 w-5", "text-amber-600")}
                            />
                          ) : (
                            <CreditCard
                              className={cn("h-5 w-5", "text-blue-600")}
                            />
                          )}
                        </div>
                        <div className="grid gap-0.5 grow">
                          <p className="text-sm font-semibold text-slate-900">
                            {String(memberName)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {String(saleDetails.description)}
                          </p>
                        </div>
                        <div className="ml-auto text-right">
                          <div className="text-sm font-bold text-slate-900">
                            {formatPrice(sale.totalAmount)}
                          </div>
                          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                            {format(new Date(sale.saleDate), "dd MMM")}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <BarChart className="h-12 w-12 mb-2 opacity-20" />
                    <p className="text-sm">Няма скорошни продажби</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-12 lg:col-span-4">
          <RemindersCard
            reminders={reminders}
            className="shadow-sm border-slate-100 h-full"
          />
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  icon: any; // Type as any to allow LucideIcon component reference
  change?: number;
  color?: "blue" | "emerald" | "amber" | "purple";
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  change,
  color = "blue",
}: StatCardProps) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  };

  const changeColor =
    change && change > 0
      ? "text-emerald-600 bg-emerald-50"
      : change && change < 0
        ? "text-rose-600 bg-rose-50"
        : "text-slate-500 bg-slate-50";

  return (
    <Card className="shadow-sm border-slate-100 overflow-hidden group hover:border-primary/20 transition-all duration-300 h-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div
            className={cn(
              "p-2.5 rounded-xl transition-transform group-hover:scale-110 duration-300",
              colorClasses[color]
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          {change !== undefined && (
            <div
              className={cn(
                "text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
                changeColor
              )}
            >
              {change > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {String(title)}
          </p>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {String(value)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardPage;
