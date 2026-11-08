"use client";

import {
  AlertCircle,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Package,
  PlusCircle,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/context/language-context";
import { formatPrice } from "@/lib/currency";
import { cn } from "@/lib/utils";

import { BirthdayReminder } from "../BirthdayReminder";
import { CourtsOccupancyCard } from "../CourtsOccupancyCard";
import { DashboardNotifications } from "../dashboard-notifications";
import {
  DashboardEvent,
  DashboardProduct,
  useDashboardContext,
} from "../DashboardContext";
import { FeedbackDashboardCard } from "../FeedbackDashboardCard";
import { InquiriesNotificationCard } from "../InquiriesNotificationCard";

export function DashboardOverviewView() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { stats, reminders, isRecoveryZone } = useDashboardContext();

  const monthlyRevenue =
    stats?.revenueCurrentMonth ?? stats?.revenueLast30Days ?? 0;

  const currentMonthName = new Date().toLocaleString(
    language === "bg" ? "bg-BG" : "en-US",
    { month: "long" }
  );

  const renderMembersContent = () => {
    if (!stats) {
      return (
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-full bg-blue-200/50 dark:bg-zinc-800" />
          <Skeleton className="h-3 w-full bg-blue-200/50 dark:bg-zinc-800" />
          <Skeleton className="h-3 w-full bg-blue-200/50 dark:bg-zinc-800" />
        </div>
      );
    }
    if (isRecoveryZone) {
      return (
        <div className="space-y-1 text-zinc-700 dark:text-zinc-300">
          <div className="flex items-center justify-between text-[11px] leading-tight">
            <span className="font-normal text-zinc-600 dark:text-zinc-400">
              Клиенти за възстановяване:
            </span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400">
              {stats.totalRecovery ?? 0}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] leading-tight">
            <span className="font-normal text-zinc-600 dark:text-zinc-400">
              Външни / гост клиенти:
            </span>
            <span className="font-bold text-amber-700 dark:text-amber-400">
              {stats.totalGuests ?? 0}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] leading-tight">
            <span className="font-normal text-zinc-600 dark:text-zinc-400">
              Неактивни:
            </span>
            <span className="font-bold text-rose-700 dark:text-rose-400">
              {stats.inactiveMembersCount ?? 0}
            </span>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-1 text-zinc-700 dark:text-zinc-300">
        <div className="flex items-center justify-between text-[11px] leading-tight">
          <span className="font-normal text-zinc-600 dark:text-zinc-400">
            Клубни членове:
          </span>
          <span className="font-bold text-blue-700 dark:text-blue-300">
            {stats.totalClubMembers ?? 0}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] leading-tight">
          <span className="font-normal text-zinc-600 dark:text-zinc-400">
            Външни клиенти:
          </span>
          <span className="font-bold text-amber-700 dark:text-amber-400">
            {stats.totalGuests ?? 0}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] leading-tight">
          <span className="font-normal text-zinc-600 dark:text-zinc-400">
            Възстановяване:
          </span>
          <span className="font-bold text-emerald-700 dark:text-emerald-400">
            {stats.totalRecovery ?? 0}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] leading-tight">
          <span className="font-normal text-zinc-600 dark:text-zinc-400">
            Неактивни:
          </span>
          <span className="font-bold text-rose-700 dark:text-rose-400">
            {stats.inactiveMembersCount ?? 0}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] leading-tight">
          <span className="font-normal text-zinc-600 dark:text-zinc-400">
            Семейства:
          </span>
          <span className="font-bold text-purple-700 dark:text-purple-400">
            {stats.totalFamilies ?? 0}
          </span>
        </div>
      </div>
    );
  };

  const renderScheduleContent = () => {
    if (!stats) {
      return (
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-full bg-emerald-200/50 dark:bg-zinc-800" />
          <Skeleton className="h-3 w-full bg-emerald-200/50 dark:bg-zinc-800" />
          <Skeleton className="h-3 w-full bg-emerald-200/50 dark:bg-zinc-800" />
        </div>
      );
    }
    if (isRecoveryZone) {
      return (
        <div className="space-y-1 text-zinc-700 dark:text-zinc-300">
          <div className="flex items-center justify-between text-[11px] leading-tight">
            <span className="font-normal text-zinc-600 dark:text-zinc-400">
              Заявени процедури днес:
            </span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400">
              {stats.todayRecoveryCount ?? 0}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] leading-tight">
            <span className="font-normal text-zinc-600 dark:text-zinc-400">
              Сауна, ботуши, масажи:
            </span>
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {(stats.todayRecoveryCount || 0) > 0
                ? "Има резервации"
                : "Свободни"}
            </span>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-2.5">
        <div className="space-y-1 border-b border-emerald-100 pb-2 text-zinc-700 dark:border-emerald-800/50 dark:text-zinc-300">
          <div className="flex items-center justify-between text-[11px] leading-tight">
            <span className="font-normal text-zinc-600 dark:text-zinc-400">
              Тренировки:
            </span>
            <span className="font-bold text-emerald-700 dark:text-emerald-300">
              {stats.todayTrainingsCount ?? 0}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] leading-tight">
            <span className="font-normal text-zinc-600 dark:text-zinc-400">
              Състезания:
            </span>
            <span className="font-bold text-rose-700 dark:text-rose-400">
              {stats.todayCompetitionsCount ?? 0}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] leading-tight">
            <span className="font-normal text-zinc-600 dark:text-zinc-400">
              Лагери & Други:
            </span>
            <span className="font-bold text-amber-700 dark:text-amber-400">
              {(stats.todayCampsCount ?? 0) +
                (stats.todayOtherEventsCount ?? 0)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] leading-tight">
            <span className="font-normal text-zinc-600 dark:text-zinc-400">
              Възстановяване:
            </span>
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {stats.todayRecoveryCount ?? 0}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] leading-tight">
            <span className="font-normal text-zinc-600 dark:text-zinc-400">
              Кортове:
            </span>
            <span className="font-bold text-purple-600 dark:text-purple-400">
              {stats.todayCourtCount ?? 0}
            </span>
          </div>
        </div>

        {stats.todayEventsList && stats.todayEventsList.length > 0 && (
          <div className="space-y-1.5 pt-0.5">
            {stats.todayEventsList.slice(0, 3).map((event: DashboardEvent) => (
              <div
                key={event.id}
                className="flex items-start justify-between rounded-xl bg-white/60 p-1.5 text-[10px] leading-tight dark:bg-black/20"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="line-clamp-1 font-bold text-emerald-800 dark:text-emerald-200">
                    {event.title}
                  </span>
                  <span className="font-light text-zinc-500 dark:text-zinc-400">
                    {new Date(event.startDate).toLocaleTimeString("bg-BG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-medium whitespace-nowrap text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  {event.attendeesCount} зап.
                </span>
              </div>
            ))}
            {stats.todayEventsList.length > 3 && (
              <div
                className="mt-1 cursor-pointer text-center text-[10px] font-medium text-emerald-600/70 hover:underline dark:text-emerald-400/70"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push("/schedule");
                }}
              >
                + още {stats.todayEventsList.length - 3} събития
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderRevenueContent = () => {
    if (!stats) {
      return (
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-full bg-purple-200/50 dark:bg-zinc-800" />
          <Skeleton className="h-3 w-full bg-purple-200/50 dark:bg-zinc-800" />
          <Skeleton className="h-3 w-full bg-purple-200/50 dark:bg-zinc-800" />
        </div>
      );
    }
    if (isRecoveryZone) {
      return (
        <div className="space-y-1 text-zinc-700 dark:text-zinc-300">
          <div className="flex items-center justify-between text-[11px] leading-tight">
            <span className="font-normal text-zinc-600 dark:text-zinc-400">
              Възстановителни процедури:
            </span>
            <span className="font-bold text-purple-700 dark:text-purple-300">
              {formatPrice(stats.revenueRecovery ?? 0)}
            </span>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-1 text-zinc-700 dark:text-zinc-300">
        <div className="flex items-center justify-between text-[11px] leading-tight">
          <span className="font-normal text-zinc-600 dark:text-zinc-400">
            Тренировки:
          </span>
          <span className="font-bold text-purple-700 dark:text-purple-300">
            {formatPrice(stats.revenueTrainings ?? 0)}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] leading-tight">
          <span className="font-normal text-zinc-600 dark:text-zinc-400">
            Клубни услуги:
          </span>
          <span className="font-bold text-teal-800 dark:text-teal-400">
            {formatPrice(stats.revenueServices ?? 0)}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] leading-tight">
          <span className="font-normal text-zinc-600 dark:text-zinc-400">
            Възстановяване:
          </span>
          <span className="font-bold text-indigo-600 dark:text-indigo-400">
            {formatPrice(stats.revenueRecovery ?? 0)}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] leading-tight">
          <span className="font-normal text-zinc-600 dark:text-zinc-400">
            Кортове:
          </span>
          <span className="font-bold text-pink-800 dark:text-pink-400">
            {formatPrice(stats.revenueCourts ?? 0)}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] leading-tight">
          <span className="font-normal text-zinc-600 dark:text-zinc-400">
            Магазин & Стоки:
          </span>
          <span className="font-bold text-purple-700 dark:text-purple-300">
            {formatPrice(stats.revenueShop ?? 0)}
          </span>
        </div>
      </div>
    );
  };

  const renderLowStockContent = () => {
    if (!stats) {
      return (
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-full bg-current opacity-10" />
          <Skeleton className="h-3 w-full bg-current opacity-10" />
        </div>
      );
    }
    const lowStockProducts = stats.lowStockProducts || [];
    if ((stats.lowStockCount || 0) > 0) {
      return (
        <div className="relative space-y-1.5">
          {lowStockProducts.slice(0, 4).map((p: DashboardProduct) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-md border border-rose-100/50 bg-white/40 px-2 py-0.5 text-[11px] leading-tight dark:border-rose-900/20 dark:bg-black/20"
            >
              <span
                className="max-w-28 truncate font-medium text-zinc-700 dark:text-zinc-300"
                title={p.name}
              >
                {p.name}
              </span>
              <span className="font-extrabold text-rose-700 dark:text-rose-400">
                {p.stock} бр.
              </span>
            </div>
          ))}
          {lowStockProducts.length > 4 && (
            <div className="mt-1 text-right text-[9px] font-medium text-rose-600 opacity-70 dark:text-rose-400">
              + още {lowStockProducts.length - 4} продукта
            </div>
          )}
        </div>
      );
    }
    return (
      <div className="space-y-1">
        <div className="text-[12px] leading-tight font-medium text-emerald-800 dark:text-emerald-300">
          Всички стоки са в наличност.
        </div>
        <div className="text-[10px] text-zinc-500">
          Към каталога на магазина
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 duration-500 animate-in fade-in">
      {/* Quick Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-zinc-200/80 bg-white/80 p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300">
          <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400" />
          <span>Бързи действия:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 rounded-xl border-zinc-200 text-xs font-semibold shadow-2xs hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            <Link href="/sales/new">
              <PlusCircle className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Нова продажба</span>
            </Link>
          </Button>

          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 rounded-xl border-zinc-200 text-xs font-semibold shadow-2xs hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            <Link href="/members/new">
              <UserPlus className="size-3.5 text-blue-600 dark:text-blue-400" />
              <span>Нов член</span>
            </Link>
          </Button>

          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 rounded-xl border-zinc-200 text-xs font-semibold shadow-2xs hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            <Link href="/schedule">
              <Calendar className="size-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>График</span>
            </Link>
          </Button>

          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 rounded-xl border-zinc-200 text-xs font-semibold shadow-2xs hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            <Link href="/catalogs/shop">
              <Package className="size-3.5 text-amber-600 dark:text-amber-400" />
              <span>Магазин</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Main KPI Bento Grid */}
      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 gap-3 md:grid-cols-2",
          isRecoveryZone ? "lg:grid-cols-3" : "lg:grid-cols-4"
        )}
      >
        {/* Members Card */}
        <BentoCard
          onClick={() => router.push("/members")}
          className="group relative flex h-full min-h-36 sm:min-h-40 cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/80 p-3.5 sm:p-4 text-blue-600 shadow-none transition-all duration-300 hover:bg-blue-100/50 dark:border-blue-800/50 dark:bg-blue-900/10 dark:text-blue-400 dark:hover:bg-blue-950/20"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="rounded-2xl bg-blue-100 p-2 text-blue-600 dark:bg-blue-800 dark:text-blue-200">
              <Users className="size-4 sm:size-5" strokeWidth={1.5} />
            </div>
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-extrabold tracking-wider uppercase shadow-none transition-colors",
                isRecoveryZone
                  ? "bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : (stats?.newMembersCount || 0) > 0
                    ? "bg-blue-100/80 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
                    : "bg-blue-50 text-blue-500/70 dark:bg-blue-950/20 dark:text-blue-400/50"
              )}
            >
              <Sparkles className="size-3" />
              {isRecoveryZone
                ? "Релакс"
                : (stats?.newMembersCount || 0) > 0
                  ? `+${stats?.newMembersCount} нови`
                  : "Общо"}
            </div>
          </div>
          <div className="relative z-10 flex flex-1 flex-col justify-end">
            <div className="mb-2 flex items-baseline justify-between">
              <p className="text-xs font-bold text-blue-900 dark:text-blue-200">
                {isRecoveryZone ? "Клиенти на зоната" : "Общо членове"}
              </p>
              <div className="flex items-center gap-1">
                <span className="text-sm font-extrabold text-blue-700 dark:text-blue-300">
                  {isRecoveryZone
                    ? (stats?.totalRecovery ?? 0)
                    : (stats?.totalMembers ?? 0)}
                </span>
                <ArrowUpRight className="size-4 -translate-x-2 translate-y-2 text-blue-700 opacity-0 transition-all duration-300 group-hover:translate-0 group-hover:opacity-100 dark:text-blue-300" />
              </div>
            </div>
            {renderMembersContent()}
          </div>
        </BentoCard>

        {/* Schedule / Training Card */}
        <BentoCard
          onClick={() =>
            router.push(isRecoveryZone ? "/schedule/recovery" : "/schedule")
          }
          className="group flex h-full min-h-36 sm:min-h-40 cursor-pointer flex-col justify-between rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3.5 sm:p-4 text-emerald-600 shadow-none transition-all hover:border-emerald-200 hover:bg-emerald-100/50 dark:border-emerald-800/50 dark:bg-emerald-900/10 dark:text-emerald-400"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="rounded-2xl bg-emerald-100 p-2 text-emerald-600 transition-transform group-hover:scale-105 dark:bg-emerald-800 dark:text-emerald-200">
              <Calendar className="size-4 sm:size-5" strokeWidth={1.5} />
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[9px] font-extrabold text-emerald-700 shadow-none dark:bg-emerald-900/60 dark:text-emerald-300">
              {isRecoveryZone
                ? `${stats?.todayRecoveryCount ?? 0} сесии`
                : `${stats?.todayEventsCount ?? 0} общо`}
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                {isRecoveryZone ? "Процедури днес" : t("dash.today_training")}
              </p>
              <ArrowUpRight className="size-4 -translate-x-2 translate-y-2 text-emerald-700 opacity-0 transition-all duration-300 group-hover:translate-0 group-hover:opacity-100 dark:text-emerald-300" />
            </div>
            {renderScheduleContent()}
          </div>
        </BentoCard>

        {/* Monthly Revenue Card */}
        <BentoCard
          onClick={() => router.push(isRecoveryZone ? "/finances" : "/reports")}
          className="group relative flex h-full min-h-36 sm:min-h-40 cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-purple-100 bg-purple-50/80 p-3.5 sm:p-4 text-purple-600 shadow-none transition-all duration-300 hover:bg-purple-100/50 dark:border-purple-800/50 dark:bg-purple-900/10 dark:text-purple-400 dark:hover:bg-purple-950/20"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="rounded-2xl bg-purple-100 p-2 text-purple-600 dark:bg-purple-800 dark:text-purple-200">
              <TrendingUp className="size-4 sm:size-5" strokeWidth={1.5} />
            </div>
          </div>
          <div className="relative z-10 flex flex-1 flex-col justify-end">
            <div className="mb-2 flex items-baseline justify-between">
              <p className="text-xs font-bold text-purple-900 dark:text-purple-200">
                {isRecoveryZone
                  ? `Оборот Релакс Зона (${currentMonthName})`
                  : `Месечен Приход (${currentMonthName})`}
              </p>
              <div className="flex items-center gap-1">
                <span className="text-sm font-extrabold text-purple-700 dark:text-purple-300">
                  {formatPrice(
                    isRecoveryZone
                      ? (stats?.revenueRecovery ?? 0)
                      : monthlyRevenue
                  )}
                </span>
                <ArrowUpRight className="size-4 -translate-x-2 translate-y-2 text-purple-700 opacity-0 transition-all duration-300 group-hover:translate-0 group-hover:opacity-100 dark:text-purple-300" />
              </div>
            </div>
            {renderRevenueContent()}
          </div>
        </BentoCard>

        {/* Low Stock / Inventory Card */}
        {!isRecoveryZone && (
          <BentoCard
            onClick={() => router.push("/catalogs/shop")}
            className={cn(
              "group relative flex h-full min-h-36 sm:min-h-40 cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border p-3.5 sm:p-4 shadow-none transition-all duration-300",
              (stats?.lowStockCount || 0) > 0
                ? "border-rose-100 bg-rose-50/80 text-rose-600 hover:bg-rose-100/50 dark:border-rose-900/50 dark:bg-rose-950/10 dark:hover:bg-rose-950/20"
                : "border-emerald-100 bg-emerald-50/80 text-emerald-600 hover:bg-emerald-100/50 dark:border-emerald-900/50 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20"
            )}
          >
            <div className="mb-2 flex items-center justify-between">
              <div
                className={cn(
                  "rounded-2xl p-2 transition-colors",
                  (stats?.lowStockCount || 0) > 0
                    ? "bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-300"
                    : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300"
                )}
              >
                {(stats?.lowStockCount || 0) > 0 ? (
                  <AlertCircle className="size-4 sm:size-5" strokeWidth={1.5} />
                ) : (
                  <CheckCircle2
                    className="size-4 sm:size-5"
                    strokeWidth={1.5}
                  />
                )}
              </div>
              {(stats?.lowStockCount || 0) > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-rose-100/80 px-2.5 py-0.5 text-[9px] font-extrabold text-rose-700 shadow-none dark:bg-rose-900/60 dark:text-rose-300">
                  {stats?.lowStockCount} изчерпващи се
                </div>
              )}
            </div>
            <div className="relative z-10 flex flex-1 flex-col justify-end">
              <div className="mb-2 flex items-center justify-between">
                <p
                  className={cn(
                    "text-xs font-bold",
                    (stats?.lowStockCount || 0) > 0
                      ? "text-rose-900 dark:text-rose-200"
                      : "text-emerald-900 dark:text-emerald-200"
                  )}
                >
                  {t("dash.low_stock")}
                </p>
                <ArrowUpRight className="size-4 -translate-x-2 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-0 group-hover:opacity-100" />
              </div>
              {renderLowStockContent()}
            </div>
          </BentoCard>
        )}
      </div>

      {/* Middle Operations Grid: Courts & Inquiries */}
      <div className="grid grid-cols-1 gap-2.5 sm:gap-3.5 lg:grid-cols-2">
        <CourtsOccupancyCard />
        <InquiriesNotificationCard />
      </div>

      {/* Community, Reviews & Alerts Grid: Reminders, Customer Reviews & Birthdays */}
      <div className="grid grid-cols-1 gap-2.5 sm:gap-3.5 md:grid-cols-2 lg:grid-cols-3">
        <DashboardNotifications reminders={isRecoveryZone ? [] : reminders} />
        <FeedbackDashboardCard />
        <BirthdayReminder />
      </div>
    </div>
  );
}
