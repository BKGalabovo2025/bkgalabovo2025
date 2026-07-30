"use client";

import useSWR from "swr";

import { getMemberProfileDataServerAction } from "@/lib/actions/members";
import { Member, Sale, ScheduleEvent } from "@/types";

export interface Family {
  id: string;
  name?: string;
  memberIds: string[];
  siteId?: string;
}

interface MemberProfileData {
  member: Member | null;
  family: Family | null;
  familyMembers: Member[];
  attendances: ScheduleEvent[];
  sales: Sale[];
}

const fetcher = async (memberId: string): Promise<MemberProfileData> => {
  if (!memberId) {
    throw new Error("No member ID provided.");
  }
  const result = await getMemberProfileDataServerAction(memberId);
  if (!result.success || !result.data) {
    throw new Error(result.message || "Failed to load member profile.");
  }
  return result.data;
};

export const useMemberProfile = (
  memberId: string,
  fallbackData?: MemberProfileData
) => {
  const { data, error, isLoading, mutate } = useSWR<MemberProfileData>(
    memberId ? memberId : null,
    () => fetcher(memberId),
    {
      fallbackData,
      revalidateOnFocus: false, // Prevent excessive refetches on window focus
    }
  );

  return {
    member: data?.member || null,
    family: data?.family || null,
    familyMembers: data?.familyMembers || [],
    attendances: data?.attendances || [],
    sales: data?.sales || [],
    loading: isLoading,
    error: error?.message || null,
    refetch: mutate,
  };
};
