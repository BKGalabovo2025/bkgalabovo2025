"use client";

import { useAuth } from "@/context/auth-context";
import { useDashboardData } from "@/hooks/useDashboardData";
import { BentoCard } from "@/components/ui/bento-card";
import { PageHeader } from "@/components/layout/page-header";
import {
  Users,
  Calendar,
  TrendingUp,
  AlertCircle,
  Clock,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  LucideIcon,
  Activity,
  UserPlus,
  CreditCard,
  Target,
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
      className={cn("p-6 flex flex-col justify-between", colors[color])}
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
        <p className="text-sm font-medium opacity-70 uppercase tracking-wider mb-1">
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
  const { stats, loading } = useDashboardData();
  const router = useRouter();

  const firstName = user?.displayName?.split(" ")[0] || "Админ";

  // Use values from stats or fallback to 0/placeholder
  const activeMembers = stats?.activeMembersCount || 0;
  const monthlyRevenue = stats?.revenueLast30Days || 0;
  const salesCount = stats?.salesLast30Days || 0;
  const revenueTrend = stats?.revenueChange || 0;
  const membersTrend = stats?.newMembersChange || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader
        title={`Здравей, ${firstName}! 👋`}
        description="Ето какво се случва в клуба днес."
        breadcrumbs={[{ label: "Начало" }]}
      >
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="rounded-xl border-slate-200 hover:bg-slate-50 transition-all font-bento"
            onClick={() => router.push("/schedule")}
          >
            График
          </Button>
          <Button
            className="rounded-xl shadow-lg shadow-primary/20 transition-all font-bento bg-slate-900 text-white hover:bg-slate-800"
            onClick={() => router.push("/reservations/new")}
          >
            Нова резервация
          </Button>
        </div>
      </PageHeader>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Активни членове"
          value={activeMembers}
          icon={Users}
          trend={{
            value: `${membersTrend > 0 ? "+" : ""}${membersTrend}%`,
            positive: membersTrend >= 0,
          }}
          color="blue"
          loading={loading}
        />
        <StatCard
          title="Днешни тренировки"
          value={salesCount} // Placeholder for reservations until mapped
          icon={Calendar}
          color="emerald"
          loading={loading}
        />
        <StatCard
          title="Месечен оборот"
          value={`${monthlyRevenue} лв.`}
          icon={TrendingUp}
          trend={{
            value: `${revenueTrend > 0 ? "+" : ""}${revenueTrend}%`,
            positive: revenueTrend >= 0,
          }}
          color="purple"
          loading={loading}
        />
        <StatCard
          title="Ниска наличност"
          value={stats?.unpaidSales || 0} // Using unpaid sales as alert
          icon={AlertCircle}
          color={(stats?.unpaidSales || 0) > 0 ? "rose" : "amber"}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions & Activity */}
        <div className="lg:col-span-2 space-y-8">
          <BentoCard className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-12 opacity-10 -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-700">
              <Activity size={240} />
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-2 font-bento">
                Бърз анализ на натовареността
              </h3>
              <p className="text-slate-400 mb-8 max-w-md">
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
                    <p className="text-xs text-slate-400 uppercase tracking-tighter mb-1">
                      {item.label}
                    </p>
                    <p className="text-xl font-bold">{item.val}</p>
                  </div>
                ))}
              </div>
            </div>
          </BentoCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <BentoCard className="p-0 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> Последни събития
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8 rounded-lg"
                >
                  Виж всички
                </Button>
              </div>
              <div className="divide-y divide-slate-50">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="p-4 hover:bg-slate-50 transition-colors flex items-center gap-4 group cursor-pointer"
                  >
                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold group-hover:bg-primary group-hover:text-white transition-all">
                      {i}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">
                        Последна активност {i}
                      </p>
                      <p className="text-xs text-slate-500">
                        Преди {i * 15} минути
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                  </div>
                ))}
              </div>
            </BentoCard>

            <BentoCard className="p-6 bg-primary/5 border-primary/10 flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-primary text-white flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2 font-bento">
                  Месечен отчет
                </h3>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                  Вашият клуб е пораснал с <strong>{membersTrend}%</strong>{" "}
                  спрямо миналия месец. Продължавайте в същия дух!
                </p>
              </div>
              <Button className="w-full rounded-xl font-bento bg-slate-900 text-white hover:bg-slate-800">
                Изтегли PDF отчет
              </Button>
            </BentoCard>
          </div>
        </div>

        {/* Sidebar / Secondary column */}
        <div className="space-y-8">
          <BentoCard className="p-6">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Треньори на линия
            </h3>
            <div className="space-y-4">
              {[
                { name: "Иван Петров", status: "В тренировка", img: "IP" },
                { name: "Мария Колева", status: "Свободна", img: "MK" },
                { name: "Георги Димитров", status: "Почивка", img: "GD" },
              ].map((coach, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100"
                >
                  <div className="h-10 w-10 rounded-xl bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                    {coach.img}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{coach.name}</p>
                    <p className="text-xs text-slate-500">{coach.status}</p>
                  </div>
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      coach.status === "Свободна"
                        ? "bg-emerald-500"
                        : coach.status === "В тренировка"
                          ? "bg-amber-500"
                          : "bg-slate-300"
                    )}
                  />
                </div>
              ))}
            </div>
          </BentoCard>

          <BentoCard className="p-6 bg-slate-50 border-slate-200 border-dashed relative overflow-hidden">
            <h3 className="font-bold mb-2">Предстояща поддръжка</h3>
            <p className="text-sm text-slate-500 mb-4">
              Техническа профилактика утре от 08:00 до 10:00.
            </p>
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-8 w-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold"
                >
                  U{i}
                </div>
              ))}
              <div className="h-8 w-8 rounded-full border-2 border-white bg-primary text-white flex items-center justify-center text-[10px] font-bold">
                +2
              </div>
            </div>
          </BentoCard>
        </div>
      </div>
    </div>
  );
}
