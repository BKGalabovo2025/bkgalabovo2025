"use client";

import useSWR from "swr";
import { Member, Subscription, ScheduleEvent } from "@/types";
import { getMemberById } from "@/services/member-service";
import { getSubscriptionsByMemberId } from "@/services/subscription-service";
import { getAttendancesByMemberId } from "@/services/attendance-service";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  documentId,
} from "firebase/firestore";
import { docToMember } from "@/services/member-service";

export interface Family {
  id: string;
  name?: string;
  memberIds: string[];
  siteId?: string;
}

interface MemberProfileData {
  member: Member | null;
  subscriptions: Subscription[];
  family: Family | null;
  familyMembers: Member[];
  attendances: ScheduleEvent[];
}

const fetcher = async (memberId: string): Promise<MemberProfileData> => {
  if (!memberId) {
    throw new Error("No member ID provided.");
  }

  const familiesRef = collection(db, "families");
  const q = query(familiesRef, where("memberIds", "array-contains", memberId));

  const [memberData, attendancesData, familySnapshot] = await Promise.all([
    getMemberById(memberId),
    getAttendancesByMemberId(memberId),
    getDocs(q),
  ]);

  if (!memberData) {
    throw new Error("Member not found.");
  }

  let familyData: Family | null = null;
  const familyMembers: Member[] = [];
  const targetMemberIds = [memberId];

  if (!familySnapshot.empty) {
    const familyDoc = familySnapshot.docs[0];
    familyData = { ...familyDoc.data(), id: familyDoc.id } as Family;

    // Fetch other members of the same family
    const otherMemberIds = familyData.memberIds.filter((id) => id !== memberId);
    if (otherMemberIds.length > 0) {
      targetMemberIds.push(...otherMemberIds);
      const membersRef = collection(db, "members");
      // Limit to 30 as per Firestore 'in' limitation
      const mq = query(
        membersRef,
        where(documentId(), "in", otherMemberIds.slice(0, 30))
      );
      const mSnapshot = await getDocs(mq);
      familyMembers.push(
        ...(mSnapshot.docs.map(docToMember).filter(Boolean) as Member[])
      );
    }
  }

  // Fetch subscriptions for all members in family (or just this member if no family)
  const subsResults = await Promise.all(
    targetMemberIds.map((id) => getSubscriptionsByMemberId(id))
  );
  const subscriptionsData = subsResults.flat();

  return {
    member: memberData,
    subscriptions: subscriptionsData,
    family: familyData,
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
    family: data?.family || null,
    familyMembers: data?.familyMembers || [],
    attendances: data?.attendances || [],
    loading: isLoading,
    error: error?.message || null,
    refetch: mutate,
  };
};
