
import { Member } from '@/types/member.types';
import { Sale } from '@/types';
import { FIRESTORE_COLLECTIONS } from '@/lib/firebase-collections';
import { adminDb } from '@/lib/firebase-admin';

/**
 * Finds members with overdue monthly subscription payments for the current month by fetching fresh data from the database.
 * THIS FUNCTION IS FOR SERVER-SIDE USE ONLY.
 * @returns A promise that resolves to an array of members with overdue payments.
 */
export const getOverdueMembers = async (): Promise<Member[]> => {
  const membersCollectionRef = adminDb.collection(FIRESTORE_COLLECTIONS.MEMBERS);
  const salesCollectionRef = adminDb.collection(FIRESTORE_COLLECTIONS.SALES);

  const [membersSnapshot, salesSnapshot] = await Promise.all([
    membersCollectionRef.get(),
    salesCollectionRef.get(),
  ]);

  const allMembers = membersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Member[];
  const allSales = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Sale[];

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const membersWithOverduePayments = allMembers.filter(member => {
    // Check if the member has an active subscription for the current month.
    const hasCurrentSubscription = allSales.some(sale =>
      sale.memberId === member.id &&
      sale.subscriptionId && // Check if it's a subscription sale
      new Date(sale.saleDate).getMonth() === currentMonth &&
      new Date(sale.saleDate).getFullYear() === currentYear
    );

    // If there is no sale for a subscription this month, their payment is overdue.
    return !hasCurrentSubscription;
  });

  return membersWithOverduePayments;
};
