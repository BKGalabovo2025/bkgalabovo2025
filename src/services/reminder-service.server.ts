import { Member } from "@/types/member.types";
import { Sale } from "@/types";
import {
  getMembersCollection,
  getSalesCollection,
} from "@/lib/firebase-collections";
import { getAdminDb } from "@/lib/firebase-admin";

/**
 * Finds members with overdue monthly subscription payments for the current month by fetching fresh data from the database.
 * THIS FUNCTION IS FOR SERVER-SIDE USE ONLY.
 * @returns A promise that resolves to an array of members with overdue payments.
 */
export const getOverdueMembers = async (): Promise<Member[]> => {
  const adminDb = getAdminDb();
  const membersCollectionRef = adminDb.collection(getMembersCollection().path);
  const salesCollectionRef = adminDb.collection(getSalesCollection().path);

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const startOfMonth = new Date(currentYear, currentMonth, 1);

  const [membersSnapshot, salesSnapshot] = await Promise.all([
    membersCollectionRef.where("status", "==", "active").get(),
    salesCollectionRef.where("saleDate", ">=", startOfMonth).get(),
  ]);

  const activeMembers = membersSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Member[];

  const salesThisMonth = salesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Sale[];

  const membersWithOverduePayments = activeMembers.filter((member) => {
    // Check if the member has a subscription payment for the current month.
    const hasCurrentSubscription = salesThisMonth.some(
      (sale) => sale.memberId === member.id && sale.subscriptionId // Check if it's a subscription sale
    );

    // If there is no sale for a subscription this month, their payment is overdue.
    return !hasCurrentSubscription;
  });

  return membersWithOverduePayments;
};
