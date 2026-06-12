"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import { BentoCard } from "@/components/ui/bento-card";
import { PageHeader } from "@/components/layout/page-header";
import { QuickTasks } from "@/components/dashboard/quick-tasks";
import { AttendanceReminder } from "@/components/dashboard/AttendanceReminder";
import { BirthdayReminder } from "@/components/dashboard/BirthdayReminder";
import {
  Users,
  Calendar,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  RefreshCw,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/currency";
import {
  getDashboardDataServerAction,
  invalidateDashboardCacheAction,
} from "@/lib/actions/dashboard";

import { useAppStore } from "@/store/use-app-store";

interface DashboardClientProps {
  initialData: any;
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { activeBranch } = useAppStore();

  const [stats, setStats] = useState<any>(initialData?.stats || null);
  const [todayTrainings, setTodayTrainings] = useState<any[]>(
    initialData?.todayTrainings || []
  );
  const loading = false;
  const [refreshing, setRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [quotaExhausted, setQuotaExhausted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRefresh = useCallback(
    async (quiet = false) => {
      // Don't retry if quota is known to be exhausted
      if (quiet && quotaExhausted) return;
      if (!quiet) {
        setRefreshing(true);
        // Force clear the dashboard server cache on manual refresh
        await invalidateDashboardCacheAction().catch((err) =>
          console.error("Cache invalidation failed on manual refresh", err)
        );
      }
      try {
        const result = await getDashboardDataServerAction(activeBranch);
        if (result.success) {
          const data = (result as any).data;
          if (data) {
            setStats(data.stats);
            setTodayTrainings(data.todayTrainings);
            setQuotaExhausted(false);
          }
        } else {
          const errMsg = (result as any).error || "";
          if (
            errMsg.includes("RESOURCE_EXHAUSTED") ||
            errMsg.includes("Quota")
          ) {
            setQuotaExhausted(true);
          }
        }
      } catch (err: any) {
        console.error("Error refreshing dashboard data:", err);
        if (
          err?.message?.includes("RESOURCE_EXHAUSTED") ||
          err?.message?.includes("Quota")
        ) {
          setQuotaExhausted(true);
        }
      } finally {
        if (!quiet) setRefreshing(false);
      }
    },
    [activeBranch, quotaExhausted]
  );

  useEffect(() => {
    // Quiet refresh when branch changes or on timer (skip if quota exhausted)
    if (!quotaExhausted) handleRefresh(true);

    const interval = setInterval(() => {
      handleRefresh(true);
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [handleRefresh, quotaExhausted]);

  // Branch-specific display logic
  const isRecoveryZone = activeBranch === "recoveryzone";

  const displayEmail = isRecoveryZone
    ? "recoveryzonebyzm@gmail.com"
    : user?.email || "bkgalabovo2014@gmail.com";

  const displayGreeting = isRecoveryZone
    ? "Ето какво се случва в зоната за възстановяване днес."
    : "Ето какво се случва в клуба днес.";

  const firstName = `Админ ${displayEmail}`;

  // Use values from stats or fallback to 0/placeholder
  const monthlyRevenue = stats?.revenueLast30Days || 0;
  const revenueTrend = stats?.revenueChange || 0;

  if (!mounted) {
    return (
      <div className="space-y-8 animate-pulse pb-12">
        <div className="h-32 bg-zinc-50 rounded-3xl w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="h-40 bg-zinc-50 rounded-3xl" />
          <div className="h-40 bg-zinc-50 rounded-3xl" />
          <div className="h-40 bg-zinc-50 rounded-3xl" />
          <div className="h-40 bg-zinc-50 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      <PageHeader
        title={firstName}
        description={displayGreeting}
        breadcrumbs={[{ label: "Начало" }]}
      >
        <div className="flex gap-3 items-center">
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl border-zinc-200 hover:bg-zinc-50 transition-all h-12 w-12 flex items-center justify-center shrink-0"
            onClick={() => handleRefresh(false)}
            disabled={refreshing}
            title={language === "bg" ? "Обнови" : "Refresh"}
          >
            <RefreshCw
              className={cn(
                "h-4 w-4 text-zinc-600 transition-transform duration-500",
                refreshing && "animate-spin"
              )}
            />
          </Button>
        </div>
      </PageHeader>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <BentoCard
          onClick={() => router.push("/members")}
          className="p-6 flex flex-col justify-between border shadow-none bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-800/50 rounded-4xl h-full min-h-48 transition-all duration-300 group cursor-pointer relative overflow-hidden hover:bg-blue-100/50 dark:hover:bg-blue-950/20"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-200">
              <Users className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div
              className={cn(
                "flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-none transition-colors",
                (stats?.newMembersCount || 0) > 0
                  ? "bg-blue-100/80 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
                  : "bg-blue-50 text-blue-500/70 dark:bg-blue-950/20 dark:text-blue-400/50"
              )}
            >
              <Sparkles className="h-3 w-3" />
              {(stats?.newMembersCount || 0) > 0
                ? `+${stats?.newMembersCount} нови`
                : "Общо"}
            </div>
          </div>
          <div className="relative z-10 flex-1 flex flex-col justify-end">
            <div className="flex items-baseline justify-between mb-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600/70 dark:text-blue-400/70">
                Общо членове
              </p>
              <div className="flex items-center gap-1">
                <span className="text-sm font-extrabold text-blue-700 dark:text-blue-300">
                  {stats?.totalMembers ?? 0}
                </span>
                <ArrowUpRight className="h-4 w-4 opacity-0 -translate-x-2 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 text-blue-700 dark:text-blue-300" />
              </div>
            </div>
            {loading ? (
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-full bg-blue-200/50 dark:bg-zinc-800" />
                <Skeleton className="h-3 w-full bg-blue-200/50 dark:bg-zinc-800" />
                <Skeleton className="h-3 w-full bg-blue-200/50 dark:bg-zinc-800" />
              </div>
            ) : (
              <div className="space-y-1 text-zinc-650 dark:text-zinc-350">
                <div className="flex items-center justify-between text-[11px] leading-tight">
                  <span className="font-light">Клубни членове:</span>
                  <span className="font-bold text-blue-700 dark:text-blue-300">
                    {stats?.totalClubMembers ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] leading-tight">
                  <span className="font-light">Външни клиенти:</span>
                  <span className="font-bold text-amber-700 dark:text-amber-400">
                    {stats?.totalGuests ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] leading-tight">
                  <span className="font-light">Възстановяване:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {stats?.totalRecovery ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] leading-tight">
                  <span className="font-light">Неактивни:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {stats?.inactiveMembersCount ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] leading-tight">
                  <span className="font-light">Семейства:</span>
                  <span className="font-bold text-purple-700 dark:text-purple-400">
                    {stats?.totalFamilies ?? 0}
                  </span>
                </div>
              </div>
            )}
          </div>
        </BentoCard>
        <BentoCard
          onClick={() => router.push("/schedule")}
          className="p-6 flex flex-col justify-between border shadow-none bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-800/50 rounded-4xl h-full min-h-48 cursor-pointer hover:bg-emerald-100/50 hover:border-emerald-200 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-800 dark:text-emerald-200 group-hover:scale-105 transition-transform">
              <Calendar className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 shadow-none">
              {stats?.todayEventsCount ?? 0} общо
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2.5 text-emerald-600/70 dark:text-emerald-400/70">
              {t("dash.today_training")}
            </p>
            {loading ? (
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-full bg-emerald-200/50 dark:bg-zinc-800" />
                <Skeleton className="h-3 w-full bg-emerald-200/50 dark:bg-zinc-800" />
                <Skeleton className="h-3 w-full bg-emerald-200/50 dark:bg-zinc-800" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1 text-zinc-650 dark:text-zinc-350 border-b border-emerald-100 dark:border-emerald-800/50 pb-3">
                  <div className="flex items-center justify-between text-[11px] leading-tight">
                    <span className="font-light">Тренировки:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">
                      {stats?.todayTrainingsCount ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] leading-tight">
                    <span className="font-light">Състезания:</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {stats?.todayCompetitionsCount ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] leading-tight">
                    <span className="font-light">Лагери & Други:</span>
                    <span className="font-bold text-amber-700 dark:text-amber-400">
                      {(stats?.todayCampsCount ?? 0) +
                        (stats?.todayOtherEventsCount ?? 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] leading-tight">
                    <span className="font-light">Възстановяване:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {stats?.todayRecoveryCount ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] leading-tight">
                    <span className="font-light">Кортове:</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      {stats?.todayCourtCount ?? 0}
                    </span>
                  </div>
                </div>

                {stats?.todayEventsList && stats.todayEventsList.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {stats.todayEventsList.slice(0, 3).map((event: any) => (
                      <div
                        key={event.id}
                        className="flex items-start justify-between text-[10px] leading-tight bg-white/50 dark:bg-black/20 p-2 rounded-xl"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-emerald-800 dark:text-emerald-200 line-clamp-1">
                            {event.title}
                          </span>
                          <span className="font-light text-emerald-600/80 dark:text-emerald-400/80">
                            {new Date(event.startDate).toLocaleTimeString(
                              "bg-BG",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                        </div>
                        <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 rounded text-emerald-700 dark:text-emerald-300 font-medium whitespace-nowrap">
                          {event.attendeesCount} зап.
                        </span>
                      </div>
                    ))}
                    {stats.todayEventsList.length > 3 && (
                      <div
                        className="text-[10px] text-center text-emerald-600/70 dark:text-emerald-400/70 font-medium mt-1 cursor-pointer hover:underline"
                        onClick={() => router.push("/schedule")}
                      >
                        + още {stats.todayEventsList.length - 3} събития
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </BentoCard>
        <BentoCard
          onClick={() => router.push("/sales")}
          className="p-6 flex flex-col justify-between border shadow-none bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/10 dark:text-purple-400 dark:border-purple-800/50 rounded-4xl h-full min-h-48 transition-all duration-300 group cursor-pointer relative overflow-hidden hover:bg-purple-100/50 dark:hover:bg-purple-950/20"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-800 dark:text-purple-200">
              <TrendingUp className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div
              className={cn(
                "flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-none",
                revenueTrend >= 0
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                  : "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450"
              )}
            >
              {revenueTrend >= 0 ? "↗" : "↘"} {revenueTrend > 0 ? "+" : ""}
              {revenueTrend.toFixed(0)}%
            </div>
          </div>
          <div className="relative z-10 flex-1 flex flex-col justify-end">
            <div className="flex items-baseline justify-between mb-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-600/70 dark:text-purple-400/70">
                {t("dash.monthly_revenue")} (
                {new Date().toLocaleString("bg-BG", { month: "long" })})
              </p>
              <div className="flex items-center gap-1">
                <span className="text-sm font-extrabold text-purple-700 dark:text-purple-300">
                  {formatPrice(monthlyRevenue)}
                </span>
                <ArrowUpRight className="h-4 w-4 opacity-0 -translate-x-2 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 text-purple-700 dark:text-purple-300" />
              </div>
            </div>
            {loading ? (
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-full bg-purple-200/50 dark:bg-zinc-800" />
                <Skeleton className="h-3 w-full bg-purple-200/50 dark:bg-zinc-800" />
                <Skeleton className="h-3 w-full bg-purple-200/50 dark:bg-zinc-800" />
              </div>
            ) : (
              <div className="space-y-1 text-zinc-650 dark:text-zinc-350">
                <div className="flex items-center justify-between text-[11px] leading-tight">
                  <span className="font-light">Тренировки:</span>
                  <span className="font-bold text-purple-700 dark:text-purple-300">
                    {formatPrice(stats?.revenueTrainings ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] leading-tight">
                  <span className="font-light">Клубни услуги:</span>
                  <span className="font-bold text-teal-600 dark:text-teal-400">
                    {formatPrice(stats?.revenueServices ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] leading-tight">
                  <span className="font-light">Възстановяване:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {formatPrice(stats?.revenueRecovery ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] leading-tight">
                  <span className="font-light">Кортове:</span>
                  <span className="font-bold text-pink-600 dark:text-pink-400">
                    {formatPrice(stats?.revenueCourts ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] leading-tight">
                  <span className="font-light">Магазин / Стоки:</span>
                  <span className="font-bold text-purple-700 dark:text-purple-300">
                    {formatPrice(stats?.revenueShop ?? 0)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </BentoCard>
        <BentoCard
          onClick={() => router.push("/catalogs?tab=inventory")}
          className={cn(
            "p-6 flex flex-col justify-between border shadow-none rounded-4xl h-full min-h-48 transition-all duration-300 group cursor-pointer relative overflow-hidden",
            (stats?.lowStockCount || 0) > 0
              ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/10 dark:text-rose-450 dark:border-rose-900/50 hover:bg-rose-100/50 dark:hover:bg-rose-950/20"
              : "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/10 dark:text-emerald-450 dark:border-emerald-900/50 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/20"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div
              className={cn(
                "p-2.5 rounded-2xl transition-colors",
                (stats?.lowStockCount || 0) > 0
                  ? "bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-300"
                  : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300"
              )}
            >
              {(stats?.lowStockCount || 0) > 0 ? (
                <AlertCircle className="h-5 w-5" strokeWidth={1.5} />
              ) : (
                <CheckCircle2 className="h-5 w-5" strokeWidth={1.5} />
              )}
            </div>
            {(stats?.lowStockCount || 0) > 0 && (
              <div className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-100/80 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300 shadow-none">
                {stats?.lowStockCount} изчерпващи се
              </div>
            )}
          </div>
          <div className="relative z-10 flex-1 flex flex-col justify-end">
            <div className="flex items-center justify-between mb-2.5">
              <p
                className={cn(
                  "text-[10px] font-bold uppercase tracking-[0.2em]",
                  (stats?.lowStockCount || 0) > 0
                    ? "text-rose-600/70 dark:text-rose-400/70"
                    : "text-emerald-600/70 dark:text-emerald-400/70"
                )}
              >
                {t("dash.low_stock")}
              </p>
              <ArrowUpRight className="h-4 w-4 opacity-0 -translate-x-2 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0" />
            </div>
            {loading ? (
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-full bg-current opacity-10" />
                <Skeleton className="h-3 w-full bg-current opacity-10" />
              </div>
            ) : (stats?.lowStockCount || 0) > 0 ? (
              <div className="space-y-1.5 relative">
                {stats?.lowStockProducts?.slice(0, 4).map((p: any) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-[11px] leading-tight bg-white/40 dark:bg-black/20 px-2 py-1 rounded-md border border-rose-100/50 dark:border-rose-900/20"
                  >
                    <span
                      className="font-medium truncate max-w-[100px] text-zinc-700 dark:text-zinc-300"
                      title={p.name}
                    >
                      {p.name}
                    </span>
                    <span className="font-extrabold text-rose-700 dark:text-rose-400">
                      {p.stock} бр.
                    </span>
                  </div>
                ))}
                {(stats?.lowStockProducts?.length || 0) > 4 && (
                  <div className="text-[9px] font-medium text-right mt-1 opacity-70 text-rose-600 dark:text-rose-400">
                    + още {(stats?.lowStockProducts?.length || 0) - 4}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-[12px] font-medium leading-tight text-emerald-800 dark:text-emerald-300">
                  Всички стоки са налични.
                </div>
                <div className="text-[10px] opacity-70">Към магазина</div>
              </div>
            )}
          </div>
        </BentoCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <QuickTasks />
        </div>
        <div className="lg:col-span-3 space-y-8">
          <BirthdayReminder />
          <AttendanceReminder initialEvents={todayTrainings} />
        </div>
      </div>
    </div>
  );
}
