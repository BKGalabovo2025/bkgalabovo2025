import { Member, Subscription } from "@/types";
import { checkIsMemberOverdue } from "@/lib/membership-utils";
import {
  getMembersCollection,
  getMemberSubscriptionsCollection,
} from "@/lib/firebase-collections";
import { getAdminDb } from "@/lib/firebase-admin";

/**
 * Finds members with overdue monthly subscription payments by fetching fresh data from the database.
 * THIS FUNCTION IS FOR SERVER-SIDE USE ONLY.
 * @returns A promise that resolves to an array of members with overdue payments.
 */
export const getOverdueMembers = async (): Promise<Member[]> => {
  const adminDb = getAdminDb();
  const membersCollectionRef = adminDb.collection(getMembersCollection().path);
  const subscriptionsCollectionRef = adminDb.collection(
    getMemberSubscriptionsCollection().path
  );

  const [membersSnapshot, subscriptionsSnapshot] = await Promise.all([
    membersCollectionRef.where("status", "==", "active").get(),
    subscriptionsCollectionRef.get(),
  ]);

  const activeMembers = membersSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Member[];

  const allSubscriptions = subscriptionsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Subscription[];

  const membersWithOverduePayments = activeMembers.filter((member) => {
    const memberSubs = allSubscriptions.filter(
      (sub) => sub.memberId === member.id
    );
    const overdueCheck = checkIsMemberOverdue(member, memberSubs);
    return overdueCheck.isOverdue;
  });

  return membersWithOverduePayments;
};
