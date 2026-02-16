'use client';

import { useState, useEffect, useCallback } from 'react';
import { Member, Subscription, ScheduleEvent } from '@/types';
import { getMemberById, getMembersByIds } from '@/services/member-service';
import { getFamilyById } from '@/services/family-service';
import { getSubscriptionsByMemberId } from '@/services/subscription-service';
import { getAttendancesByMemberId } from '@/services/attendance-service';

interface UseMemberProfileReturn {
  member: Member | null;
  subscriptions: Subscription[];
  familyMembers: Member[];
  attendances: ScheduleEvent[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useMemberProfile = (memberId: string): UseMemberProfileReturn => {
  const [member, setMember] = useState<Member | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [familyMembers, setFamilyMembers] = useState<Member[]>([]);
  const [attendances, setAttendances] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!memberId) {
      setLoading(false);
      setError('No member ID provided.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const memberData = await getMemberById(memberId);
      if (!memberData) {
        throw new Error('Member not found.');
      }
      setMember(memberData);

      const [subscriptionsData, attendancesData] = await Promise.all([
        getSubscriptionsByMemberId(memberId),
        getAttendancesByMemberId(memberId)
      ]);
      setSubscriptions(subscriptionsData);
      setAttendances(attendancesData);

      if (memberData.familyId) {
        const family = await getFamilyById(memberData.familyId);
        if (family && family.memberIds) {
          const otherMemberIds = family.memberIds.filter(id => id !== memberId);
          if (otherMemberIds.length > 0) {
            const membersInFamily = await getMembersByIds(otherMemberIds);
            setFamilyMembers(membersInFamily);
          }
        }
      }

    } catch (err: any) {
      console.error("Error fetching member profile:", err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { member, subscriptions, familyMembers, attendances, loading, error, refetch: fetchData };
};
