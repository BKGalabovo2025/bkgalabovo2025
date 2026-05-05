"use client";

import useSWR from "swr";
import { Member, Subscription, ScheduleEvent } from "@/types";
import { getMemberById } from "@/services/member-service";
import { getSubscriptionsByMemberId } from "@/services/subscription-service";
import { getAttendancesByMemberId } from "@/services/attendance-service";

interface MemberProfileData {
  member: Member | null;
  subscriptions: Subscription[];
  familyMembers: Member[];
  attendances: ScheduleEvent[];
}

const fetcher = async (memberId: string): Promise<MemberProfileData> => {
  if (!memberId) {
    throw new Error("No member ID provided.");
  }

  const memberData = await getMemberById(memberId);
  if (!memberData) {
    throw new Error("Member not found.");
  }

  const [subscriptionsData, attendancesData] = await Promise.all([
    getSubscriptionsByMemberId(memberId),
    getAttendancesByMemberId(memberId),
  ]);

  const familyMembers: Member[] = [];

  return {
    member: memberData,
    subscriptions: subscriptionsData,
    familyMembers,
    attendances: attendancesData,
  };
};

export const useMemberProfile = (memberId: string) => {
  const { data, error, isLoading, mutate } = useSWR<MemberProfileData>(
    memberId ? memberId : null,
    () => fetcher(memberId)
  );

  return {
    member: data?.member || null,
    subscriptions: data?.subscriptions || [],
    familyMembers: data?.familyMembers || [],
    attendances: data?.attendances || [],
    loading: isLoading,
    error: error?.message || null,
    refetch: mutate,
  };
};
