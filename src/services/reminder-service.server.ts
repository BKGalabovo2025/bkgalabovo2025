import "server-only";
import { Member, Sale } from "@/types";
import { checkIsMemberOverdue } from "@/lib/membership-utils";
import {
  getMembersCollection,
  getSalesCollection,
} from "@/lib/firebase-collections";
import { getAdminDb } from "@/lib/firebase-admin";

/**
 * Finds members with overdue payments (unpaid sales) by fetching fresh data from the database.
 * THIS FUNCTION IS FOR SERVER-SIDE USE ONLY.
 * @returns A promise that resolves to an array of members with overdue payments.
 */
export const getOverdueMembers = async (): Promise<Member[]> => {
  try {
    const adminDb = getAdminDb();
    const membersCollectionRef = adminDb.collection(getMembersCollection().path);
    const salesCollectionRef = adminDb.collection(getSalesCollection().path);

    const [membersSnapshot, salesSnapshot] = await Promise.all([
      membersCollectionRef.where("status", "==", "active").get(),
      salesCollectionRef.get(),
    ]);

    const activeMembers = membersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Member[];

    const allSales = salesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Sale[];

    const membersWithOverduePayments = activeMembers.filter((member) => {
      // Find other active members in the same family to check family dues
      const familyMembers = member.familyId 
        ? activeMembers.filter((m) => m.familyId === member.familyId && m.id !== member.id)
        : [];
      
      const overdueCheck = checkIsMemberOverdue(member, familyMembers, allSales);
      return overdueCheck.isOverdue;
    });

    return membersWithOverduePayments;
  } catch (error) {
    console.error("Error in getOverdueMembers:", error);
    return [];
  }
};
