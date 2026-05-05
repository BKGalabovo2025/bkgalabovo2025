"use client";

import { useAuth } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import { useDashboardData } from "@/hooks/useDashboardData";
import { BentoCard } from "@/components/ui/bento-card";
import { PageHeader } from "@/components/layout/page-header";
import { RevenueChart } from "@/components/dashboard/dashboard-charts";
import { QuickTasks } from "@/components/dashboard/quick-tasks";
import {
  Users,
  Calendar,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  LucideIcon,
  Activity,
  UserPlus,
  CreditCard,
  Target,
  BarChart3,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

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
      className={cn("p-6 flex flex-col justify-between h-40", colors[color])}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2.5 rounded-2xl", iconColors[color])}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg",
              trend.positive
                ? "bg-emerald-100 text-emerald-700"
                : "bg-rose-100 text-rose-700"
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
        <p className="text-xs font-bold opacity-70 uppercase tracking-widest mb-1">
          {title}
        </p>
        {loading ? (
          <Skeleton className="h-9 w-24 bg-current opacity-20" />
        ) : (
          <p className="text-3xl font-black">{value}</p>
        )}
      </div>
    </BentoCard>
  );
};

export default function DashboardClient() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { stats, revenueChartData, loading } = useDashboardData();
  const router = useRouter();

  const firstName = user?.displayName?.split(" ")[0] || "Админ";

  // Use values from stats or fallback to 0/placeholder
  const activeMembers = stats?.activeMembersCount || 0;
  const monthlyRevenue = stats?.revenueLast30Days || 0;
  const salesCount = stats?.salesLast30Days || 0;
  const revenueTrend = stats?.revenueChange || 0;
  const membersTrend = stats?.newMembersChange || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      <PageHeader
        title={`${t("dash.welcome")}, ${firstName}! 👋`}
        description={t("dash.subtitle")}
        breadcrumbs={[{ label: "Начало" }]}
      >
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="rounded-xl border-slate-200 hover:bg-slate-50 transition-all font-black text-xs uppercase tracking-widest"
            onClick={() => router.push("/schedule")}
          >
            {language === "bg" ? "График" : "Schedule"}
          </Button>
          <Button
            className="rounded-xl shadow-lg shadow-blue-900/20 transition-all font-black text-xs uppercase tracking-widest bg-slate-900 text-white hover:bg-slate-800"
            onClick={() => router.push("/reservations/new")}
          >
            {language === "bg" ? "Нова резервация" : "New Reservation"}
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
          value={salesCount}
          icon={Calendar}
          color="emerald"
          loading={loading}
        />
        <StatCard
          title={t("dash.monthly_revenue")}
          value={`${monthlyRevenue.toFixed(0)} лв.`}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Revenue Trend Chart */}
          <BentoCard className="p-8 bg-white border-none shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black font-bento text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  {t("dash.monthly_report")}
                </h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                  Анализ на приходите (6 месеца)
                </p>
              </div>
            </div>

            {loading ? (
              <Skeleton className="h-[300px] w-full rounded-2xl" />
            ) : (
              <RevenueChart data={revenueChartData} />
            )}
          </BentoCard>

          <BentoCard className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-12 opacity-10 -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-700">
              <Activity size={240} />
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl font-black mb-2 font-bento uppercase tracking-tight">
                {t("dash.quick_analysis")}
              </h3>
              <p className="text-slate-400 mb-8 max-w-md text-sm font-medium">
                Вижте най-натоварените часове за днес и планирайте ресурсите си
                по-добре.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Заетост", val: "78%", icon: Activity },
                  {
                    label: "Нови",
                    val: stats?.newMembersLast30Days || 0,
                    icon: UserPlus,
                  },
                  {
                    label: "Плащания",
                    val: stats?.salesLast30Days || 0,
                    icon: CreditCard,
                  },
                  { label: "Цели", val: "92%", icon: Target },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10"
                  >
                    <item.icon className="h-4 w-4 text-blue-400 mb-2" />
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter mb-1">
                      {item.label}
                    </p>
                    <p className="text-xl font-black">{item.val}</p>
                  </div>
                ))}
              </div>
            </div>
          </BentoCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <QuickTasks />

          <BentoCard className="p-6">
            <h3 className="font-black text-sm mb-6 flex items-center gap-2 uppercase tracking-widest">
              <Users className="h-4 w-4 text-blue-600" />{" "}
              {t("dash.coaches_online")}
            </h3>
            <div className="space-y-4">
              {[
                {
                  name: "Иван Петров",
                  status: language === "bg" ? "В тренировка" : "In Session",
                  img: "IP",
                },
                {
                  name: "Мария Колева",
                  status: language === "bg" ? "Свободна" : "Available",
                  img: "MK",
                },
                {
                  name: "Георги Димитров",
                  status: language === "bg" ? "Почивка" : "Break",
                  img: "GD",
                },
              ].map((coach, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100"
                >
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-600 text-xs shadow-sm">
                    {coach.img}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-800">
                      {coach.name}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {coach.status}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      coach.status ===
                        (language === "bg" ? "Свободна" : "Available")
                        ? "bg-emerald-500 shadow-lg shadow-emerald-200"
                        : coach.status ===
                            (language === "bg" ? "В тренировка" : "In Session")
                          ? "bg-amber-500"
                          : "bg-slate-300"
                    )}
                  />
                </div>
              ))}
            </div>
          </BentoCard>

          <BentoCard className="p-6 bg-slate-900 text-white border-none relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 opacity-10">
              <AlertCircle size={80} />
            </div>
            <h3 className="font-black text-sm mb-2 uppercase tracking-widest">
              {t("dash.maintenance")}
            </h3>
            <p className="text-sm text-slate-400 mb-6 font-medium leading-relaxed">
              Техническа профилактика утре от 08:00 до 10:00.
            </p>
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-8 w-8 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-[10px] font-black"
                >
                  U{i}
                </div>
              ))}
              <div className="h-8 w-8 rounded-full border-2 border-slate-900 bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">
                +2
              </div>
            </div>
          </BentoCard>
        </div>
      </div>
    </div>
  );
}
