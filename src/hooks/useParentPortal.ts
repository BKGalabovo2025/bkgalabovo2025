"use client";

import { useState } from "react";
import useSWR from "swr";

import { getParentDashboardDataAction } from "@/lib/actions/parent-portal";
import { ParentAnnouncement } from "@/types/parent-portal.types";

export function useParentPortal(initialChildId?: string) {
  const [selectedChildId, setSelectedChildId] = useState<string>(
    initialChildId || ""
  );

  const fetcher = async ([, childId]: [string, string]) => {
    const res = await getParentDashboardDataAction(childId || undefined);
    if (!res.success || !res.data) {
      if (res.error === "UNAUTHORIZED") {
        throw new Error("UNAUTHORIZED");
      }
      throw new Error(res.error || "Грешка при зареждане на данните.");
    }
    return res.data;
  };

  const { data, error, isLoading, mutate } = useSWR(
    ["parent-portal-dashboard", selectedChildId],
    fetcher,
    {
      refreshInterval: 20000,
      revalidateOnFocus: true,
    }
  );

  return {
    parent: data?.parent || null,
    children: data?.children || [],
    selectedChild: data?.selectedChild || null,
    permissions: data?.permissions || null,
    visibleData: (data?.visibleData || null) as Record<
      string,
      string | number | boolean | null | undefined
    > | null,
    pendingCorrections: (data?.pendingCorrections || {}) as Record<
      string,
      { proposedValue: string; createdAt: string }
    >,
    absences: data?.absences || [],
    attendances: data?.attendances || [],
    nextTraining: data?.nextTraining || null,
    announcements: (data?.announcements || []) as ParentAnnouncement[],
    selectedChildId,
    setSelectedChildId,
    refetch: mutate,
    isLoading,
    error: error?.message || null,
    isUnauthorized: error?.message === "UNAUTHORIZED",
  };
}
