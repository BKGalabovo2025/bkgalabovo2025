"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { useAuth } from "@/context/auth-context";
import {
  getDashboardDataServerAction,
  invalidateDashboardCacheAction,
} from "@/lib/actions/dashboard";
import { useAppStore } from "@/store/use-app-store";
import { Reminder } from "@/types";

export interface DashboardEvent {
  id: string;
  title: string;
  startDate: string;
  attendeesCount: number;
}

export interface DashboardProduct {
  id: string;
  name: string;
  stock: number;
}

export interface DashboardStats {
  revenueLast30Days?: number;
  revenueCurrentMonth?: number;
  totalClubMembers?: number;
  totalGuests?: number;
  totalRecovery?: number;
  inactiveMembersCount?: number;
  totalFamilies?: number;
  todayTrainingsCount?: number;
  todayCompetitionsCount?: number;
  todayCampsCount?: number;
  todayOtherEventsCount?: number;
  todayRecoveryCount?: number;
  todayCourtCount?: number;
  todayEventsList?: DashboardEvent[];
  revenueTrainings?: number;
  revenueServices?: number;
  revenueRecovery?: number;
  revenueCourts?: number;
  revenueShop?: number;
  revenueCamps?: number;
  lowStockCount?: number;
  lowStockProducts?: DashboardProduct[];
  newMembersCount?: number;
  totalMembers?: number;
  todayEventsCount?: number;
}

export interface DashboardData {
  stats: DashboardStats;
  reminders?: Reminder[];
}

interface DashboardContextType {
  stats: DashboardStats | null;
  reminders: Reminder[];
  refreshing: boolean;
  handleRefresh: (quiet?: boolean) => Promise<void>;
  quotaExhausted: boolean;
  isRecoveryZone: boolean;
  activeBranch: string;
  firstName: string;
  displayGreeting: string;
  displayEmail: string;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({
  initialData,
  children,
}: {
  initialData: DashboardData | null;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { activeBranch } = useAppStore();

  const [stats, setStats] = useState<DashboardStats | null>(
    initialData?.stats || null
  );
  const [reminders, setReminders] = useState<Reminder[]>(
    activeBranch === "recoveryzone" ? [] : initialData?.reminders || []
  );
  const [refreshing, setRefreshing] = useState(false);
  const [quotaExhausted, setQuotaExhausted] = useState(false);

  const checkQuotaError = (msg: string) => {
    if (msg.includes("RESOURCE_EXHAUSTED") || msg.includes("Quota")) {
      setQuotaExhausted(true);
    }
  };

  const handleRefresh = useCallback(
    async (quiet = false) => {
      if (quiet && quotaExhausted) return;
      if (!quiet) {
        setRefreshing(true);
        await invalidateDashboardCacheAction().catch(() => {});
      }
      try {
        const result = await getDashboardDataServerAction(activeBranch);
        if (result.success && "data" in result) {
          const data = result.data as DashboardData;
          setStats(data.stats);
          setReminders(
            activeBranch === "recoveryzone" ? [] : data.reminders || []
          );
          setQuotaExhausted(false);
        } else {
          checkQuotaError(("error" in result ? result.error : "") as string);
        }
      } catch (err: unknown) {
        checkQuotaError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!quiet) setRefreshing(false);
      }
    },
    [activeBranch, quotaExhausted]
  );

  useEffect(() => {
    if (!quotaExhausted) handleRefresh(true);

    const interval = setInterval(() => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
        handleRefresh(true);
      }
    }, 300000); // 5 minutes, only when tab is visible

    return () => clearInterval(interval);
  }, [handleRefresh, quotaExhausted]);

  const isRecoveryZone = activeBranch === "recoveryzone";

  const displayEmail = isRecoveryZone
    ? "recoveryzonebyzm@gmail.com"
    : user?.email || "bkgalabovo2014@gmail.com";

  const displayGreeting = isRecoveryZone
    ? "Ето какво се случва в зоната за възстановяване днес."
    : "Ето какво се случва в клуба днес.";

  const firstName = `Админ ${displayEmail}`;

  return (
    <DashboardContext.Provider
      value={{
        stats,
        reminders,
        refreshing,
        handleRefresh,
        quotaExhausted,
        isRecoveryZone,
        activeBranch,
        firstName,
        displayGreeting,
        displayEmail,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error(
      "useDashboardContext must be used within a DashboardProvider"
    );
  }
  return context;
}
