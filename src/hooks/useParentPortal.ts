"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";

import { getParentDashboardDataAction } from "@/lib/actions/parent-portal";
import {
  ParentAnnouncement,
  ParentAttendanceRecord,
  ParentDocumentsData,
  ParentFeeStatusData,
  ParentRankingData,
  ParentShadowAndQuizzesData,
} from "@/types/parent-portal.types";

type ParentDashboardData = NonNullable<
  Awaited<ReturnType<typeof getParentDashboardDataAction>>["data"]
>;

export function useParentPortal(
  initialChildId?: string,
  fallbackData?: unknown
) {
  const [selectedChildId, setSelectedChildId] = useState<string>(
    initialChildId || ""
  );

  useEffect(() => {
    if (initialChildId && initialChildId !== selectedChildId) {
      setSelectedChildId(initialChildId);
    }
  }, [initialChildId, selectedChildId]);

  const fetcher = async ([, childId]: [string, string]) => {
    const res = await getParentDashboardDataAction(childId || undefined);
    const result = res as { success: boolean; data?: unknown; error?: string };
    if (!result.success || !result.data) {
      if (result.error === "UNAUTHORIZED") {
        throw new Error("UNAUTHORIZED");
      }
      throw new Error(result.error || "Грешка при зареждане на данните.");
    }
    return res.data;
  };

  const { data, error, isLoading, mutate } = useSWR(
    ["parent-portal-dashboard", selectedChildId],
    fetcher,
    {
      fallbackData: fallbackData as ParentDashboardData | undefined,
      refreshInterval: 0, // Disabled aggressive 20s polling to preserve Firestore quota; updates on tab focus, user action, or manual refetch
      revalidateOnFocus: true,
      dedupingInterval: 60000,
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
    attendances: (data?.attendances || []) as ParentAttendanceRecord[],
    nextTraining: data?.nextTraining || null,
    announcements: (data?.announcements || []) as ParentAnnouncement[],
    documentsData: (data?.documentsData || null) as ParentDocumentsData | null,
    feeStatus: (data?.feeStatus || null) as ParentFeeStatusData | null,
    rankingData: (data?.rankingData || null) as ParentRankingData | null,
    shadowAndQuizzes: (data?.shadowAndQuizzes ||
      null) as ParentShadowAndQuizzesData | null,
    selectedChildId,
    setSelectedChildId,
    refetch: mutate,
    isLoading,
    error: error?.message || null,
    isUnauthorized: error?.message === "UNAUTHORIZED",
  };
}
