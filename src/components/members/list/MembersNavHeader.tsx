"use client";

import {
  PlusCircle,
  RefreshCw,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/context/auth-context";
import { useFamilies } from "@/hooks/useFamilies";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";

import {
  getActiveMemberListSectionId,
  MEMBER_LIST_SECTIONS,
} from "./member-list-sections";

export interface MembersTabCounts {
  all: number;
  club: number;
  recovery: number;
  guests: number;
  families?: number;
}

interface MembersNavHeaderProps {
  counts?: MembersTabCounts;
}

export function MembersNavHeader({ counts }: MembersNavHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { idToken } = useAuth();
  const { families } = useFamilies();
  const { activeBranch } = useAppStore();
  const isRecoveryBranch = activeBranch === "recoveryzone";
  const [isSyncing, setIsSyncing] = useState(false);

  // Динамичен брой семейства от useFamilies, ако не е подаден от сървъра
  const familiesCount = counts?.families ?? families.length;

  const ALL_NAV_TABS = [
    {
      id: "all" as const,
      href: "/members",
      label: "Всички",
      icon: Users,
      count: counts?.all,
      exact: true,
      description:
        "Пълен регистър на всички състезатели, клиенти на зоната и гости.",
    },
    ...MEMBER_LIST_SECTIONS.map((sec) => ({
      id: sec.id,
      href: sec.href,
      label: sec.label,
      icon: sec.icon,
      count:
        sec.id === "families"
          ? familiesCount
          : counts?.[sec.id as keyof MembersTabCounts],
      exact: false,
      description: sec.description,
    })),
  ];

  const NAV_TABS = isRecoveryBranch
    ? ALL_NAV_TABS.filter((t) => t.id === "recovery" || t.id === "all")
    : ALL_NAV_TABS;

  const activeSectionId = getActiveMemberListSectionId(pathname);

  // Backward compatibility: пренасочване от стар URL с ?tab= към съответната подстраница
  useEffect(() => {
    const tab = searchParams?.get("tab");
    if (!tab) return;

    if (tab === "guests") {
      router.replace("/members/guests");
    } else if (tab === "recovery-clients" || tab === "recovery") {
      router.replace("/members/recovery");
    } else if (tab === "families") {
      router.replace("/members/families");
    } else if (tab === "members" || tab === "club") {
      router.replace("/members/club");
    }
  }, [searchParams, router]);

  const handleSyncStatuses = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch("/api/cron/check-statuses", {
        headers: {
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          `Синхронизацията приключи! Деактивирани: ${data.deactivatedCount}, Активирани: ${data.activatedCount}`
        );
        router.refresh();
      } else {
        toast.error("Грешка: " + (data.error || "Неуспешна синхронизация"));
      }
    } catch (e: unknown) {
      console.error("Sync statuses error:", e);
      toast.error("Възникна грешка при синхронизацията на статусите.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-3 pb-1">
        {/* Заглавна лента с висока плътност */}
        <PageHeader
          title={
            <div className="flex flex-wrap items-center gap-2">
              <span>
                {isRecoveryBranch ? "Членове на зоната" : "Членове на клуба"}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "h-5 text-[10px] font-semibold tracking-wider uppercase",
                  isRecoveryBranch
                    ? "border-indigo-200 bg-indigo-50/70 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300"
                    : "border-emerald-200 bg-emerald-50/70 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                )}
              >
                {isRecoveryBranch ? "Recovery Zone by ZM" : "Бадминтон Клуб"}
              </Badge>
            </div>
          }
          description={
            isRecoveryBranch
              ? "Управление на клиентски профили, възстановителни пакети и процедури."
              : "Управление на спортисти, възрастови групи, членски карти и статуси."
          }
          breadcrumbs={[
            { label: "Начало", href: "/dashboard" },
            { label: "Членове", href: "/members" },
          ]}
        >
          <div className="flex w-full items-center gap-2 sm:w-auto">
            {/* Бутон за синхронизация с пояснителен Tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncStatuses}
                  disabled={isSyncing}
                  className="h-9 flex-1 sm:flex-initial rounded-xl border-zinc-200 px-3 text-[11px] font-medium uppercase tracking-wider hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                >
                  <RefreshCw
                    className={cn(
                      "mr-1.5 size-3.5 text-zinc-500",
                      isSyncing && "animate-spin text-primary"
                    )}
                  />
                  <span>Синхронизация</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-xs">
                Автоматично проверява валидността на членските такси и обновява
                статуса (активен/неактивен).
              </TooltipContent>
            </Tooltip>

            {/* Бутон за нов член с пояснителен Tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={() => router.push("/members/new")}
                  className="h-9 flex-1 sm:flex-initial rounded-xl bg-zinc-950 px-3.5 text-[11px] font-medium uppercase tracking-wider text-white shadow-none hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
                >
                  <PlusCircle className="mr-1.5 size-3.5" />
                  <span>Нов член</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-xs">
                Създава нов профил на спортист, любител или клиент в базата
                данни.
              </TooltipContent>
            </Tooltip>
          </div>
        </PageHeader>

        {/* Навигационни подстраници (Sticky Tab Bar) с динамични живи броячи */}
        <div className="sticky top-0 z-20 -mx-1 p-1 bg-background/80 backdrop-blur-md transition-all">
          <div className="no-scrollbar flex h-auto w-full flex-nowrap gap-1 overflow-x-auto rounded-xl border border-zinc-200/80 bg-zinc-100/70 p-1 sm:inline-flex sm:w-fit dark:border-zinc-800 dark:bg-zinc-900/70">
            {NAV_TABS.map((tab) => {
              const isActive =
                activeSectionId === tab.id ||
                (tab.exact
                  ? pathname === tab.href
                  : pathname === tab.href ||
                    pathname.startsWith(`${tab.href}/`));
              const Icon = tab.icon;

              return (
                <Tooltip key={tab.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={tab.href}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold tracking-wider whitespace-nowrap uppercase transition-all duration-200",
                        isActive
                          ? "bg-white text-zinc-950 shadow-xs dark:bg-zinc-800 dark:text-white"
                          : "text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200"
                      )}
                    >
                      <Icon className="size-3.5" />
                      <span>{tab.label}</span>
                      {typeof tab.count === "number" && (
                        <span
                          className={cn(
                            "ml-1 rounded-full px-1.5 py-0.2 text-[9px] font-bold tabular-nums",
                            isActive
                              ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-700 dark:text-white"
                              : "bg-zinc-200/70 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                          )}
                        >
                          {tab.count}
                        </span>
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-xs">
                    {tab.description}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
