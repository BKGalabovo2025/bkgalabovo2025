"use client";

import { useState, useEffect, useCallback } from "react";
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
  ArrowDownRight,
  LucideIcon,
  RefreshCw,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/currency";
import { getDashboardDataServerAction } from "@/lib/actions/dashboard";

import { useAppStore } from "@/store/use-app-store";

// Sub-components for better organization
const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  color,
  loading,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  color: "blue" | "emerald" | "amber" | "rose" | "purple";
  loading?: boolean;
}) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-800/50",
    emerald:
      "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-800/50",
    amber:
      "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-800/50",
    rose: "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/10 dark:text-rose-400 dark:border-rose-800/50",
    purple:
      "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/10 dark:text-purple-400 dark:border-purple-800/50",
  };

  const iconColors = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-200",
    emerald:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-800 dark:text-emerald-200",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-800 dark:text-amber-200",
    rose: "bg-rose-100 text-rose-600 dark:bg-rose-800 dark:text-rose-200",
    purple:
      "bg-purple-100 text-purple-600 dark:bg-purple-800 dark:text-purple-200",
  };

  return (
    <BentoCard
      className={cn(
        "p-6 flex flex-col justify-between h-40 border border-zinc-100 bg-white",
        colors[color]
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2.5 rounded-2xl", iconColors[color])}>
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-[10px] uppercase tracking-widest px-2 py-1 rounded-lg",
              trend.positive
                ? "bg-emerald-50 text-emerald-600"
                : "bg-rose-50 text-rose-600"
            )}
          >
            {trend.positive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {trend.value}
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] font-medium opacity-60 uppercase tracking-[0.2em] mb-1">
          {title}
        </p>
        {loading ? (
          <Skeleton className="h-9 w-24 bg-current opacity-20" />
        ) : (
          <p className="text-3xl font-light tracking-tighter">{value}</p>
        )}
      </div>
    </BentoCard>
  );
};

interface DashboardClientProps {
  initialData: any;
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
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
      if (!quiet) setRefreshing(true);
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
  const activeMembers = stats?.activeMembersCount || 0;
  const monthlyRevenue = stats?.revenueLast30Days || 0;
  const revenueTrend = stats?.revenueChange || 0;
  const membersTrend = stats?.newMembersChange || 0;

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
        <StatCard
          title={t("dash.active_members")}
          value={activeMembers}
          icon={Users}
          trend={{
            value: `${membersTrend > 0 ? "+" : ""}${membersTrend.toFixed(0)}%`,
            positive: membersTrend >= 0,
          }}
          color="blue"
          loading={loading}
        />
        <StatCard
          title={t("dash.today_training")}
          value={stats?.trainingsToday || 0}
          icon={Calendar}
          color="emerald"
          loading={loading}
        />
        <StatCard
          title={t("dash.monthly_revenue")}
          value={formatPrice(monthlyRevenue)}
          icon={TrendingUp}
          trend={{
            value: `${revenueTrend > 0 ? "+" : ""}${revenueTrend.toFixed(0)}%`,
            positive: revenueTrend >= 0,
          }}
          color="purple"
          loading={loading}
        />
        <StatCard
          title={t("dash.low_stock")}
          value={stats?.lowStockCount || 0}
          icon={AlertCircle}
          color={(stats?.lowStockCount || 0) > 0 ? "rose" : "amber"}
          loading={loading}
        />
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
