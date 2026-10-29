"use client";

import useSWR from "swr";

import { getAdminParentPortalDataAction } from "@/lib/actions/parent-portal";
import {
  DataCorrectionRequest,
  ParentAbsence,
  ParentAccessRequest,
  ParentActivityLog,
  ParentUser,
} from "@/types/parent-portal.types";

export interface AdminMemberSummary {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  phone: string;
  parentPhone: string;
  motherPhone: string;
  fatherPhone: string;
  motherName: string;
  fatherName: string;
  familyId: string | null;
  avatarUrl: string | null;
}

export interface AdminParentPortalStats {
  pendingRequestsCount: number;
  pendingAbsencesCount: number;
  pendingCorrectionsCount: number;
  onlineParentsCount?: number;
  totalPending: number;
}

export interface AdminParentPortalCounts {
  pendingRequests: number;
  pendingAbsences: number;
  pendingCorrections: number;
  totalPending: number;
}

const fetcher = async () => {
  const res = await getAdminParentPortalDataAction();
  if (!res.success || !res.data) {
    throw new Error(res.error || "Грешка при зареждане на данните.");
  }
  return res.data;
};

const EMPTY_REQUESTS: ParentAccessRequest[] = [];
const EMPTY_PARENTS: ParentUser[] = [];
const EMPTY_ABSENCES: ParentAbsence[] = [];
const EMPTY_CORRECTIONS: DataCorrectionRequest[] = [];
const EMPTY_LOGS: ParentActivityLog[] = [];
const EMPTY_MEMBERS: AdminMemberSummary[] = [];

const DEFAULT_STATS: AdminParentPortalStats = {
  pendingRequestsCount: 0,
  pendingAbsencesCount: 0,
  pendingCorrectionsCount: 0,
  onlineParentsCount: 0,
  totalPending: 0,
};

export function isParentOnline(parent: ParentUser | null | undefined): boolean {
  if (!parent || !parent.lastActiveAt) return false;
  const diffMs = Date.now() - new Date(parent.lastActiveAt).getTime();
  return diffMs >= 0 && diffMs < 3 * 60 * 1000; // Active within last 3 minutes
}

export function useParentPortalAdmin() {
  const { data, error, isLoading, mutate } = useSWR(
    "admin-parent-portal-data",
    fetcher,
    {
      refreshInterval: 15000, // Refresh every 15s for live notifications & presence
      revalidateOnFocus: true,
    }
  );

  const requests: ParentAccessRequest[] = data?.requests || EMPTY_REQUESTS;
  const parents: ParentUser[] = data?.parents || EMPTY_PARENTS;
  const absences: ParentAbsence[] = data?.absences || EMPTY_ABSENCES;
  const corrections: DataCorrectionRequest[] =
    data?.corrections || EMPTY_CORRECTIONS;
  const activityLogs: ParentActivityLog[] = data?.activityLogs || EMPTY_LOGS;
  const members: AdminMemberSummary[] = (data?.members ||
    EMPTY_MEMBERS) as AdminMemberSummary[];

  const stats: AdminParentPortalStats = data?.stats || DEFAULT_STATS;

  const counts: AdminParentPortalCounts = {
    pendingRequests: stats.pendingRequestsCount,
    pendingAbsences: stats.pendingAbsencesCount,
    pendingCorrections: stats.pendingCorrectionsCount,
    totalPending: stats.totalPending,
  };

  const onlineParents = parents.filter((p) => isParentOnline(p));
  const onlineParentsCount = onlineParents.length;

  return {
    requests,
    parents,
    absences,
    corrections,
    activityLogs,
    onlineParents,
    onlineParentsCount,
    isParentOnline,
    members,
    stats,
    counts,
    isLoading,
    error: error?.message || null,
    refetch: mutate,
  };
}
