"use client";

import {
  Activity,
  Contact as FamilyIcon,
  PlusCircle,
  UserCog,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";

const NAV_TABS = [
  {
    href: "/members",
    label: "Всички",
    icon: Users,
    exact: true,
  },
  {
    href: "/members/club",
    label: "Клубни членове",
    icon: Users,
    exact: false,
  },
  {
    href: "/members/recovery",
    label: "Зона Възстановяване",
    icon: Activity,
    exact: false,
  },
  {
    href: "/members/guests",
    label: "Външни / Гости",
    icon: UserCog,
    exact: false,
  },
  {
    href: "/members/families",
    label: "Семейства",
    icon: FamilyIcon,
    exact: false,
  },
];

export function MembersNavHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { idToken } = useAuth();
  const { activeBranch } = useAppStore();
  const isRecoveryBranch = activeBranch === "recoveryzone";
  const [isSyncing, setIsSyncing] = useState(false);

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
          `Успешно синхронизирани! Деактивирани: ${data.deactivatedCount}, Активирани: ${data.activatedCount}`
        );
        router.refresh();
      } else {
        toast.error("Грешка: " + (data.error || "Неуспешна синхронизация"));
      }
    } catch (e: unknown) {
      console.error("Sync statuses error:", e);
      toast.error("Възникна грешка при синхронизацията.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-3.5 pb-2 duration-500 animate-in fade-in">
      <PageHeader
        title={isRecoveryBranch ? "Членове на зоната" : "Членове на клуба"}
        description={
          isRecoveryBranch
            ? "Управление на профили, здравни досиета и статуси на клиентите."
            : "Управление на профили, членски карти и статуси на спортистите."
        }
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Членове", href: "/members" },
        ]}
      >
        <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
          <Button
            variant="outline"
            onClick={handleSyncStatuses}
            disabled={isSyncing}
            className="h-9 w-full rounded-xl border-zinc-200 px-3.5 text-[10px] font-medium tracking-widest uppercase hover:bg-zinc-50 sm:h-9.5 sm:w-auto sm:px-4 sm:text-xs"
          >
            <Activity
              className={cn("mr-1.5 size-3.5", isSyncing && "animate-spin")}
            />{" "}
            Синхронизирай статуси
          </Button>
          <Button
            onClick={() => router.push("/members/new")}
            className="h-9 w-full rounded-xl bg-zinc-950 px-3.5 text-[10px] font-medium tracking-widest text-white uppercase shadow-none hover:bg-zinc-800 sm:h-9.5 sm:w-auto sm:px-4 sm:text-xs"
          >
            <PlusCircle className="mr-1.5 size-3.5" /> Нов член
          </Button>
        </div>
      </PageHeader>

      {/* Навигационни подстраници (Табове) */}
      <div className="no-scrollbar flex h-auto w-full flex-nowrap gap-1.5 overflow-x-auto rounded-xl border border-zinc-100 bg-zinc-100/80 p-1 sm:inline-flex sm:w-fit dark:border-zinc-800 dark:bg-zinc-900/80">
        {NAV_TABS.map((tab) => {
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[10px] font-semibold tracking-wider whitespace-nowrap uppercase transition-all duration-200",
                isActive
                  ? "bg-white text-zinc-950 shadow-xs dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200"
              )}
            >
              <Icon className="size-3.5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
